import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { SUPPORT_PERMISSIONS } from './support.permissions';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  private getUserId(user: any): string {
    return user?.id || user?.userId;
  }

  private isStaffWithAnyPermission(user: any): boolean {
    return (
      user?.type === 'partner' &&
      Array.isArray(user?.permissions) &&
      user.permissions.length > 0
    );
  }

  private hasSupportPermission(user: any, permission: string): boolean {
    const permissions: string[] = Array.isArray(user?.permissions)
      ? user.permissions
      : [];
    return (
      permissions.includes(SUPPORT_PERMISSIONS.MANAGE) ||
      permissions.includes(permission)
    );
  }

  private canViewAllTickets(user: any): boolean {
    return (
      this.isStaffWithAnyPermission(user) &&
      this.hasSupportPermission(user, SUPPORT_PERMISSIONS.VIEW)
    );
  }

  private canReplyAsStaff(user: any): boolean {
    return (
      this.isStaffWithAnyPermission(user) &&
      this.hasSupportPermission(user, SUPPORT_PERMISSIONS.REPLY)
    );
  }

  private canUpdateStatus(user: any): boolean {
    return (
      this.isStaffWithAnyPermission(user) &&
      this.hasSupportPermission(user, SUPPORT_PERMISSIONS.STATUS_UPDATE)
    );
  }

  private getOwnScopeWhere(user: any): any {
    const userId = this.getUserId(user);
    const userType = user?.type;

    if (!userId) {
      throw new ForbiddenException('Invalid user context');
    }

    if (userType === 'agent') {
      return {
        OR: [
          { requester_agent_id: userId },
          { requester_parent_agent_id: userId },
          { partner_id: userId }, // legacy compatibility fallback
        ],
      };
    }

    if (userType === 'agent_team_member') {
      const parentAgentId = user?.parent_agent_id;
      return {
        OR: [
          { requester_team_member_id: userId },
          ...(parentAgentId ? [{ requester_parent_agent_id: parentAgentId }] : []),
          { partner_id: userId }, // legacy compatibility fallback
        ],
      };
    }

    return {
      OR: [{ requester_partner_id: userId }, { partner_id: userId }],
    };
  }

  private mapRequester(ticket: any) {
    if (ticket.partner) return ticket.partner;
    if (ticket.requester_partner) return ticket.requester_partner;
    if (ticket.requester_agent) {
      return {
        id: ticket.requester_agent.id,
        name: ticket.requester_agent.name,
        email: ticket.requester_agent.email,
        agency_name: ticket.requester_agent.agency_name,
      };
    }
    if (ticket.requester_team_member) {
      return {
        id: ticket.requester_team_member.id,
        name: ticket.requester_team_member.name,
        email: ticket.requester_team_member.email,
        agency_name: ticket.requester_team_member.agent?.agency_name || null,
      };
    }
    return null;
  }

  private mapTicketResponse(ticket: any) {
    return {
      ...ticket,
      partner: this.mapRequester(ticket),
      requester: {
        type: ticket.requester_type,
        partner_id: ticket.requester_partner_id,
        agent_id: ticket.requester_agent_id,
        team_member_id: ticket.requester_team_member_id,
        parent_agent_id: ticket.requester_parent_agent_id,
      },
    };
  }

  private async getTicketWithRelations(id: string) {
    return this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        partner: { select: { id: true, name: true, email: true, agency_name: true } },
        requester_partner: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        requester_agent: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        requester_team_member: {
          select: {
            id: true,
            name: true,
            email: true,
            mobile: true,
            agent: { select: { id: true, name: true, email: true, agency_name: true } },
          },
        },
        requester_parent_agent: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        comments: {
          orderBy: { created_at: 'asc' },
        },
      },
    });
  }

  private assertTicketReadableByUser(ticket: any, user: any) {
    if (this.canViewAllTickets(user)) {
      return;
    }

    const userId = this.getUserId(user);
    if (!userId) {
      throw new ForbiddenException('Invalid user context');
    }

    const userType = user?.type;
    if (
      userType === 'agent' &&
      (ticket.requester_agent_id === userId ||
        ticket.requester_parent_agent_id === userId ||
        ticket.partner_id === userId)
    ) {
      return;
    }

    if (
      userType === 'agent_team_member' &&
      (ticket.requester_team_member_id === userId ||
        (user?.parent_agent_id &&
          ticket.requester_parent_agent_id === user.parent_agent_id) ||
        ticket.partner_id === userId)
    ) {
      return;
    }

    if (
      (ticket.requester_partner_id === userId || ticket.partner_id === userId) &&
      userType !== 'agent' &&
      userType !== 'agent_team_member'
    ) {
      return;
    }

    throw new ForbiddenException('You do not have access to this ticket');
  }

  async create(user: any, dto: CreateTicketDto) {
    const userId = this.getUserId(user);
    if (!userId) {
      throw new ForbiddenException('Invalid user context');
    }

    const requesterData: Record<string, any> = {};
    if (user?.type === 'agent') {
      requesterData.requester_type = 'AGENT';
      requesterData.requester_agent_id = userId;
      requesterData.requester_parent_agent_id = userId;
      requesterData.partner_id = null;
    } else if (user?.type === 'agent_team_member') {
      requesterData.requester_type = 'AGENT_TEAM_MEMBER';
      requesterData.requester_team_member_id = userId;
      requesterData.requester_parent_agent_id = user?.parent_agent_id || null;
      requesterData.partner_id = null;
    } else {
      requesterData.requester_type = 'PARTNER';
      requesterData.requester_partner_id = userId;
      requesterData.partner_id = userId;
    }

    return this.prisma.supportTicket.create({
      data: {
        ...requesterData,
        topic: dto.topic,
        category: dto.category,
        institution_id: dto.institution_id,
        subject: dto.subject,
        description: dto.description,
        priority: dto.priority || 'MEDIUM',
        attachment_urls: dto.attachment_urls || [],
        status: 'OPEN'
      }
    });
  }

  async findAll(user: any, status?: string) {
    const where: any = status ? { status } : {};
    if (!this.canViewAllTickets(user)) {
      Object.assign(where, this.getOwnScopeWhere(user));
    }

    const tickets = await this.prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        partner: { select: { id: true, name: true, email: true, agency_name: true } },
        requester_partner: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        requester_agent: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        requester_team_member: {
          select: {
            id: true,
            name: true,
            email: true,
            agent: { select: { id: true, name: true, email: true, agency_name: true } },
          },
        },
        requester_parent_agent: {
          select: { id: true, name: true, email: true, agency_name: true },
        },
        _count: { select: { comments: true } },
      },
    });

    return tickets.map((ticket) => this.mapTicketResponse(ticket));
  }

  async findOne(user: any, id: string) {
    const ticket = await this.getTicketWithRelations(id);

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    this.assertTicketReadableByUser(ticket, user);
    return this.mapTicketResponse(ticket);
  }

  async addComment(user: any, ticketId: string, dto: AddCommentDto) {
    const userId = this.getUserId(user);
    if (!userId) {
      throw new ForbiddenException('Invalid user context');
    }

    const ticket = await this.getTicketWithRelations(ticketId);
    if (!ticket) throw new NotFoundException(`Ticket ${ticketId} not found`);
    this.assertTicketReadableByUser(ticket, user);

    const staffReply = this.isStaffWithAnyPermission(user);
    if (staffReply && !this.canReplyAsStaff(user)) {
      throw new ForbiddenException('Missing permission: Support Ticket Reply');
    }

    let senderType = 'PARTNER';
    if (staffReply) {
      senderType = 'ADMIN';
    } else if (user?.type === 'agent') {
      senderType = 'AGENT';
    } else if (user?.type === 'agent_team_member') {
      senderType = 'AGENT_TEAM_MEMBER';
    }

    return this.prisma.supportTicketComment.create({
      data: {
        ticket_id: ticketId,
        sender_id: userId,
        sender_type: senderType,
        sender_name: user?.name || 'Unknown',
        message: dto.message,
        attachment_urls: dto.attachment_urls || [],
      },
    });
  }

  async updateStatus(user: any, id: string, dto: UpdateTicketStatusDto) {
    if (!this.canUpdateStatus(user)) {
      throw new ForbiddenException(
        'Missing permission: Support Ticket Status Update',
      );
    }

    await this.findOne(user, id);
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: dto.status },
    });
  }
}
