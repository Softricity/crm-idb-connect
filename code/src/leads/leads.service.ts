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
import { Prisma } from '../../generated/prisma/client';


@Injectable()
export class LeadsService {
    constructor(
        private prisma: PrismaService,
        private mailService: MailService,
    ) { }

    async bulkAssign(bulkAssignDto: BulkAssignDto, user: any) {
    const { leadIds, counsellorId } = bulkAssignDto;

    // Optional: Check if counsellorId is valid
    if (counsellorId) {
      const counsellor = await this.prisma.partners.findUnique({
        where: { id: counsellorId, role: 'counsellor' },
      });
      if (!counsellor) {
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
      where: {
        id: { in: leadIds },
      },
      data: {
        status: status,
        reason: reason || null, // Set reason, or clear it if not provided
      },
    });

    // TODO: Add timeline logging for each lead status change.
    // This requires fetching old statuses first, then looping.
    
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

    private generateRandomPassword(length = 8): string {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    async create(createLeadDto: CreateLeadDto) {
        const { email, mobile } = createLeadDto;


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

        // 3. Create Lead in DB (FIX: changed .lead to .leads)
        try {
            // Prisma schema uses snake_case for relations, so we map DTO fields
            const dataToCreate: Prisma.leadsCreateInput = {
                name: createLeadDto.name,
                mobile: createLeadDto.mobile,
                email: createLeadDto.email,
                type: createLeadDto.type,
                city: createLeadDto.city,
                purpose: createLeadDto.purpose,
                status: createLeadDto.status,
                alternate_mobile: createLeadDto.alternate_mobile,
                preferred_country: createLeadDto.preferred_country,
                utm_source: createLeadDto.utm_source,
                utm_medium: createLeadDto.utm_medium,
                utm_campaign: createLeadDto.utm_campaign,
                reason: createLeadDto.reason,
                password: password, // Save the generated password
                is_flagged: false,
                created_at: new Date(),
                // Handle relations using 'connect'
                partners_leads_created_byTopartners: createLeadDto.created_by
                    ? { connect: { id: createLeadDto.created_by } }
                    : undefined,
                partners_leads_assigned_toTopartners: createLeadDto.assigned_to
                    ? { connect: { id: createLeadDto.assigned_to } }
                    : undefined,
            };

            const newLead = await this.prisma.leads.create({
                data: dataToCreate,
            });

            // 4. Send Welcome Email (Async)
            await this.mailService.sendWelcomeEmail(email, password);

            return newLead;
        } catch (error) {
            console.error(error);
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === 'P2002') { // Unique constraint violation
                    throw new ConflictException('Lead with this email or mobile already exists.');
                }
            }
            throw new InternalServerErrorException('Failed to create lead');
        }
    }

    async findAll() {
        // Replaces fetchLeads() (FIX: changed .lead to .leads)
        return this.prisma.leads.findMany({
            where: { type: 'lead' },
            include: {
                // Use the relation name from your schema
                partners_leads_assigned_toTopartners: {
                    select: { name: true, email: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
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