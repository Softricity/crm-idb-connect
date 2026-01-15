import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 1. Save a new message
  async saveMessage(senderId: string, senderType: 'PARTNER' | 'LEAD' | 'AGENT', dto: CreateMessageDto) {
    
    // Determine which ID field to populate based on sender type
    const data: any = {
      lead_id: dto.lead_id,
      message: dto.message,
      sender_type: senderType,
      is_read: false,
    };

    if (senderType === 'PARTNER') data.partner_id = senderId;
    else if (senderType === 'AGENT') data.agent_id = senderId;
    // If LEAD, both partner_id and agent_id remain null (or you could verify lead_id matches senderId)

    return this.prisma.chatMessage.create({
      data,
      include: {
        partner: { select: { name: true } }, // Include sender details for the UI
        agent: { select: { name: true } }
      }
    });
  }

  // 2. Fetch Chat History (for initial load)
  async getMessages(leadId: string) {
    return this.prisma.chatMessage.findMany({
      where: { lead_id: leadId },
      orderBy: { created_at: 'asc' }, // Oldest first
      take: 50, // Limit to last 50 messages
      include: {
        partner: { select: { name: true } },
        agent: { select: { name: true } }
      }
    });
  }
  
  // 3. Mark messages as read
  async markAsRead(leadId: string, readerType: 'PARTNER' | 'LEAD') {
    // If a Partner reads, mark Student's messages as read, and vice versa.
    // Simplified: Just mark all unread in room as read for now.
    return this.prisma.chatMessage.updateMany({
      where: { lead_id: leadId, is_read: false },
      data: { is_read: true }
    });
  }
}