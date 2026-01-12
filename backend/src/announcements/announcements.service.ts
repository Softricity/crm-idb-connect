// src/announcements/announcements.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create
  async create(createDto: CreateAnnouncementDto, userId: string) {
    // Destructure to ensure we only pass fields that exist in the Prisma Schema
    const { title, content, target_audience, users, branch_id, is_active } = createDto;

    return this.prisma.announcements.create({
      data: {
        title,
        content,
        target_audience,
        users: users ?? [],     // Default to empty array if null
        branch_id: branch_id,   // ✅ Correct field name (matches schema)
        is_active: is_active ?? true,
        created_by: userId,
      },
      include: {
        partners: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // 2. FindAll: The Core Logic
  async findAll(user: any, includeInactive = false) {
    const where: any = {};

    // A. "Active" Filter
    if (!includeInactive) {
      where.is_active = true;
    }

    // B. Scoping Logic
    if (user.role === 'admin') {
      // Admins see EVERYTHING (Management View)
    } else {
      // Standard Users (Consumption View)
      where.OR = [
        { 
          target_audience: 'user', 
          users: { has: user.id } 
        },
        { 
          target_audience: 'branch', 
          branch_id: user.branch_id // <--- Match User's Branch
        },
      ];
    }

    return this.prisma.announcements.findMany({
      where,
      include: {
        partners: { select: { id: true, name: true, email: true } },
        announcement_reads: {
          where: { partner_id: user.id }, // Check if *this* user read it
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async findOne(id: string) {
    const announcement = await this.prisma.announcements.findUnique({
      where: { id },
      include: {
        partners: { select: { id: true, name: true, email: true } },
        announcement_reads: {
          include: {
            partners: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!announcement) throw new NotFoundException(`Announcement ${id} not found`);
    return announcement;
  }

  async update(id: string, updateDto: UpdateAnnouncementDto) {
    await this.findOne(id);
    return this.prisma.announcements.update({
      where: { id },
      data: updateDto,
      include: { partners: { select: { id: true, name: true, email: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.announcements.delete({ where: { id } });
    return { message: 'Announcement deleted successfully' };
  }

  async markAsRead(announcementId: string, userId: string) {
    await this.findOne(announcementId);
    return this.prisma.announcement_reads.upsert({
      where: {
        announcement_id_partner_id: {
          announcement_id: announcementId,
          partner_id: userId,
        },
      },
      create: { announcement_id: announcementId, partner_id: userId },
      update: { read_at: new Date() },
    });
  }

  async getUnreadCount(user: any) {
    // Reuse findAll to ensure scoping rules apply
    const announcements = await this.findAll(user, false);
    
    // Count how many have NO read record for this user
    const unreadCount = announcements.filter(
      (a) => a.announcement_reads.length === 0
    ).length;

    return { unreadCount };
  }
}