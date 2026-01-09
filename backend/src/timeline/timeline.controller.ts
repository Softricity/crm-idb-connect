// src/timeline/timeline.controller.ts
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TimelineService } from './timeline.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller()
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  /**
   * Get all timeline events for a specific lead
   * GET /leads/:leadId/timeline
   */
  @Get('leads/:leadId/timeline')
  getTimelineForLead(@Param('leadId') leadId: string) {
    return this.timelineService.getTimelineForLead(leadId);
  }

  @Get('timeline')
  getAllTimeline() {
    return this.timelineService.getGlobalTimeline();
  }
}