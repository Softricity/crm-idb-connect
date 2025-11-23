// src/offline-payments/offline-payments.service.ts
import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfflinePaymentDto } from './dto/create-offline-payment.dto';
import { UpdateOfflinePaymentDto } from './dto/update-offline-payment.dto';
import { SupabaseService } from '../storage/supabase.service';
import { getScope } from '../common/utils/scope.util'; // <--- IMPORT

@Injectable()
export class OfflinePaymentsService {
  constructor(private prisma: PrismaService, private supabaseService: SupabaseService) { }

  // 1. Update Create to check Lead Access
  async create(createDto: CreateOfflinePaymentDto, userId: string, file: Express.Multer.File | undefined, user: any) {
    // A. Check Receiver logic (existing)
    if (createDto.receiver) {
      const receiver = await this.prisma.partners.findUnique({
        where: { id: createDto.receiver },
        include: { role: true },
      });
      if (!receiver) throw new NotFoundException('Receiver partner not found');
      if (receiver.role?.name === 'agent') {
        throw new BadRequestException('Receiver cannot be an agent for offline payments');
      }
    }

    // B. SECURITY: Check if User can access this Lead
    if (createDto.lead_id) {
      const scope = getScope(user);
      const lead = await this.prisma.leads.findFirst({
        where: { id: createDto.lead_id, ...scope }
      });
      if (!lead) throw new ForbiddenException('You do not have access to this Lead.');
    }

    // C. Upload File
    let fileUrl = createDto.file; 
    if (file) {
      try {
        fileUrl = await this.supabaseService.uploadFile(
          file,
          createDto.lead_id ? `leads/${createDto.lead_id}` : 'general',
          'idb-offline-payments',
        );
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('[offline-payments] file upload failed', err);
        throw err;
      }
    }

    // D. Create Payment
    const payment = await this.prisma.offline_payments.create({
      data: {
        ...createDto,
        file: fileUrl,
      },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
    });

    // E. Log Timeline
    if (payment.lead_id) {
      await this.prisma.timeline.create({
        data: {
          lead_id: payment.lead_id,
          event_type: 'OFFLINE_PAYMENT_ADDED',
          new_state: `${payment.amount} ${payment.currency}`,
          created_by: userId,
        },
      });
    }

    return payment;
  }

  // 2. Find By Lead ID (Secured)
  async findByLeadId(leadId: string, user: any) {
    const scope = getScope(user);
    
    // Verify Lead Access First
    const lead = await this.prisma.leads.findFirst({
      where: { id: leadId, ...scope }
    });
    if (!lead) throw new ForbiddenException('You do not have access to this Lead.');

    return this.prisma.offline_payments.findMany({
      where: { lead_id: leadId },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // 3. Find By Receiver (Secured)
  async findByReceiver(receiverId: string, user: any) {
    // Users can see their own payments, Admins can see anyone's
    if (user.role !== 'admin' && user.id !== receiverId) {
      throw new ForbiddenException('You can only view your own received payments.');
    }

    return this.prisma.offline_payments.findMany({
      where: { receiver: receiverId },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async update(id: string, updateDto: UpdateOfflinePaymentDto) {
    return this.prisma.offline_payments.update({
      where: { id },
      data: updateDto,
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
    });
  }

  async delete(id: string, userId?: string) {
    const payment = await this.prisma.offline_payments.findUnique({
      where: { id },
      select: { id: true, lead_id: true, amount: true, currency: true, file: true },
    });

    if (!payment) throw new NotFoundException('Payment not found');

    await this.prisma.offline_payments.delete({ where: { id } });

    if (payment.lead_id && userId) {
      await this.prisma.timeline.create({
        data: {
          lead_id: payment.lead_id,
          event_type: 'OFFLINE_PAYMENT_DELETED',
          old_state: `${payment.amount} ${payment.currency}`,
          created_by: userId,
        },
      });
    }

    return { message: 'Payment deleted successfully', fileUrl: payment.file };
  }
}