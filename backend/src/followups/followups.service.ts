// src/followups/followups.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFollowupDto } from './dto/create-followup.dto';
import { UpdateFollowupDto } from './dto/update-followup.dto';
import { CreateFollowupCommentDto } from './dto/create-comment.dto';
import { UpdateFollowupCommentDto } from './dto/update-comment.dto';
import { TimelineService } from '../timeline/timeline.service';
import { Role } from '../auth/roles.enum';
import { getScope } from '../common/utils/scope.util'; // <--- IMPORT

@Injectable()
export class FollowupsService {
  constructor(private prisma: PrismaService, private timelineService: TimelineService) {}

  async findAll(userId?: string, date?: string) {
    const where: any = {};
    
    // Filter by userId if provided
    if (userId) {
      where.created_by = userId;
    }
    
    // Filter by date if provided
    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      where.due_date = {
        gte: startDate,
        lte: endDate,
      };
    }

    const followups = await this.prisma.followups.findMany({
      where,
      include: {
        partners: { select: { name: true } },
        leads: { select: { name: true, email: true } },
      },
      orderBy: { due_date: 'asc' },
    });

    return followups;
  }

  async createFollowup(createFollowupDto: CreateFollowupDto, user: any) {
    const { lead_id, title, due_date } = createFollowupDto;

    // 🔒 SECURITY: Check Lead Access
    const scope = getScope(user);
    const lead = await this.prisma.leads.findFirst({
      where: { id: lead_id, ...scope }
    });
    if (!lead) throw new NotFoundException(`Lead not found or access denied.`);

    const followup = await this.prisma.followups.create({
      data: {
        title,
        lead_id,
        due_date,
        created_by: user.id,
        completed: false,
        created_at: new Date(),
      },
    });

    await this.timelineService.logFollowupAdded(followup, user.id);
    return followup;
  }

  async findAllForLead(leadId: string, user: any) {
    // 🔒 SECURITY: Check Lead Access
    const scope = getScope(user);
    const lead = await this.prisma.leads.findFirst({
      where: { id: leadId, ...scope }
    });
    if (!lead) throw new NotFoundException(`Lead not found or access denied.`);

    // ... (Rest of logic is same) ...
    const followups = await this.prisma.followups.findMany({
      where: { lead_id: leadId },
      include: {
        partners: { select: { name: true } },
        followup_comments: {
          include: { partners: { select: { name: true } } },
          orderBy: { created_at: 'asc' },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return followups.map(followup => ({
      ...followup,
      followup_comments: followup.followup_comments.map(comment => ({
        ...comment,
        id: comment.id.toString(),
      })),
    }));
  }

  async updateFollowup(id: string, updateFollowupDto: UpdateFollowupDto, user: any) {
    const followup = await this.findFollowupOrThrow(id);

    // Security Check: Only admin or creator can update
    if (user.role !== Role.Admin && followup.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to edit this followup.');
    }

    const updatedFollowup = await this.prisma.followups.update({
      where: { id },
      data: updateFollowupDto,
    });

    if (updateFollowupDto.completed === true) {
      await this.timelineService.logFollowupCompleted(updatedFollowup, user.id);
    }

    return updatedFollowup;
  }

  async deleteFollowup(id: string, user: any) {
    const followup = await this.findFollowupOrThrow(id);

    // Security Check: Only admin or creator can delete
    if (user.role !== Role.Admin && followup.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this followup.');
    }

    // Delete all associated comments first (as per your schema, this is not cascaded)
    await this.prisma.followup_comments.deleteMany({
      where: { followup_id: id },
    });

    await this.prisma.followups.delete({
      where: { id },
    });

    // TODO: Log timeline event: LEAD_FOLLOWUP_DELETED

    return { message: `Followup deleted successfully.` };
  }

  // --- Comment Methods ---

  async getComments(followupId: string) {
    await this.findFollowupOrThrow(followupId);
    
    const comments = await this.prisma.followup_comments.findMany({
      where: { followup_id: followupId },
      include: {
        partners: { select: { name: true } },
      },
      orderBy: { created_at: 'asc' },
    });

    // Convert BigInt to string for JSON serialization
    return comments.map(comment => ({
      ...comment,
      id: comment.id.toString(),
    }));
  }

  async addComment(
    followupId: string,
    createCommentDto: CreateFollowupCommentDto,
    userId: string,
  ) {

    const parentFollowup = await this.findFollowupOrThrow(followupId);

    const comment = await this.prisma.followup_comments.create({
      data: {
        text: createCommentDto.text,
        followup_id: followupId,
        created_by: userId,
      },
      include: {
        partners: { select: { name: true } },
      },
    });

    if (parentFollowup.lead_id) {
      await this.timelineService.logCommentAdded(
        parentFollowup.lead_id, 
        comment.text || '', 
        userId
      );
    }

    // Convert BigInt to string for JSON serialization
    return {
      ...comment,
      id: comment.id.toString(),
    };
  }

  async deleteAllComments(followupId: string, user: any) {
    await this.findFollowupOrThrow(followupId);
    
    await this.prisma.followup_comments.deleteMany({
      where: { followup_id: followupId },
    });

    return { message: 'All comments deleted successfully.' };
  }

  async updateComment(
    commentId: bigint,
    updateCommentDto: UpdateFollowupCommentDto,
    user: any,
  ) {
    const comment = await this.findCommentOrThrow(commentId);

    // Security Check: Only admin or comment creator can update
    if (user.role !== Role.Admin && comment.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to edit this comment.');
    }

    const updated = await this.prisma.followup_comments.update({
      where: { id: commentId },
      data: {
        text: updateCommentDto.text,
      },
    });

    // Convert BigInt to string for JSON serialization
    return {
      ...updated,
      id: updated.id.toString(),
    };
  }

  async deleteComment(commentId: bigint, user: any) {
    const comment = await this.findCommentOrThrow(commentId);

    // Security Check: Only admin or comment creator can delete
    if (user.role !== Role.Admin && comment.created_by !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this comment.');
    }

    await this.prisma.followup_comments.delete({
      where: { id: commentId },
    });

    return { message: `Comment deleted successfully.` };
  }

  // --- Helper Functions ---

  private async findFollowupOrThrow(id: string) {
    const followup = await this.prisma.followups.findUnique({
      where: { id },
    });
    if (!followup) {
      throw new NotFoundException(`Followup with ID ${id} not found.`);
    }
    return followup;
  }

  private async findCommentOrThrow(id: bigint) {
    const comment = await this.prisma.followup_comments.findUnique({
      where: { id },
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found.`);
    }
    return comment;
  }
}