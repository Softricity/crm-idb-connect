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
    source: string = 'crm',
    actorName?: string,
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
        source: source,
        actor_name: actorName,
      } as any,
    });
  }

  /**
   * Fetches the complete timeline for a specific lead with pagination.
   */
  async getTimelineForLead(leadId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.timeline.findMany({
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
        skip,
        take: limit,
      }),
      this.prisma.timeline.count({ where: { lead_id: leadId } }),
    ]);

    // ✅ FIX: Map DB relations to Frontend property names
    const data = events.map(event => ({
        ...event,
        partner: event.partners,
        lead: event.leads
    }));

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

  // --- Specific Event Logging Methods ---

  async logLeadCreated(lead: any, source: string = 'crm', actorName?: string) {
    await this.log(
      lead.id,
      'LEAD_CREATED',
      lead.created_by || null, // If created_by is null, "System" is correct
      `Lead created for ${lead.name}`,
      undefined,
      source,
      actorName,
    );
  }

  async logNoteAdded(note: any, userId: string | null, source = 'crm', actorName?: string) {
    await this.log(
      note.lead_id, 
      'LEAD_NOTE_ADDED',
      userId,
      note.text,
      undefined,
      source,
      actorName
    );
  }
  
  async logFollowupAdded(followup: any, userId: string | null, source = 'crm', actorName?: string) {
      await this.log(
          followup.lead_id,
          'LEAD_FOLLOWUP_ADDED',
          userId,
          followup.title,
          undefined,
          source,
          actorName
      );
  }
  
  async logFollowupCompleted(followup: any, userId: string | null, source = 'crm', actorName?: string) {
      await this.log(
          followup.lead_id,
          'LEAD_FOLLOWUP_COMPLETED',
          userId,
          followup.title,
          undefined,
          source,
          actorName
      );
  }
  
  async logCommentAdded(leadId: string, commentText: string, userId: string | null, source = 'crm', actorName?: string) {
      await this.log(
          leadId,
          'LEAD_FOLLOWUP_COMMENT_ADDED',
          userId,
          commentText,
          undefined,
          source,
          actorName
      );
  }

  async logStatusChange(leadId: string, userId: string | null, oldStatus: string, newStatus: string, source: string = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_STATUS_CHANGED',
      userId,
      newStatus,
      oldStatus,
      source,
      actorName
    );
  }

  async logDepartmentChange(leadId: string, userId: string | null, oldDepartment: string, newDepartment: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_DEPARTMENT_CHANGED',
      userId,
      newDepartment,
      oldDepartment,
      source,
      actorName
    );
  }

  async logNameChange(leadId: string, userId: string | null, oldName: string, newName: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_NAME_CHANGED',
      userId,
      newName,
      oldName,
      source,
      actorName
    );
  }

  async logPhoneChange(leadId: string, userId: string | null, oldPhone: string, newPhone: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_PHONE_CHANGED',
      userId,
      newPhone,
      oldPhone,
      source,
      actorName
    );
  }

  async logEmailChange(leadId: string, userId: string | null, oldEmail: string, newEmail: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_EMAIL_CHANGED',
      userId,
      newEmail,
      oldEmail,
      source,
      actorName
    );
  }

  async logPurposeChange(leadId: string, userId: string | null, oldValue: string, newValue: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_PURPOSE_CHANGED',
      userId,
      newValue,
      oldValue,
      source,
      actorName
    );
  }

  async logAssignmentChange(leadId: string, userId: string | null, newOwnerName: string, source = 'crm', actorName?: string) {
    await this.log(
      leadId,
      'LEAD_OWNER_CHANGED',
      userId,
      `Assigned to ${newOwnerName}`,
      undefined,
      source,
      actorName
    );
  }

  /**
   * Fetches the most recent global timeline events with pagination.
   */
  async getGlobalTimeline(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.timeline.findMany({
        skip,
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
      }),
      this.prisma.timeline.count(),
    ]);

    // ✅ FIX: Map 'partners' -> 'partner' and 'leads' -> 'lead'
    const data = events.map(event => ({
        ...event,
        partner: event.partners,
        lead: event.leads
    }));

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
}