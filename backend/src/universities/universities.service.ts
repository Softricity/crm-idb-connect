import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class UniversitiesService {
  constructor(private prisma: PrismaService) {}

  async create(createUniversityDto: CreateUniversityDto) {
    const { countryId, ...data } = createUniversityDto;
    
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new NotFoundException(`Country ${countryId} not found`);

    return this.prisma.university.create({
      data: {
        ...data,
        countryId: countryId,
      },
    });
  }

  async findAll(user?: any, countryId?: string) {
    const where: Prisma.UniversityWhereInput = {};

    if (countryId) {
      where.countryId = countryId;
    }

    const isAgentContext =
      user?.role === 'agent' ||
      user?.type === 'agent' ||
      user?.type === 'agent_team_member';
    if (isAgentContext) {
      const agentId = user?.type === 'agent_team_member' ? user?.parent_agent_id : user?.id || user?.userId;
      if (agentId) {
        const accessRows = await this.prisma.agentUniversityAccess.findMany({
          where: { agent_id: agentId },
          select: { university_id: true },
        });
        const accessibleIds = accessRows.map((r) => r.university_id);
        if (accessibleIds.length === 0) {
          return [];
        }
        where.id = { in: accessibleIds };
      }
    }

    return this.prisma.university.findMany({
      where,
      include: {
        country: true,
        _count: { select: { courses: true } }
      },
      orderBy: { name: 'asc' }
    });
  }

  async findAllWithAccess(user: any) {
    const agentId = user?.type === 'agent_team_member' ? user?.parent_agent_id : user?.id || user?.userId;
    const [universities, rows] = await Promise.all([
      this.prisma.university.findMany({
        include: { country: true, _count: { select: { courses: true } } },
        orderBy: { name: 'asc' },
      }),
      this.prisma.agentUniversityAccess.findMany({
        where: { agent_id: agentId },
        select: { university_id: true },
      }),
    ]);
    const allowed = new Set(rows.map((r) => r.university_id));
    return universities.map((u) => ({
      ...u,
      is_accessible: allowed.has(u.id),
    }));
  }

  async findOne(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: { country: true, courses: true },
    });
    if (!university) throw new NotFoundException(`University ${id} not found`);
    return university;
  }

  async update(id: string, updateUniversityDto: UpdateUniversityDto) {
    try {
        const { countryId, ...data } = updateUniversityDto;
        return await this.prisma.university.update({
            where: { id },
            data: {
                ...data,
                ...(countryId && { countryId })
            },
        });
    } catch (error) {
        if (error.code === 'P2025') throw new NotFoundException(`University ${id} not found`);
        throw error;
    }
  }

  async remove(id: string) {
    try {
      await this.prisma.university.delete({ where: { id } });
      return { message: `University ${id} deleted successfully` };
    } catch (error) {
      if (error.code === 'P2025') throw new NotFoundException(`University ${id} not found`);
      throw error;
    }
  }
}
