// src/offline-payments/offline-payments.service.ts
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOfflinePaymentDto } from './dto/create-offline-payment.dto';
import { UpdateOfflinePaymentDto } from './dto/update-offline-payment.dto';

@Injectable()
export class OfflinePaymentsService {
  constructor(private prisma: PrismaService) {}

  // Create a new offline payment
  async create(createDto: CreateOfflinePaymentDto, userId: string) {
    // Verify receiver is not an agent if receiver is provided
    if (createDto.receiver) {
      const receiver = await this.prisma.partners.findUnique({
        where: { id: createDto.receiver },
        select: { id: true, role: { select: { name: true } } },
      });

      if (!receiver) {
        throw new NotFoundException('Receiver partner not found');
      }

      if (receiver.role.name === 'agent') {
        throw new BadRequestException('Receiver cannot be an agent for offline payments');
      }
    }

    const payment = await this.prisma.offline_payments.create({
      data: createDto,
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
    const payment = await this.prisma.offline_payments.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

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

    // Log timeline event
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
      fileUrl: payment.file, // Return file URL so frontend can delete from storage
    };
  }
}
