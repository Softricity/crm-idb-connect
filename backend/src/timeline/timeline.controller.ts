// src/timeline/timeline.controller.ts
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
  getTimelineForLead(
    @Param('leadId') leadId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.timelineService.getTimelineForLead(leadId, parseInt(page), parseInt(limit));
  }

  @Get('timeline')
  getAllTimeline(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.timelineService.getGlobalTimeline(parseInt(page), parseInt(limit));
  }
}