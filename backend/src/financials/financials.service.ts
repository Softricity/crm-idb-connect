import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateFinancialStatusDto } from './dto/update-financial-status.dto';
import { CreateFinancialNoteDto } from './dto/create-financial-note.dto';

@Injectable()
export class FinancialsService {
  constructor(private prisma: PrismaService) {}

  // Helper to find Application ID from Lead ID
  private async getAppIdFromLead(leadId: string) {
    const app = await this.prisma.applications.findFirst({
      where: { lead_id: leadId },
      select: { id: true }
    });
    if (!app) throw new NotFoundException('Application not found for this lead');
    return app.id;
  }

  // 1. Get Financial Details (Status + Grouped Notes)
  async getFinancials(leadId: string) {
    const appId = await this.getAppIdFromLead(leadId);

    // Upsert: Get existing or create default 'PENDING'
    let record = await this.prisma.applicationFinancials.findUnique({
      where: { application_id: appId },
      include: {
        notes: {
          include: { partner: { select: { name: true } } }, // Get author name
          orderBy: { created_at: 'desc' }
        }
      }
    });

    if (!record) {
      record = await this.prisma.applicationFinancials.create({
        data: { application_id: appId, status: 'PENDING' },
        include: { notes: { include: { partner: { select: { name: true } } } } }
      });
    }

    return record;
  }

  // 2. Update Status (Dropdown Change)
  async updateStatus(leadId: string, dto: UpdateFinancialStatusDto) {
    const appId = await this.getAppIdFromLead(leadId);

    // Ensure record exists before updating
    await this.getFinancials(leadId); 

    return this.prisma.applicationFinancials.update({
      where: { application_id: appId },
      data: { status: dto.status }
    });
  }

  // 3. Add Note to a specific Stage
  async addNote(leadId: string, userId: string, dto: CreateFinancialNoteDto) {
    const appId = await this.getAppIdFromLead(leadId);
    
    // Ensure parent record exists
    const financialRecord = await this.getFinancials(leadId);

    return this.prisma.financialNote.create({
      data: {
        financial_id: financialRecord.id,
        content: dto.content,
        stage: dto.stage,
        created_by: userId
      },
      include: { partner: { select: { name: true } } }
    });
  }

  async deleteNote(noteId: string) {
    // Optional: Add check if user is allowed to delete
    return this.prisma.financialNote.delete({
      where: { id: noteId }
    });
  }
}