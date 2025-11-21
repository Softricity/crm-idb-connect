// src/offline-payments/offline-payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfflinePaymentDto } from './dto/create-offline-payment.dto';
import { UpdateOfflinePaymentDto } from './dto/update-offline-payment.dto';
import { SupabaseService } from '../storage/supabase.service';

@Injectable()
export class OfflinePaymentsService {
  constructor(private prisma: PrismaService, private supabaseService: SupabaseService) { }
  // Create a new offline payment
  async create(createDto: CreateOfflinePaymentDto, userId: string, file?: Express.Multer.File) {
    if (createDto.receiver) {
      const receiver = await this.prisma.partners.findUnique({
        where: { id: createDto.receiver },
        include: { role: true }, // Fetch the Relation
      });

      if (!receiver) {
        throw new NotFoundException('Receiver partner not found');
      }

      // Access role.name instead of role directly
      if (receiver.role?.name === 'agent') {
        throw new BadRequestException('Receiver cannot be an agent for offline payments');
      }
    }
    // ---------------------------------------------------

    let fileUrl = createDto.file; 
    if (file) {
      // ⚡ HERE: We specify 'payment-slips' as the bucket name
      fileUrl = await this.supabaseService.uploadFile(
        file, 
        'idb-offline-payments',  // <--- Bucket Name
        createDto.lead_id ? `leads/${createDto.lead_id}` : 'general' // Folder path
      );
    }

    const payment = await this.prisma.offline_payments.create({
      data: {
        ...createDto,
        file: fileUrl, // Save the Supabase URL
      },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
    });

    // Log timeline event
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

  // Fetch payments by lead ID
  async findByLeadId(leadId: string) {
    return this.prisma.offline_payments.findMany({
      where: { lead_id: leadId },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Fetch payments by receiver (partner ID)
  async findByReceiver(receiverId: string) {
    return this.prisma.offline_payments.findMany({
      where: { receiver: receiverId },
      include: {
        leads: { select: { name: true } },
        partners: { select: { name: true, role: true } },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  // Update an existing payment
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

  // Delete a payment
  async delete(id: string, userId?: string) {
    const payment = await this.prisma.offline_payments.findUnique({
      where: { id },
      select: { id: true, lead_id: true, amount: true, currency: true, file: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    await this.prisma.offline_payments.delete({
      where: { id },
    });

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

    return {
      message: 'Payment deleted successfully',
      fileUrl: payment.file,
    };
  }
}
