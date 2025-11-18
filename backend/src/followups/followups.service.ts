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
import { Role } from '../auth/roles.enum';

@Injectable()
export class FollowupsService {
  constructor(
    private prisma: PrismaService,
    ) {}

  // --- Followup Methods ---

  async createFollowup(createFollowupDto: CreateFollowupDto, userId: string) {
    const { lead_id, title, due_date } = createFollowupDto;

    // Check if the lead exists
    const lead = await this.prisma.leads.findUnique({ where: { id: lead_id } });
    if (!lead) {
      throw new NotFoundException(`Lead with ID ${lead_id} not found.`);
    }

    const followup = await this.prisma.followups.create({
      data: {
        title,
        lead_id,
        due_date,
        created_by: userId,
        completed: false,
        created_at: new Date(),
      },
    });

    return followup;
  }

  async findAllForLead(leadId: string) {
    const followups = await this.prisma.followups.findMany({
      where: { lead_id: leadId },
      include: {
        // Include partner who created it
        partners: {
          select: { name: true },
        },
        // Include all comments for each followup
        followup_comments: {
          include: {
            partners: {
              select: { name: true },
            },
          },
          orderBy: {
            created_at: 'asc',
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    // Convert BigInt comment IDs to strings
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

  async addComment(
    followupId: string,
    createCommentDto: CreateFollowupCommentDto,
    userId: string,
  ) {
    // Check if the parent followup exists
    await this.findFollowupOrThrow(followupId);

    const comment = await this.prisma.followup_comments.create({
      data: {
        text: createCommentDto.text,
        followup_id: followupId,
        created_by: userId,
      },
      include: {
        partners: { select: { name: true } }, // Return the creator's name
      },
    });

    // Convert BigInt to string for JSON serialization
    return {
      ...comment,
      id: comment.id.toString(),
    };
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