import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCommissionDto) {
    let agentId: string | null = null;

    // 1. Auto-Detect Agent Logic (Updated)
    if (createDto.lead_id) {
      const lead = await this.prisma.leads.findUnique({ 
        where: { id: createDto.lead_id } 
      });
      
      // ✅ FIX: Check the dedicated 'agent_id' column directly
      if (lead && lead.agent_id) {
        agentId = lead.agent_id;
      }
    } 
    else if (createDto.application_id) {
      const app = await this.prisma.applications.findUnique({ 
        where: { id: createDto.application_id },
        include: { leads: true } 
      });
      
      // ✅ FIX: Check the lead's 'agent_id' via the application
      if (app && app.leads && app.leads.agent_id) {
         agentId = app.leads.agent_id;
      }
    }

    if (!agentId) {
      // Optional: You can throw an error if a commission MUST be linked to an agent
      // throw new BadRequestException("This Lead/Application is not linked to any Agent.");
    }

    // 2. Create Record
    return this.prisma.commission.create({
      data: {
        lead_id: createDto.lead_id,
        application_id: createDto.application_id,
        agent_id: agentId, // Automatically linked from the lead
        amount: createDto.amount,
        currency: createDto.currency || 'INR',
        status: createDto.status || 'PENDING',
        remarks: createDto.remarks
      },
      include: {
        agent: { select: { name: true, agency_name: true } },
        lead: { select: { name: true } }
      }
    });
  }

  // Admin: Find All
  async findAll() {
    return this.prisma.commission.findMany({
      include: {
        agent: { select: { name: true, agency_name: true } },
        lead: { select: { name: true } },
        application: { select: { student_id: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  // Agent: Find My Commissions
  async findMyCommissions(agentId: string) {
    return this.prisma.commission.findMany({
      where: { agent_id: agentId },
      include: {
        lead: { select: { name: true } },
        application: { select: { student_id: true, application_stage: true } }
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findOne(id: string) {
    const commission = await this.prisma.commission.findUnique({
      where: { id },
      include: { agent: true, lead: true, application: true }
    });
    if (!commission) throw new NotFoundException(`Commission ${id} not found`);
    return commission;
  }

  async update(id: string, updateDto: UpdateCommissionDto) {
    return this.prisma.commission.update({
      where: { id },
      data: updateDto,
    });
  }

  async remove(id: string) {
    return this.prisma.commission.delete({ where: { id } });
  }
}