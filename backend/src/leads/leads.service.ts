import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import {
  BulkAssignDto,
  BulkStatusDto,
  BulkMessageDto,
  BulkDeleteDto,
} from './dto/bulk-update.dto';
import { Prisma } from '@prisma/client';
import { TimelineService } from '../timeline/timeline.service';
import * as bcrypt from 'bcrypt';
import { getScope } from '../common/utils/scope.util';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private timelineService: TimelineService,
  ) { }

  private generateRandomPassword(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async create(createLeadDto: CreateLeadDto, user?: any) { 
    
    const password = this.generateRandomPassword();
    const hashedPassword = await this.hashPassword(password);

    let partnerId: string | null = null;
    let agentId: string | null = null;

    if (user?.id) {
      if (user.type === 'agent') {
        agentId = user.id;
      } else {
        partnerId = user.id;
      }
    } 
    else if (createLeadDto.created_by) {
      partnerId = createLeadDto.created_by;
    } else if (createLeadDto.agent_id) {
      agentId = createLeadDto.agent_id;
    }
    
    const finalPreferredCountry = createLeadDto.preferred_country || "India"; 

    return this.prisma.leads.create({
      data: {
        name: createLeadDto.name,
        email: createLeadDto.email,
        mobile: createLeadDto.mobile,
        type: createLeadDto.type || 'lead',
        status: createLeadDto.status || 'new',
        preferred_country: finalPreferredCountry,
        preferred_course: createLeadDto.preferred_course,
        exam_taken: createLeadDto.exam_taken,
        exam_score: createLeadDto.exam_score,
        utm_source: createLeadDto.utm_source,
        utm_medium: createLeadDto.utm_medium,
        utm_campaign: createLeadDto.utm_campaign,
        created_by: partnerId, 
        agent_id: agentId,     
        assigned_to: createLeadDto.assigned_to,
        password: hashedPassword,
        is_flagged: false,
        branch_id: createLeadDto.branch_id,
      },
    });
  }

  async bulkAssign(bulkAssignDto: BulkAssignDto, user: any) {
    const { leadIds, counsellorId } = bulkAssignDto;

    if (counsellorId) {
      const counsellor = await this.prisma.partners.findUnique({
        where: { id: counsellorId },
        include: { role: true },
      });
      if (!counsellor || counsellor.role.name !== 'counsellor') {
        throw new NotFoundException(`Counsellor with ID ${counsellorId} not found.`);
      }
    }

    const result = await this.prisma.leads.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        assigned_to: counsellorId,
      },
    });

    return result;
  }

  async bulkUpdateStatus(bulkStatusDto: BulkStatusDto, user: any) {
    const { leadIds, status, reason } = bulkStatusDto;

    const result = await this.prisma.leads.updateMany({
      where: { id: { in: leadIds } },
      data: { status, reason: reason || null },
    });

    leadIds.forEach(async (leadId) => {
      await this.timelineService.logStatusChange(leadId, user.id, 'Previous', status);
    });

    return result;
  }

  async bulkSendMessage(bulkMessageDto: BulkMessageDto, user: any) {
    const { leadIds, message } = bulkMessageDto;

    const leads = await this.prisma.leads.findMany({
      where: {
        id: { in: leadIds },
      },
      select: {
        id: true,
        name: true,
        mobile: true,
      },
    });

    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      try {
        successCount++;
      } catch (error) {
        console.error(`Failed to send message to lead ${lead.id}:`, error);
        failCount++;
      }
    }

    return {
      success: successCount,
      failed: failCount,
      total: leads.length,
    };
  }

  async findAll(
    user: any,
    assignedTo?: string,
    createdBy?: string,
    type?: string,
    branchId?: string,
    email?: string,
    source?: string, // Feature 9: segmentation
  ) {
    let where: any = { type: type || 'lead' };

    if (branchId) {
      where.branch_id = branchId;
    } else {
      const scope = getScope(user);
      where = { ...where, ...scope };
    }

    if (assignedTo) where.assigned_to = assignedTo;
    if (createdBy) where.created_by = createdBy;
    if (email) where.email = email;
    
    // Feature 9: Segmentation
    if (source === 'agent') {
      where.agent_id = { not: null };
    } else if (source === 'direct') {
      where.agent_id = null;
    }

    return this.prisma.leads.findMany({
      where,
      include: {
        partners_leads_assigned_toTopartners: {
          select: { name: true, email: true },
        },
        ...(type === 'application' && {
          applications: {
            include: {
              preferences: true,
            },
          },
        }),
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async login(email: string, password: string) {
    try {
      const lead = await this.prisma.leads.findUnique({
        where: { email },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found with the provided email.');
      }

      const isPasswordValid = await bcrypt.compare(password, lead.password ?? "");
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password.');
      }

      const { password: _, ...leadData } = lead;
      return leadData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    if (typeof id !== 'string' || (id.length !== 36 && id.length !== 32)) {
      throw new BadRequestException('Invalid id: incorrect UUID length');
    }

    try {
      const lead = await this.prisma.leads.findUnique({
        where: { id },
        include: {
          partners_leads_assigned_toTopartners: { select: { name: true, email: true } },
          courses: {
            include: {
              university: {
                include: {
                  country: true,
                },
              },
            },
          },
        },
      });

      if (!lead) {
        throw new NotFoundException(`Lead not found for id: ${id}`);
      }

      return lead;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to retrieve lead');
    }
  }

  async update(id: string, updateLeadDto: Prisma.leadsUpdateInput) {
    return this.prisma.leads.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.leads.delete({
        where: { id },
      });
      return { message: `Lead with ID ${id} deleted successfully.` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Lead with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Failed to delete lead.');
    }
  }

  async bulkDelete(bulkDeleteDto: BulkDeleteDto) {
    const { leadIds } = bulkDeleteDto;
    const result = await this.prisma.leads.deleteMany({
      where: {
        id: { in: leadIds },
      },
    });
    return { message: `Successfully deleted ${result.count} leads.` };
  }

  async findMyApplications(userId?: string) {
    if (!userId) {
       // Feature 8: Head-office Leads isolation - never return all leads for agents
       return [];
    }

    const where: Prisma.leadsWhereInput = {
      type: { in: ['lead', 'application', 'visa'] },
      // Feature 8: isolation
      agent_id: { not: null }
    };

    where.OR = [
      { created_by: userId },
      { agent_id: userId }
    ];

    return this.prisma.leads.findMany({
      where,
      include: {
        partners_leads_assigned_toTopartners: {
          select: { name: true, email: true },
        },
        agent: {
          select: { name: true, agency_name: true }
        }
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async addCourseToLead(leadId: string, courseId: string, user?: any) {
    const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.leads.update({
      where: { id: leadId },
      data: {
        courses: {
          connect: [{ id: courseId }],
        },
      },
    });
    return { success: true };
  }

  async removeCourseFromLead(leadId: string, courseId: string, user?: any) {
    const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    await this.prisma.leads.update({
      where: { id: leadId },
      data: {
        courses: {
          disconnect: [{ id: courseId }],
        },
      },
    });
    return { success: true };
  }

  async assignTeamMember(leadId: string, teamMemberId: string, user: any) {
    const agentId = user?.id || user?.userId;
    if (!agentId) throw new BadRequestException('Invalid user context');

    const member = await this.prisma.agentTeamMember.findUnique({
      where: { id: teamMemberId },
    });
    if (!member || member.agent_id !== agentId) {
      throw new NotFoundException('Team member not found');
    }

    const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
    if (!lead) throw new NotFoundException('Lead not found');
    if (lead.agent_id && lead.agent_id !== agentId) {
      throw new BadRequestException('Lead is not owned by the agent');
    }

    return this.prisma.leads.update({
      where: { id: leadId },
      data: {
        agent_id: agentId,
        agent_team_member_id: teamMemberId,
      },
    });
  }
}
