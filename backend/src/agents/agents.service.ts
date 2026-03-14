import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgentDto } from './dto/create-agent.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AgentsService {
  constructor(private prisma: PrismaService) {}

  async onboard(createAgentDto: CreateAgentDto) {
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
        branch_id: createAgentDto.branch_id || null,
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
    return this.prisma.agentInquiry.create({
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
      },
    });
  }

  async getInquiries(status?: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED') {
    return this.prisma.agentInquiry.findMany({
      where: status ? { status } : {},
      orderBy: { created_at: 'desc' },
    });
  }

  async updateInquiryStatus(id: string, status: 'NEW' | 'CONTACTED' | 'CONVERTED' | 'REJECTED') {
    return this.prisma.agentInquiry.update({
      where: { id },
      data: { status },
    });
  }
}
