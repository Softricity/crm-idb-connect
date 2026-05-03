import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
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
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private timelineService: TimelineService,
    private jwtService: JwtService,
  ) { }

  private isAdminLike(user: any): boolean {
    const role = String(user?.role || '').toLowerCase().trim();
    return role === 'admin' || role.includes('super');
  }

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
    // Check if lead already exists by email or mobile
    const existingLead = await this.prisma.leads.findFirst({
      where: {
        OR: [
          { email: createLeadDto.email },
          { mobile: createLeadDto.mobile },
        ],
      },
    });

    if (existingLead) {
      // If found, update the existing lead instead of creating a duplicate
      // We exclude fields that shouldn't be overridden by a public re-inquiry
      const { type, status, branch_id, created_by, agent_id, ...updateData } = createLeadDto;
      
      return this.update(existingLead.id, {
        ...updateData,
        // Optional: you might want to preserve the original utm if they exist, 
        // or update them to the latest. Here we let updateData override them.
      }, user);
    }

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

    const lead = await this.prisma.leads.create({
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

    // Send Welcome Email with credentials
    if (lead.email && password) {
      await this.mailService.sendWelcomeEmail(lead.email, password);
    }

    return lead;
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
    source?: string,
    page = 1,
    limit = 10,
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

    const skip = (page - 1) * limit;

    const [total, leads] = await Promise.all([
      this.prisma.leads.count({ where }),
      this.prisma.leads.findMany({
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
        skip,
        take: limit,
      }),
    ]);

    const data = await this.withForwardEligibility(leads);
    
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
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

        return this.withForwardEligibilityForOne(lead);
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Failed to retrieve lead');
    }
  }

  private normalizeLeadFieldValue(value?: string | null): string {
    const normalized = (value ?? '').toString().trim();
    return normalized ? normalized : '-';
  }

  private toTitleCase(value: string): string {
    if (!value || value === '-') {
      return value;
    }

    return value
      .replace(/[_-]+/g, ' ')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private mapLeadTypeForTimeline(value: string): string {
    if (value === '-') {
      return '-';
    }

    const normalized = value.toLowerCase();
    if (normalized === 'lead') {
      return 'Lead';
    }
    if (normalized === 'application') {
      return 'Application';
    }
    if (normalized === 'visa') {
      return 'Visa';
    }

    return this.toTitleCase(value);
  }

  private buildLeadDetailsDiff(
    before: {
      preferred_country?: string | null;
      preferred_course?: string | null;
      exam_taken?: string | null;
      exam_score?: string | null;
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
    },
    after: {
      preferred_country?: string | null;
      preferred_course?: string | null;
      exam_taken?: string | null;
      exam_score?: string | null;
      utm_source?: string | null;
      utm_medium?: string | null;
      utm_campaign?: string | null;
    },
  ): { oldState: string; newState: string } | null {
    const fields: Array<{ key: keyof typeof before; label: string }> = [
      { key: 'preferred_country', label: 'Country' },
      { key: 'preferred_course', label: 'Course' },
      { key: 'exam_taken', label: 'Exam' },
      { key: 'exam_score', label: 'Score' },
      { key: 'utm_source', label: 'Source' },
      { key: 'utm_medium', label: 'Medium' },
      { key: 'utm_campaign', label: 'Campaign' },
    ];

    const oldParts: string[] = [];
    const newParts: string[] = [];

    for (const field of fields) {
      const oldValue = this.normalizeLeadFieldValue(before[field.key] as string | null | undefined);
      const newValue = this.normalizeLeadFieldValue(after[field.key] as string | null | undefined);

      if (oldValue !== newValue) {
        oldParts.push(`${field.label}: ${oldValue}`);
        newParts.push(`${field.label}: ${newValue}`);
      }
    }

    if (!oldParts.length) {
      return null;
    }

    return {
      oldState: oldParts.join(' | '),
      newState: newParts.join(' | '),
    };
  }

  private buildLeadTypeDiff(
    before: { type?: string | null },
    after: { type?: string | null },
  ): { oldState: string; newState: string } | null {
    const oldType = this.mapLeadTypeForTimeline(this.normalizeLeadFieldValue(before.type));
    const newType = this.mapLeadTypeForTimeline(this.normalizeLeadFieldValue(after.type));

    if (oldType === newType) {
      return null;
    }

    return {
      oldState: oldType,
      newState: newType,
    };
  }

  private async resolveTimelineActorId(user?: any): Promise<string | null> {
    const actorId = user?.id || user?.userId;
    if (!actorId) {
      return null;
    }

    const partner = await this.prisma.partners.findUnique({
      where: { id: actorId },
      select: { id: true },
    });

    return partner?.id || null;
  }

  private extractStringUpdateValue(value: unknown): string | null | undefined {
    if (value === undefined) {
      return undefined;
    }

    if (value === null) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object' && value !== null && 'set' in value) {
      const setValue = (value as { set?: unknown }).set;
      if (setValue === undefined) {
        return undefined;
      }
      if (setValue === null) {
        return null;
      }
      if (typeof setValue === 'string') {
        return setValue;
      }
    }

    return undefined;
  }

  private normalizeStatusToken(value?: string | null): string {
    return (value || '').toString().trim().toLowerCase();
  }

  private async buildTerminalStatusLookup(departmentIds: Array<string | null | undefined>) {
    const uniqueDepartmentIds = Array.from(
      new Set(departmentIds.filter((departmentId): departmentId is string => Boolean(departmentId))),
    );

    const lookupByDepartment = new Map<string, Set<string>>();
    const fallbackTerminalTokens = new Set<string>(['cold', 'rejected', 'converted']);

    const terminalStatuses = await this.prisma.department_status.findMany({
      where: {
        is_active: true,
        is_terminal: true,
        ...(uniqueDepartmentIds.length
          ? { department_id: { in: uniqueDepartmentIds } }
          : {}),
      },
      select: {
        department_id: true,
        key: true,
        label: true,
      },
    });

    for (const status of terminalStatuses) {
      const statusTokens = [
        this.normalizeStatusToken(status.key),
        this.normalizeStatusToken(status.label),
      ].filter(Boolean);

      if (!lookupByDepartment.has(status.department_id)) {
        lookupByDepartment.set(status.department_id, new Set<string>());
      }

      const tokenSet = lookupByDepartment.get(status.department_id)!;
      for (const token of statusTokens) {
        tokenSet.add(token);
        fallbackTerminalTokens.add(token);
      }
    }

    return {
      lookupByDepartment,
      fallbackTerminalTokens,
    };
  }

  private async withForwardEligibility<
    T extends {
      type?: string | null;
      status?: string | null;
      current_department_id?: string | null;
    },
  >(leads: T[]): Promise<Array<T & { can_forward_to_next_department: boolean }>> {
    const { lookupByDepartment, fallbackTerminalTokens } = await this.buildTerminalStatusLookup(
      leads.map((lead) => lead.current_department_id),
    );

    return leads.map((lead) => {
      const normalizedType = (lead.type || 'lead').toLowerCase();
      const hasNextDepartment = normalizedType === 'lead' || normalizedType === 'application';

      const statusToken = this.normalizeStatusToken(lead.status);
      const terminalTokensForDepartment = lead.current_department_id
        ? lookupByDepartment.get(lead.current_department_id)
        : undefined;

      const resolvedTerminalTokens =
        terminalTokensForDepartment && terminalTokensForDepartment.size > 0
          ? terminalTokensForDepartment
          : fallbackTerminalTokens;

      const isTerminalStatus = Boolean(statusToken && resolvedTerminalTokens.has(statusToken));

      return {
        ...lead,
        can_forward_to_next_department: hasNextDepartment && isTerminalStatus,
      };
    });
  }

  private async withForwardEligibilityForOne<
    T extends {
      type?: string | null;
      status?: string | null;
      current_department_id?: string | null;
    },
  >(lead: T): Promise<T & { can_forward_to_next_department: boolean }> {
    const [decoratedLead] = await this.withForwardEligibility([lead]);
    return decoratedLead;
  }

  private async resolveForwardTargetDepartmentId(
    currentDepartmentId: string | null | undefined,
    requestedTypeIndex: number,
  ): Promise<string | null> {
    const activeDepartmentOrders = await this.prisma.department_order.findMany({
      where: { is_active: true },
      orderBy: { order_index: 'asc' },
      select: {
        department_id: true,
        is_default: true,
      },
    });

    if (!activeDepartmentOrders.length) {
      return null;
    }

    if (currentDepartmentId) {
      const currentOrderIndex = activeDepartmentOrders.findIndex(
        (entry) => entry.department_id === currentDepartmentId,
      );

      if (currentOrderIndex !== -1) {
        return activeDepartmentOrders[currentOrderIndex + 1]?.department_id ?? null;
      }
    }

    if (requestedTypeIndex >= 0) {
      const fallbackByStage = activeDepartmentOrders[requestedTypeIndex];
      if (fallbackByStage?.department_id) {
        return fallbackByStage.department_id;
      }
    }

    const fallbackDefault =
      activeDepartmentOrders.find((entry) => entry.is_default) ||
      activeDepartmentOrders[0];
    return fallbackDefault?.department_id ?? null;
  }

  private async resolveInitialStatusForDepartment(departmentId: string): Promise<string | null> {
    const defaultStatus = await this.prisma.department_status.findFirst({
      where: {
        department_id: departmentId,
        is_active: true,
        is_default: true,
      },
      orderBy: { order_index: 'asc' },
      select: { key: true },
    });

    if (defaultStatus?.key) {
      return this.normalizeStatusToken(defaultStatus.key);
    }

    const firstActiveStatus = await this.prisma.department_status.findFirst({
      where: {
        department_id: departmentId,
        is_active: true,
      },
      orderBy: { order_index: 'asc' },
      select: { key: true },
    });

    if (firstActiveStatus?.key) {
      return this.normalizeStatusToken(firstActiveStatus.key);
    }

    return null;
  }

  async update(id: string, updateLeadDto: Prisma.leadsUpdateInput, user?: any) {
    const existingLead = await this.prisma.leads.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        mobile: true,
        email: true,
        status: true,
        assigned_to: true,
        current_department_id: true,
        preferred_country: true,
        preferred_course: true,
        exam_taken: true,
        exam_score: true,
        utm_source: true,
        utm_medium: true,
        utm_campaign: true,
        type: true,
      },
    });

    if (!existingLead) {
      throw new NotFoundException(`Lead with ID ${id} not found.`);
    }

    const currentType = (existingLead.type || '').toLowerCase();
    const requestedTypeRaw = this.extractStringUpdateValue(updateLeadDto.type);
    const requestedType = (requestedTypeRaw || '').toLowerCase();

    const flow = ['lead', 'application', 'visa'];
    const currentTypeIndex = flow.indexOf(currentType);
    const requestedTypeIndex = flow.indexOf(requestedType);
    const isForwardTransition =
      requestedTypeRaw !== undefined &&
      requestedType !== currentType &&
      currentTypeIndex !== -1 &&
      requestedTypeIndex === currentTypeIndex + 1;

    let updatePayload: Prisma.leadsUpdateInput = { ...updateLeadDto };

    if (isForwardTransition) {
      const [eligibility] = await this.withForwardEligibility([{
        type: existingLead.type,
        status: existingLead.status,
        current_department_id: existingLead.current_department_id,
      }]);

      if (!eligibility.can_forward_to_next_department) {
        throw new BadRequestException('Lead can only be forwarded when its current status is marked terminal for the current department.');
      }

      const requestedAssignee = this.extractStringUpdateValue((updateLeadDto as any).assigned_to);
      const assigneeId = (requestedAssignee || '').trim();

      if (!assigneeId) {
        throw new BadRequestException('Forwarding to the next department requires selecting an assignee.');
      }

      const assignee = await this.prisma.partners.findUnique({
        where: { id: assigneeId },
        include: { role: true },
      });

      if (!assignee) {
        throw new NotFoundException(`Assignee with ID ${assigneeId} not found.`);
      }

      if ((assignee.role?.name || '').toLowerCase() === 'agent') {
        throw new BadRequestException('Selected assignee must be an internal team member.');
      }

      const targetDepartmentId = await this.resolveForwardTargetDepartmentId(
        existingLead.current_department_id,
        requestedTypeIndex,
      );

      if (!targetDepartmentId) {
        throw new BadRequestException('Cannot forward lead because no next active department is configured.');
      }

      const requestedStatusRaw = this.extractStringUpdateValue((updateLeadDto as any).status);
      const requestedStatus = this.normalizeStatusToken(requestedStatusRaw);
      const nextDepartmentInitialStatus = await this.resolveInitialStatusForDepartment(targetDepartmentId);

      const {
        assigned_to: _ignoredAssignedTo,
        current_department_id: _ignoredCurrentDepartmentId,
        ...forwardSafeUpdateFields
      } = (updateLeadDto as Record<string, unknown>);

      updatePayload = {
        ...(forwardSafeUpdateFields as Prisma.leadsUpdateInput),
        partners_leads_assigned_toTopartners: {
          connect: {
            id: assigneeId,
          },
        },
        current_department: {
          connect: {
            id: targetDepartmentId,
          },
        },
        status: nextDepartmentInitialStatus || requestedStatus || 'new',
      };
    }

    const updatedLead = await this.prisma.leads.update({
      where: { id },
      data: updatePayload,
    });

    try {
      const actorId = await this.resolveTimelineActorId(user);

      if (existingLead.name !== updatedLead.name) {
        await this.timelineService.logNameChange(id, actorId, existingLead.name || '-', updatedLead.name || '-');
      }

      if (existingLead.mobile !== updatedLead.mobile) {
        await this.timelineService.logPhoneChange(id, actorId, existingLead.mobile || '-', updatedLead.mobile || '-');
      }

      if (existingLead.email !== updatedLead.email) {
        await this.timelineService.logEmailChange(id, actorId, existingLead.email || '-', updatedLead.email || '-');
      }

      if (existingLead.status !== updatedLead.status) {
        await this.timelineService.logStatusChange(id, actorId, existingLead.status || '-', updatedLead.status || '-');
      }

      const typeDiff = this.buildLeadTypeDiff(existingLead, updatedLead);
      if (typeDiff) {
        await this.timelineService.logDepartmentChange(id, actorId, typeDiff.oldState, typeDiff.newState);
      }

      const detailsDiff = this.buildLeadDetailsDiff(existingLead, updatedLead);
      if (detailsDiff) {
        await this.timelineService.logPurposeChange(
          id,
          actorId,
          detailsDiff.oldState,
          detailsDiff.newState,
        );
      }

      if (existingLead.assigned_to !== updatedLead.assigned_to) {
        let newOwnerName = 'Unassigned';
        if (updatedLead.assigned_to) {
          const owner = await this.prisma.partners.findUnique({
            where: { id: updatedLead.assigned_to },
            select: { name: true },
          });
          newOwnerName = owner?.name || 'Unassigned';
        }

        await this.timelineService.logAssignmentChange(id, actorId, newOwnerName);
      }
    } catch (error) {
      console.error(`Timeline logging failed for lead update ${id}:`, error);
    }

    return updatedLead;
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

    const leads = await this.prisma.leads.findMany({
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

    return this.withForwardEligibility(leads);
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

  async createStudentPanelAccessToken(leadId: string, requester: any) {
    const requesterId = requester?.id || requester?.userId;
    if (!requesterId) {
      throw new ForbiddenException('Invalid user context.');
    }

    const lead = await this.prisma.leads.findUnique({
      where: { id: leadId },
      select: {
        id: true,
        email: true,
        name: true,
        assigned_to: true,
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found.');
    }

    const isAssignedStaff = lead.assigned_to === requesterId;
    const isAdmin = this.isAdminLike(requester);
    if (!isAssignedStaff && !isAdmin) {
      throw new ForbiddenException('You are not allowed to access this student panel.');
    }

    const token = this.jwtService.sign(
      {
        purpose: 'student_panel_staff_access',
        leadId: lead.id,
        staffUserId: requesterId,
      },
      { expiresIn: '5m' },
    );

    return { token };
  }
}
