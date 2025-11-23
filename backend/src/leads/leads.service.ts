import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import {
  BulkAssignDto,
  BulkStatusDto,
  BulkMessageDto,
  BulkDeleteDto,
} from './dto/bulk-update.dto';
import { Prisma } from '@prisma/client';
import { TimelineService } from '../timeline/timeline.service';
import * as bcrypt from 'bcrypt';
import { getScope } from '../common/utils/scope.util';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private timelineService: TimelineService,
  ) { }

  private generateRandomPassword(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async create(createLeadDto: CreateLeadDto) {
    const { email, mobile } = createLeadDto;

    // 1. Check for duplicates
    const existingLead = await this.prisma.leads.findFirst({
      where: {
        OR: [{ email }, { mobile }],
      },
    });

    if (existingLead) {
      throw new ConflictException('Lead with this email or mobile already exists.');
    }

    // 2. Generate Password
    const password = this.generateRandomPassword();
    const hashedPassword = await this.hashPassword(password);

    try {
      // 3. Create Lead - EXPLICIT MAPPING
      // We map every field manually to ensure data integrity
      // Determine branch for this lead if created_by is provided
      let derivedBranchId: string | null = null;
      if (createLeadDto.created_by) {
        const creator = await this.prisma.partners.findUnique({
          where: { id: createLeadDto.created_by },
          select: { branch_id: true },
        });
        derivedBranchId = creator?.branch_id || null;
      }

      const newLead = await this.prisma.leads.create({
        data: {
          // --- A. The 5 Core Fields (From Form) ---
          name: createLeadDto.name,
          email: createLeadDto.email,
          mobile: createLeadDto.mobile,
          preferred_course: createLeadDto.preferred_course,
          preferred_country: createLeadDto.preferred_country,

          // --- B. System/Security Defaults ---
          password: hashedPassword,
          is_flagged: false,
          created_at: new Date(),
          status: createLeadDto.status || 'new',
          type: createLeadDto.type || 'lead',

          created_by: createLeadDto.created_by || null,
          assigned_to: createLeadDto.assigned_to || null,

          // --- D. Tracking Fields ---
          utm_source: createLeadDto.utm_source || null,
          utm_medium: createLeadDto.utm_medium || null,
          utm_campaign: createLeadDto.utm_campaign || null,

          // --- E. Unused/Future Fields ---
          reason: null,
          // Branch association
          branch_id: derivedBranchId,
        },
      });

      // 4. Send Welcome Email
      await this.mailService.sendWelcomeEmail(email, password);

      // 5. Log Timeline
      await this.timelineService.logLeadCreated(newLead);

      return newLead;
    } catch (error) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new ConflictException('Lead with this email or mobile already exists.');
        }
        // P2003 is foreign key constraint failed (e.g., invalid created_by UUID)
        if (error.code === 'P2003') {
          // Log specifically which field failed if needed
          throw new InternalServerErrorException('Invalid Partner ID provided for created_by or assigned_to');
        }
      }
      throw new InternalServerErrorException('Failed to create lead');
    }
  }

  async bulkAssign(bulkAssignDto: BulkAssignDto, user: any) {
    const { leadIds, counsellorId } = bulkAssignDto;

    // Optional: Check if counsellorId is valid
    if (counsellorId) {
      const counsellor = await this.prisma.partners.findUnique({
        where: { id: counsellorId },
        include: { role: true },
      });
      if (!counsellor || counsellor.role.name !== 'counsellor') {
        throw new NotFoundException(`Counsellor with ID ${counsellorId} not found.`);
      }
    }

    const result = await this.prisma.leads.updateMany({
      where: {
        id: { in: leadIds },
      },
      data: {
        assigned_to: counsellorId,
      },
    });

    return result;
  }

  async bulkUpdateStatus(bulkStatusDto: BulkStatusDto, user: any) {
    const { leadIds, status, reason } = bulkStatusDto;

    const result = await this.prisma.leads.updateMany({
      where: { id: { in: leadIds } },
      data: { status, reason: reason || null },
    });

    // 2. Log events for each lead (async, don't await loop to return fast)
    leadIds.forEach(async (leadId) => {
      // Ideally fetch old status first for accuracy, but for bulk we can just log the new status
      await this.timelineService.logStatusChange(leadId, user.id, 'Previous', status);
    });

    return result;
  }

  async bulkSendMessage(bulkMessageDto: BulkMessageDto, user: any) {
    const { leadIds, message } = bulkMessageDto;

    // 1. Fetch all leads to get their phone numbers
    const leads = await this.prisma.leads.findMany({
      where: {
        id: { in: leadIds },
      },
      select: {
        id: true,
        name: true,
        mobile: true,
      },
    });

    // 2. Loop and send messages (e.g., via Twilio, Vonage, etc.)
    let successCount = 0;
    let failCount = 0;

    for (const lead of leads) {
      try {
        // --- PSEUDO-CODE for sending SMS ---
        // await smsProvider.send({
        //   to: lead.mobile,
        //   from: process.env.TWILIO_NUMBER,
        //   body: message,
        // });

        // TODO: Log a timeline event for each message sent

        successCount++;
      } catch (error) {
        console.error(`Failed to send message to lead ${lead.id}:`, error);
        failCount++;
      }
    }

    return {
      success: successCount,
      failed: failCount,
      total: leads.length,
    };
  }

  async findAll(
    user: any,
    assignedTo?: string,
    createdBy?: string,
    type?: string,
    branchId?: string,
    email?: string,
  ) {
    // If branchId provided, override scope to that branch (authorized users only)
    let where: any = { type: type || 'lead' };

    if (branchId) {
      where.branch_id = branchId;
    } else {
      const scope = getScope(user);
      where = { ...where, ...scope };
    }

    if (assignedTo) where.assigned_to = assignedTo;
    if (createdBy) where.created_by = createdBy;
    if (email) where.email = email;

    return this.prisma.leads.findMany({
      where,
      include: {
        partners_leads_assigned_toTopartners: {
          select: { name: true, email: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async login(email: string, password: string) {
    try {
      const lead = await this.prisma.leads.findUnique({
        where: { email },
      });

      if (!lead) {
        throw new NotFoundException('Lead not found with the provided email.');
      }

      const isPasswordValid = await bcrypt.compare(password, lead.password ?? "");
      if (!isPasswordValid) {
        throw new BadRequestException('Invalid password.');
      }

      // Return lead details excluding password
      const { password: _, ...leadData } = lead;
      return leadData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async findOne(id: string) {
    if (typeof id !== 'string' || (id.length !== 36 && id.length !== 32)) {
      throw new BadRequestException('Invalid id: incorrect UUID length');
    }

    try {
      const lead = await this.prisma.leads.findUnique({
        where: { id },
        include: {
          // Use the relation name from your schema
          partners_leads_assigned_toTopartners: { select: { name: true, email: true } },
        },
      });

      if (!lead) {
        throw new NotFoundException(`Lead not found for id: ${id}`);
      }

      return lead;
    } catch (error) {
      console.error(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error('')
      }
      throw new InternalServerErrorException('Failed to retrieve lead');
    }
  }

  async update(id: string, updateLeadDto: Prisma.leadsUpdateInput) {
    // Replaces updateLead() (FIX: changed .lead to .leads)
    return this.prisma.leads.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string) {
    try {
      await this.prisma.leads.delete({
        where: { id },
      });
      return { message: `Lead with ID ${id} deleted successfully.` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Lead with ID ${id} not found.`);
      }
      throw new InternalServerErrorException('Failed to delete lead.');
    }
  }

  async bulkDelete(bulkDeleteDto: BulkDeleteDto) {
    const { leadIds } = bulkDeleteDto;

    // Optional: You could check if any of these leads belong to 'protected' status if needed.

    const result = await this.prisma.leads.deleteMany({
      where: {
        id: { in: leadIds },
      },
    });

    return { message: `Successfully deleted ${result.count} leads.` };
  }
}