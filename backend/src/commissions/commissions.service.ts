import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { UpdateCommissionDto } from './dto/update-commission.dto';
import { CommissionType } from '@prisma/client'; 

@Injectable()
export class CommissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateCommissionDto) {
    let amount = createDto.amount; 
    let currency = createDto.currency || 'INR';
    let agentId: string | null = null;

    // 1. Auto-Detect Agent Logic
    if (createDto.lead_id) {
      const lead = await this.prisma.leads.findUnique({ 
        where: { id: createDto.lead_id },
        select: { agent_id: true } 
      });
      if (lead && lead.agent_id) agentId = lead.agent_id;
    } 
    else if (createDto.application_id) {
      const app = await this.prisma.applications.findUnique({ 
        where: { id: createDto.application_id },
        include: { 
            leads: { select: { agent_id: true } } 
        } 
      });
      if (app && app.leads && app.leads.agent_id) agentId = app.leads.agent_id;
    }

    // 2. Auto-Calculate Amount Logic
    if (createDto.application_id && !createDto.amount) {
      const app = await this.prisma.applications.findUnique({
        where: { id: createDto.application_id },
        include: { 
          // Match existing relation name
          preferences: {
            take: 1, 
            include: {
                // Match the NEW relation created in Step 1
                course: {
                    include: { university: true }
                }
            }
          }
        }
      });

      // Safe Navigation
      const preference = app?.preferences?.[0];
      const course = preference?.course;
      const university = course?.university;

      if (university && university.commission_value) {
        let commissionPercent = Number(university.commission_value);
        let commissionType = university.commission_type;

        // NEW: Check for Category-based commission if agent exists
        if (agentId) {
          const agent = await this.prisma.agent.findUnique({
            where: { id: agentId },
            select: { category_id: true },
          });

          if (agent?.category_id) {
            const categoryAccess = await this.prisma.categoryUniversityAccess.findUnique({
              where: {
                category_id_university_id: {
                  category_id: agent.category_id,
                  university_id: university.id,
                },
              },
            });

            if (categoryAccess && categoryAccess.is_active) {
              commissionPercent = Number(categoryAccess.commission_percent);
              commissionType = 'PERCENTAGE'; // Category commissions are always percentage-based in this requirement
            }
          }
        }

        if (commissionType === 'FIXED') {
          // Flat Fee
          amount = Number(commissionPercent);
          currency = university.currency || 'INR';
        } 
        else {
          // Percentage of Tuition Fee
          const tuitionFee = course?.fee || 0; 
          amount = (Number(tuitionFee) * Number(commissionPercent)) / 100;
        }
      }
    }

    // 3. Create Record
    return this.prisma.commission.create({
      data: {
        lead_id: createDto.lead_id,
        application_id: createDto.application_id,
        agent_id: agentId, 
        amount: amount || 0,
        currency: currency,
        status: createDto.status || 'PENDING',
        remarks: createDto.remarks
      },
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agency_name: true,
            email: true,
            branch: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, label: true } },
          },
        },
        lead: { select: { id: true, name: true, email: true } },
        application: { select: { id: true, student_id: true } },
      }
    });
  }

  // ... (Keep existing findAll, findOne, update, remove methods)
  async findAll() {
    return this.prisma.commission.findMany({
      include: {
        agent: {
          select: {
            id: true,
            name: true,
            agency_name: true,
            email: true,
            branch: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, label: true } },
          },
        },
        lead: { select: { id: true, name: true, email: true } },
        application: { select: { id: true, student_id: true } },
      },
      orderBy: { created_at: 'desc' }
    });
  }

  async findMyCommissions(agentId: string) {
    return this.prisma.commission.findMany({
      where: { agent_id: agentId },
      include: {
        lead: { select: { id: true, name: true, email: true } },
        application: { select: { id: true, student_id: true, application_stage: true } },
        agent: {
          select: {
            id: true,
            branch: { select: { id: true, name: true } },
            category: { select: { id: true, name: true, label: true } },
          },
        },
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
    return this.prisma.commission.update({ where: { id }, data: updateDto });
  }

  async remove(id: string) {
    return this.prisma.commission.delete({ where: { id } });
  }
}
