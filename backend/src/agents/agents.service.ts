import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgentContractStatus, InquiryStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../storage/supabase.service';
import { MailService } from '../mail/mail.service';
import { promises as fs } from 'fs';
import * as path from 'path';

import { CreateAgentDto } from './dto/create-agent.dto';
import { UpdateAgentDto } from './dto/update-agent.dto';
import { CreateCategoryDto, UpdateCategoryDto, SetCategoryAccessDto, AssignAgentCategoryDto } from './dto/category.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgentsService {
  constructor(
    private prisma: PrismaService,
    private supabaseService: SupabaseService,
    private mailService: MailService,
  ) {}


  async onboard(createAgentDto: CreateAgentDto) {
    if (!createAgentDto.branch_id) {
      throw new BadRequestException('Branch is required for agent onboarding');
    }
    if (!createAgentDto.category_id) {
      throw new BadRequestException('Category is required for agent onboarding');
    }

    const [branch, category] = await Promise.all([
      this.prisma.branch.findUnique({ where: { id: createAgentDto.branch_id }, select: { id: true } }),
      this.prisma.agentCategory.findUnique({ where: { id: createAgentDto.category_id }, select: { id: true, is_active: true } }),
    ]);

    if (!branch) throw new BadRequestException('Selected branch does not exist');
    if (!category || category.is_active === false) {
      throw new BadRequestException('Selected category is invalid or inactive');
    }

    const existing = await this.prisma.agent.findFirst({
      where: {
        OR: [{ email: createAgentDto.email }, { mobile: createAgentDto.mobile }],
      },
    });

    if (existing) {
      throw new ConflictException('Agent with this email or mobile already exists');
    }

    const hashedPassword = await bcrypt.hash(createAgentDto.password, 10);

    const agent = await this.prisma.agent.create({
      data: {
        ...createAgentDto,
        password: hashedPassword,
        branch_id: createAgentDto.branch_id,
        category_id: createAgentDto.category_id,
        status: 'PENDING',
      },
    });

    const { password, ...result } = agent;
    return result;
  }

  async findAll(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
    const where = status ? { status } : {};
    return this.prisma.agent.findMany({
      where,
      include: { documents: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      include: { documents: true },
    });
    if (!agent) throw new NotFoundException('Agent not found');
    const { password, ...result } = agent;
    return result;
  }

  async updateStatus(id: string, status: 'APPROVED' | 'REJECTED', reason?: string) {
    return this.prisma.agent.update({
      where: { id },
      data: {
        status,
        rejection_reason: reason,
      },
    });
  }

  async updateAgent(id: string, dto: UpdateAgentDto) {
    const existing = await this.prisma.agent.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Agent not found');

    const mergedBranchId = dto.branch_id ?? existing.branch_id;
    const mergedCategoryId = dto.category_id ?? existing.category_id;
    if (!mergedBranchId) throw new BadRequestException('Agent must have a branch assigned');
    if (!mergedCategoryId) throw new BadRequestException('Agent must have a category assigned');

    if (dto.branch_id) {
      const branch = await this.prisma.branch.findUnique({ where: { id: dto.branch_id }, select: { id: true } });
      if (!branch) throw new BadRequestException('Selected branch does not exist');
    }

    if (dto.category_id) {
      const category = await this.prisma.agentCategory.findUnique({
        where: { id: dto.category_id },
        select: { id: true, is_active: true },
      });
      if (!category || category.is_active === false) {
        throw new BadRequestException('Selected category is invalid or inactive');
      }
    }

    let password: string | undefined;
    if (dto.password) {
      password = await bcrypt.hash(dto.password, 10);
    }

    const updated = await this.prisma.agent.update({
      where: { id },
      data: {
        name: dto.name ?? undefined,
        email: dto.email ?? undefined,
        mobile: dto.mobile ?? undefined,
        agency_name: dto.agency_name ?? undefined,
        website: dto.website ?? undefined,
        region: dto.region ?? undefined,
        country: dto.country ?? undefined,
        state: dto.state ?? undefined,
        city: dto.city ?? undefined,
        address: dto.address ?? undefined,
        business_reg_no: dto.business_reg_no ?? undefined,
        branch_id: mergedBranchId,
        category_id: mergedCategoryId,
        ...(password ? { password } : {}),
      },
    });

    const { password: _password, ...result } = updated as any;
    return result;
  }

  async uploadDocument(agentId: string, fileUrl: string, title: string) {
    return this.prisma.agentDocument.create({
      data: {
        agent_id: agentId,
        file_url: fileUrl,
        title,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.agent.delete({ where: { id } });
  }

  async findByEmail(email: string) {
    return this.prisma.agent.findUnique({ where: { email } });
  }

  async findTeamMemberByEmail(email: string) {
    return this.prisma.agentTeamMember.findUnique({
      where: { email },
      include: { agent: true },
    });
  }

  async findTeamMemberById(id: string) {
    return this.prisma.agentTeamMember.findUnique({
      where: { id },
      include: { agent: true },
    });
  }

  async setUniversityAccess(agentId: string, universityIds: string[]) {
    const agent = await this.prisma.agent.findUnique({ where: { id: agentId } });
    if (!agent) throw new NotFoundException('Agent not found');

    return this.prisma.$transaction(async (tx) => {
      await tx.agentUniversityAccess.deleteMany({ where: { agent_id: agentId } });
      if (!universityIds.length) return [];
      await tx.agentUniversityAccess.createMany({
        data: universityIds.map((universityId) => ({
          agent_id: agentId,
          university_id: universityId,
        })),
        skipDuplicates: true,
      });
      return tx.agentUniversityAccess.findMany({ where: { agent_id: agentId } });
    });
  }

  async getUniversityAccess(agentId: string) {
    return this.prisma.agentUniversityAccess.findMany({
      where: { agent_id: agentId },
      include: { university: true },
    });
  }

  // --- Category Management ---

  async createCategory(dto: CreateCategoryDto) {
    return this.prisma.agentCategory.create({
      data: dto,
    });
  }

  async findAllCategories() {
    return this.prisma.agentCategory.findMany({
      include: {
        _count: { select: { agents: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.agentCategory.findUnique({
      where: { id },
      include: {
        university_access: {
          include: { university: true },
        },
      },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    return this.prisma.agentCategory.update({
      where: { id },
      data: dto,
    });
  }

  async removeCategory(id: string) {
    const count = await this.prisma.agent.count({ where: { category_id: id } });
    if (count > 0) throw new BadRequestException('Cannot delete category with assigned agents');
    return this.prisma.agentCategory.delete({ where: { id } });
  }

  async setCategoryAccess(id: string, dto: SetCategoryAccessDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.categoryUniversityAccess.deleteMany({ where: { category_id: id } });
      
      if (dto.access.length > 0) {
        await tx.categoryUniversityAccess.createMany({
          data: dto.access.map(a => ({
            category_id: id,
            university_id: a.university_id,
            commission_percent: a.commission_percent,
            is_active: a.is_active ?? true,
          })),
        });
      }
      
      return tx.categoryUniversityAccess.findMany({
        where: { category_id: id },
        include: { university: true },
      });
    });
  }

  async getCategoryAccess(id: string) {
    return this.prisma.categoryUniversityAccess.findMany({
      where: { category_id: id },
      include: { university: true },
    });
  }

  async assignCategory(agentId: string, categoryId: string | null) {
    return this.prisma.agent.update({
      where: { id: agentId },
      data: { category_id: categoryId },
    });
  }


  async getMyTeam(agentId: string) {
    return this.prisma.agentTeamMember.findMany({
      where: { agent_id: agentId },
      orderBy: { created_at: 'desc' },
    });
  }

  async createTeamMember(agentId: string, data: any) {
    const existing = await this.prisma.agentTeamMember.findFirst({
      where: {
        OR: [{ email: data.email }, { mobile: data.mobile }],
      },
    });
    if (existing) throw new ConflictException('Team member with this email/mobile already exists');

    if (!data.password || data.password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.agentTeamMember.create({
      data: {
        agent_id: agentId,
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        password: hashedPassword,
        is_active: data.is_active ?? true,
      },
    });
  }

  async updateTeamMember(agentId: string, id: string, data: any) {
    const existing = await this.prisma.agentTeamMember.findUnique({ where: { id } });
    if (!existing || existing.agent_id !== agentId) {
      throw new NotFoundException('Team member not found');
    }

    let password: string | undefined;
    if (data.password) {
      password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.agentTeamMember.update({
      where: { id },
      data: {
        name: data.name ?? undefined,
        email: data.email ?? undefined,
        mobile: data.mobile ?? undefined,
        is_active: data.is_active ?? undefined,
        ...(password ? { password } : {}),
      },
    });
  }

  async deleteTeamMember(agentId: string, id: string) {
    const existing = await this.prisma.agentTeamMember.findUnique({ where: { id } });
    if (!existing || existing.agent_id !== agentId) {
      throw new NotFoundException('Team member not found');
    }

    await this.prisma.leads.updateMany({
      where: { agent_team_member_id: id },
      data: { agent_team_member_id: null },
    });

    return this.prisma.agentTeamMember.delete({ where: { id } });
  }

  async assignLeadToTeamMember(agentId: string, leadId: string, teamMemberId: string) {
    const member = await this.prisma.agentTeamMember.findUnique({ where: { id: teamMemberId } });
    if (!member || member.agent_id !== agentId) {
      throw new NotFoundException('Team member not found');
    }

    const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.agent_id && lead.agent_id !== agentId) {
      throw new BadRequestException('Lead is not owned by this agent');
    }

    return this.prisma.leads.update({
      where: { id: leadId },
      data: { agent_id: agentId, agent_team_member_id: teamMemberId },
    });
  }

  async createInquiry(data: any) {
    // Check if an inquiry already exists for this email and is NOT rejected
    const existingInquiry = await this.prisma.agentInquiry.findFirst({
      where: {
        email: data.email,
        status: { not: 'REJECTED' },
      },
    });

    if (existingInquiry) {
      throw new ConflictException(
        'An active inquiry with this email already exists. Please wait for us to contact you or reach out to support.',
      );
    }

    const inquiry = await this.prisma.agentInquiry.create({
      data: {
        name: data.name,
        email: data.email,
        mobile: data.mobile,
        company_name: data.company_name,
        website: data.website,
        country: data.country,
        city: data.city,
        experience_years: data.experience_years,
        student_volume: data.student_volume,
        message: data.message,
        // Enhanced fields
        company_address: data.company_address,
        contact_person: data.contact_person,
        contact_designation: data.contact_designation,
        contact_department: data.contact_department,
        source_country: data.source_country,
        operation_countries: data.operation_countries,
        phone: data.phone,
        accreditation_details: data.accreditation_details,
        associations: data.associations,
        moe_approvals: data.moe_approvals,
        documents: data.documents ? {
          create: data.documents.map(doc => ({
            label: doc.label,
            file_url: doc.file_url,
          })),
        } : undefined,
      },
    });

    // Send confirmation email
    await this.mailService.sendTemplateEmail(data.email, 'INQUIRY_RECEIVED', {
      name: data.name,
      company: data.company_name || 'Your Agency',
    });

    return inquiry;
  }

  private resolvePublicBaseUrl(req?: any): string {
    const envUrl = process.env.API_BASE_URL || process.env.BACKEND_PUBLIC_URL;
    if (envUrl) return envUrl.replace(/\/+$/, '');
    if (!req) return 'http://localhost:5005';

    const forwardedProto = (req.headers?.['x-forwarded-proto'] || '').toString().split(',')[0].trim();
    const forwardedHost = (req.headers?.['x-forwarded-host'] || '').toString().split(',')[0].trim();
    const protocol = forwardedProto || req.protocol || 'http';
    const host = forwardedHost || req.get?.('host') || req.headers?.host;
    if (!host) return 'http://localhost:5005';
    return `${protocol}://${host}`;
  }

  async uploadInquiryDocument(file: Express.Multer.File, req?: any) {
    if (!file) throw new BadRequestException('File is required');

    const folder = `inquiries/${Date.now()}`;
    const bucket = process.env.SUPABASE_BUCKET || 'idb-student-documents';
    let fileUrl: string;

    try {
      fileUrl = await this.supabaseService.uploadFile(file, folder, bucket);
    } catch (error) {
      // Keep inquiry flow unblocked when Supabase is unavailable/misconfigured.
      // eslint-disable-next-line no-console
      console.error('[AgentsService] Inquiry upload fallback activated', {
        bucket,
        folder,
        error: error instanceof Error ? error.message : error,
      });

      const uploadsDir = path.join(process.cwd(), 'uploads', folder);
      await fs.mkdir(uploadsDir, { recursive: true });
      const safeName = `${Date.now()}-${(file.originalname || 'inquiry-document').replace(/[^a-zA-Z0-9._-]/g, '_')}`;
      const fullPath = path.join(uploadsDir, safeName);
      await fs.writeFile(fullPath, file.buffer);

      const baseUrl = this.resolvePublicBaseUrl(req);
      fileUrl = `/uploads/${folder}/${safeName}`;
    }

    return { file_url: fileUrl };
  }


  async getInquiries(status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED') {
    return this.prisma.agentInquiry.findMany({
      where: status ? { status } : {},
      include: { documents: true },
      orderBy: { created_at: 'desc' },
    });
  }

  async updateInquiryStatus(id: string, status: InquiryStatus, branchId?: string, categoryId?: string) {
    const updated = await this.prisma.agentInquiry.update({
      where: { id },
      data: { status },
      include: { documents: true },
    }) as any;

    if (status === ('APPROVED' as any)) {
      await this.mailService.sendTemplateEmail(updated.email, 'AGENT_ONBOARDING', {
        name: updated.name,
        company: updated.company_name,
        login_url: 'https://b2b.idbconnect.global/login',
      });
    }

    if (status === ('CONVERTED' as any)) {
      if (!branchId || !categoryId) {
        throw new BadRequestException('Branch and category are required to convert inquiry to agent');
      }

      const [branch, category] = await Promise.all([
        this.prisma.branch.findUnique({ where: { id: branchId }, select: { id: true } }),
        this.prisma.agentCategory.findUnique({ where: { id: categoryId }, select: { id: true, is_active: true } }),
      ]);
      if (!branch) throw new BadRequestException('Selected branch does not exist');
      if (!category || category.is_active === false) {
        throw new BadRequestException('Selected category is invalid or inactive');
      }

      let agent = await this.prisma.agent.findFirst({
        where: {
          OR: [
            { email: updated.email },
            { mobile: updated.mobile },
          ],
        },
      });

      if (!agent) {
        const tempPassword = await bcrypt.hash(`Temp@${Date.now()}`, 10);
        const createdAgent = await this.prisma.agent.create({
          data: {
            name: updated.name,
            email: updated.email,
            mobile: updated.mobile,
            password: tempPassword,
            agency_name: updated.company_name || updated.name,
            website: updated.website || undefined,
            country: updated.country || 'Unknown',
            state: 'Unknown',
            city: updated.city || 'Unknown',
            address: updated.company_address || 'Unknown',
            region: updated.region || updated.country || 'Unknown',
            branch_id: branchId,
            category_id: categoryId,
            status: 'PENDING',
          },
        });
        agent = createdAgent;

        // Copy inquiry documents to agent documents if they exist
        if (updated.documents.length > 0) {
          await this.prisma.agentDocument.createMany({
            data: updated.documents.map(doc => ({
              agent_id: createdAgent.id,
              title: doc.label,
              file_url: doc.file_url,
            })),
          });
        }
      }

      if (!agent) {
        return updated;
      }

      if (!agent.branch_id || !agent.category_id) {
        agent = await this.prisma.agent.update({
          where: { id: agent.id },
          data: {
            branch_id: agent.branch_id || branchId,
            category_id: agent.category_id || categoryId,
          },
        });
      }

      // Ensure converted inquiry always enters the agreement stage.
      const existingContract = await this.prisma.agentContract.findFirst({
        where: { agent_id: agent.id },
        orderBy: { created_at: 'desc' },
      });

      if (!existingContract) {
        const latestGeneralTemplate = await this.prisma.agentContract.findFirst({
          where: { agent_id: null },
          orderBy: { created_at: 'desc' },
        });

        await this.prisma.agentContract.create({
          data: {
            agent_id: agent.id,
            title:
              latestGeneralTemplate?.title ||
              `${updated.company_name || updated.name} Agreement`,
            content:
              latestGeneralTemplate?.content ||
              `<p>Agreement for ${updated.company_name || updated.name}.</p>`,
            status: AgentContractStatus.PENDING,
          },
        });
      }
    }

    return updated;
  }
}
