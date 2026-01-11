// src/announcements/announcements.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  // 1. Create: Auto-assign branch_id if not provided?
  // Usually announcements are global or specific.
  // For now, we trust the Admin to select the target correctly.
  async create(createDto: CreateAnnouncementDto, userId: string) {
    // Normalize roles to lowercase for consistent comparison
    const normalizedRoles = createDto.roles?.map(role => role.toLowerCase()) || [];
    
    return this.prisma.announcements.create({
      data: {
        title: createDto.title,
        content: createDto.content,
        target_audience: createDto.target_audience,
        users: createDto.users || [],
        branches: createDto.branches || [],
        roles: normalizedRoles,
        branch_id: createDto.branch_id,
        is_active: createDto.is_active ?? true,
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

    // Normalize user role to lowercase for consistent comparison
    const userRole = user.role?.toLowerCase() || '';

    // B. Scoping Logic
    if (userRole === 'super admin') {
      // Admins see EVERYTHING (Management View)
      // No extra filters needed
    } else {
      // Standard Users (Consumption View)
      // They see:
      // 1. Announcements specifically for them (target_audience = 'user' AND users array contains their ID)
      // 2. Announcements for all branches (target_audience = 'branch')
      // 3. Announcements for their specific branch (target_audience = 'branch-specific' AND branches array contains their branch_id)
      // 4. Announcements for their role (target_audience = 'role-based' AND roles array contains their role - case insensitive)
      where.OR = [
        { 
          target_audience: 'user', 
          users: { has: user.id } 
        },
        { 
          target_audience: 'branch'
        },
        { 
          target_audience: 'branch-specific', 
          branches: { has: user.branch_id }
        },
        { 
          target_audience: 'role-based', 
          roles: { has: userRole }
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