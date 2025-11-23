// src/timeline/timeline.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
// ✅ FIX 1: Import 'timeline_event' (snake_case) as defined in your schema/client
import { timeline_event } from '@prisma/client';

@Injectable()
export class TimelineService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generic private method to create a timeline event.
   */
  private async log(
    leadId: string,
    eventType: timeline_event, // ✅ FIX 1: Use correct enum type
    userId: string,
    newState?: any,
    oldState?: any,
  ) {
    // Ensure states are JSON-compatible strings
    const cleanNewState = newState && typeof newState !== 'string' ? JSON.stringify(newState) : newState;
    const cleanOldState = oldState && typeof oldState !== 'string' ? JSON.stringify(oldState) : oldState;

    return this.prisma.timeline.create({
      data: {
        // ✅ FIX 2: Use snake_case property names to match schema
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
    return this.prisma.timeline.findMany({
      // ✅ FIX 2: Use snake_case property names
      where: { lead_id: leadId },
      include: {
        partners: { 
          select: { name: true },
        },
      },
      orderBy: {
        created_at: 'desc', // ✅ FIX 2: Use snake_case property names
      },
    });
  }

  // --- Specific Event Logging Methods ---

  async logLeadCreated(lead: any) {
    await this.log(
      lead.id,
      'LEAD_CREATED',
      lead.created_by || lead.id, // Fallback for public leads
      `Lead created for ${lead.name}`,
    );
  }

  async logNoteAdded(note: any, userId: string) {
    // ✅ FIX 2: Note object likely has snake_case keys from DB too
    // Adjust accessors if 'note' comes directly from Prisma result
    await this.log(
      note.lead_id, // Changed from note.leadId
      'LEAD_NOTE_ADDED',
      userId,
      note.text, 
    );
  }
  
  async logFollowupAdded(followup: any, userId: string) {
      await this.log(
          followup.lead_id, // Changed from followup.leadId
          'LEAD_FOLLOWUP_ADDED',
          userId,
          followup.title 
      );
  }
  
  async logFollowupCompleted(followup: any, userId: string) {
      await this.log(
          followup.lead_id, // Changed from followup.leadId
          'LEAD_FOLLOWUP_COMPLETED',
          userId,
          followup.title 
      );
  }
  
  async logCommentAdded(leadId: string, commentText: string, userId: string) {
      await this.log(
          leadId,
          'LEAD_FOLLOWUP_COMMENT_ADDED',
          userId,
          commentText 
      );
  }

  async logStatusChange(leadId: string, userId: string, oldStatus: string, newStatus: string) {
    await this.log(
      leadId,
      'LEAD_STATUS_CHANGED',
      userId,
      newStatus,
      oldStatus
    );
  }

  async logAssignmentChange(leadId: string, userId: string, newOwnerName: string) {
    await this.log(
      leadId,
      'LEAD_OWNER_CHANGED',
      userId,
      `Assigned to ${newOwnerName}`
    );
  }
}