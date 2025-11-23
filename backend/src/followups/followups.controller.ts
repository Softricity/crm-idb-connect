// src/followups/followups.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
   * Get all followups with optional filtering
   * GET /followups?userId=xxx&date=2024-11-22
   */
  @Get('followups')
  findAll(
    @Query('userId') userId?: string,
    @Query('date') date?: string,
  ) {
    return this.followupsService.findAll(userId, date);
  }

  /**
   * Create a new followup
   * POST /followups
   */
  @Post('followups')
  createFollowup(
    @Body() createFollowupDto: CreateFollowupDto,
    @GetUser() user: any,
  ) {
    // Pass full user object
    return this.followupsService.createFollowup(createFollowupDto, user);
  }

  @Get('leads/:leadId/followups')
  findAllForLead(@Param('leadId') leadId: string, @GetUser() user: any) {
    // Pass full user object
    return this.followupsService.findAllForLead(leadId, user);
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
   * Get all comments for a followup
   * GET /followups/:id/comments
   */
  @Get('followups/:id/comments')
  getComments(@Param('id') followupId: string) {
    return this.followupsService.getComments(followupId);
  }

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
   * Delete all comments for a followup
   * DELETE /followups/:id/comments
   */
  @Delete('followups/:id/comments')
  deleteAllComments(@Param('id') followupId: string, @GetUser() user: any) {
    return this.followupsService.deleteAllComments(followupId, user);
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