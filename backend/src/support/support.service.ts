import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  // 1. Create a Ticket
  async create(partnerId: string, dto: CreateTicketDto) {
    return this.prisma.supportTicket.create({
      data: {
        partner_id: partnerId,
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

  // 2. Get All Tickets (For Admin or specific Partner)
  async findAll(partnerId?: string, status?: string) {
    const where: any = {};
    
    if (partnerId) where.partner_id = partnerId;
    if (status) where.status = status;

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        partner: { select: { name: true, email: true, agency_name: true } },
        _count: { select: { comments: true } } // Show reply count
      }
    });
  }

  // 3. Get Single Ticket Details (with conversation)
  async findOne(id: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        partner: { select: { name: true, agency_name: true } },
        comments: {
          orderBy: { created_at: 'asc' } // Oldest messages first (chat style)
        }
      }
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found`);
    return ticket;
  }

  // 4. Add Comment (Reply)
  async addComment(ticketId: string, userId: string, userType: 'PARTNER' | 'ADMIN', userName: string, dto: AddCommentDto) {
    // Verify ticket exists
    await this.findOne(ticketId);

    return this.prisma.supportTicketComment.create({
      data: {
        ticket_id: ticketId,
        sender_id: userId,
        sender_type: userType,
        sender_name: userName,
        message: dto.message,
        attachment_urls: dto.attachment_urls || []
      }
    });
  }

  // 5. Update Status
  async updateStatus(id: string, dto: UpdateTicketStatusDto) {
    return this.prisma.supportTicket.update({
      where: { id },
      data: { status: dto.status }
    });
  }
}