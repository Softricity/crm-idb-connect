// src/timeline/timeline.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { timeline_event } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generic private method to create a timeline event.
   */
  private async log(
    leadId: string,
    eventType: timeline_event,
    userId: string | null,
    newState?: any,
    oldState?: any,
  ) {
    const cleanNewState = newState && typeof newState !== 'string' ? JSON.stringify(newState) : newState;
    const cleanOldState = oldState && typeof oldState !== 'string' ? JSON.stringify(oldState) : oldState;

    // Note: If userId is null/undefined here, created_by becomes null -> "System" in frontend
    return this.prisma.timeline.create({
      data: {
        lead_id: leadId, 
        event_type: eventType,
        created_by: userId,
        new_state: cleanNewState,
        old_state: cleanOldState,
      },
    });
  }

  /**
   * Fetches the complete timeline for a specific lead.
   */
  async getTimelineForLead(leadId: string) {
    const events = await this.prisma.timeline.findMany({
      where: { lead_id: leadId },
      include: {
        partners: { 
          select: { name: true },
        },
        leads: {
          select: { name: true },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // ✅ FIX: Map DB relations to Frontend property names
    return events.map(event => ({
        ...event,
        partner: event.partners,
        lead: event.leads
    }));
  }

  // --- Specific Event Logging Methods ---

  async logLeadCreated(lead: any) {
    await this.log(
      lead.id,
      'LEAD_CREATED',
      lead.created_by || null, // If created_by is null, "System" is correct
      `Lead created for ${lead.name}`,
    );
  }

  async logNoteAdded(note: any, userId: string | null) {
    await this.log(
      note.lead_id, 
      'LEAD_NOTE_ADDED',
      userId,
      note.text, 
    );
  }
  
  async logFollowupAdded(followup: any, userId: string | null) {
      await this.log(
          followup.lead_id,
          'LEAD_FOLLOWUP_ADDED',
          userId,
          followup.title 
      );
  }
  
  async logFollowupCompleted(followup: any, userId: string | null) {
      await this.log(
          followup.lead_id,
          'LEAD_FOLLOWUP_COMPLETED',
          userId,
          followup.title 
      );
  }
  
  async logCommentAdded(leadId: string, commentText: string, userId: string | null) {
      await this.log(
          leadId,
          'LEAD_FOLLOWUP_COMMENT_ADDED',
          userId,
          commentText 
      );
  }

  async logStatusChange(leadId: string, userId: string | null, oldStatus: string, newStatus: string) {
    await this.log(
      leadId,
      'LEAD_STATUS_CHANGED',
      userId,
      newStatus,
      oldStatus
    );
  }

  async logDepartmentChange(leadId: string, userId: string | null, oldDepartment: string, newDepartment: string) {
    await this.log(
      leadId,
      'LEAD_DEPARTMENT_CHANGED',
      userId,
      newDepartment,
      oldDepartment,
    );
  }

  async logNameChange(leadId: string, userId: string | null, oldName: string, newName: string) {
    await this.log(
      leadId,
      'LEAD_NAME_CHANGED',
      userId,
      newName,
      oldName,
    );
  }

  async logPhoneChange(leadId: string, userId: string | null, oldPhone: string, newPhone: string) {
    await this.log(
      leadId,
      'LEAD_PHONE_CHANGED',
      userId,
      newPhone,
      oldPhone,
    );
  }

  async logEmailChange(leadId: string, userId: string | null, oldEmail: string, newEmail: string) {
    await this.log(
      leadId,
      'LEAD_EMAIL_CHANGED',
      userId,
      newEmail,
      oldEmail,
    );
  }

  async logPurposeChange(leadId: string, userId: string | null, oldValue: string, newValue: string) {
    await this.log(
      leadId,
      'LEAD_PURPOSE_CHANGED',
      userId,
      newValue,
      oldValue,
    );
  }

  async logAssignmentChange(leadId: string, userId: string | null, newOwnerName: string) {
    await this.log(
      leadId,
      'LEAD_OWNER_CHANGED',
      userId,
      `Assigned to ${newOwnerName}`
    );
  }

  /**
   * Fetches the most recent global timeline events.
   */
  async getGlobalTimeline(limit: number = 100) {
    const events = await this.prisma.timeline.findMany({
      take: limit,
      orderBy: {
        created_at: 'desc',
      },
      include: {
        partners: {
          select: { name: true },
        },
        leads: {
            select: { name: true } 
        }
      },
    });

    // ✅ FIX: Map 'partners' -> 'partner' and 'leads' -> 'lead'
    return events.map(event => ({
        ...event,
        partner: event.partners,
        lead: event.leads
    }));
  }
}