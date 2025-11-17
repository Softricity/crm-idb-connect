// src/followups/followups.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { FollowupsService } from './followups.service';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';
import { CreateFollowupCommentDto } from './dto/create-comment.dto';
import { UpdateFollowupCommentDto } from './dto/update-comment.dto';
import { GetUser } from '../auth/get-user.decorator';

// The global JwtAuthGuard protects all these routes

@Controller()
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsService) {}

  // --- Followup Routes ---

  /**
   * Create a new followup
   * POST /followups
   */
  @Post('followups')
  createFollowup(
    @Body() createFollowupDto: CreateFollowupDto,
    @GetUser() user: any,
  ) {
    return this.followupsService.createFollowup(createFollowupDto, user.id);
  }

  /**
   * Get all followups for a specific lead
   * GET /leads/:leadId/followups
   */
  @Get('leads/:leadId/followups')
  findAllForLead(@Param('leadId') leadId: string) {
    return this.followupsService.findAllForLead(leadId);
  }

  /**
   * Update a followup
   * PATCH /followups/:id
   */
  @Patch('followups/:id')
  updateFollowup(
    @Param('id') id: string,
    @Body() updateFollowupDto: UpdateFollowupDto,
    @GetUser() user: any,
  ) {
    return this.followupsService.updateFollowup(id, updateFollowupDto, user);
  }

  /**
   * Delete a followup
   * DELETE /followups/:id
   */
  @Delete('followups/:id')
  deleteFollowup(@Param('id') id: string, @GetUser() user: any) {
    return this.followupsService.deleteFollowup(id, user);
  }

  // --- Comment Routes ---

  /**
   * Add a comment to a followup
   * POST /followups/:id/comments
   */
  @Post('followups/:id/comments')
  addComment(
    @Param('id') followupId: string,
    @Body() createCommentDto: CreateFollowupCommentDto,
    @GetUser() user: any,
  ) {
    return this.followupsService.addComment(
      followupId,
      createCommentDto,
      user.id,
    );
  }

  /**
   * Update a comment
   * PATCH /comments/:id
   */
  @Patch('comments/:id')
  updateComment(
    @Param('id') id: string, // NestJS pipes can parse this to bigint
    @Body() updateCommentDto: UpdateFollowupCommentDto,
    @GetUser() user: any,
  ) {
    // Convert string param to BigInt for Prisma
    return this.followupsService.updateComment(BigInt(id), updateCommentDto, user);
  }

  /**
   * Delete a comment
   * DELETE /comments/:id
   */
  @Delete('comments/:id')
  deleteComment(@Param('id') id: string, @GetUser() user: any) {
    return this.followupsService.deleteComment(BigInt(id), user);
  }
}