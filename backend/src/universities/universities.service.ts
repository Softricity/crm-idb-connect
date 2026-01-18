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
    
    // Verify country exists
    const country = await this.prisma.country.findUnique({ where: { id: countryId } });
    if (!country) throw new NotFoundException(`Country ${countryId} not found`);

    return this.prisma.university.create({
      data: {
        ...data,
        countryId: countryId, // Map camelCase to prisma schema name
      },
    });
  }

  async findAll(user?: any) {
    const where: Prisma.UniversityWhereInput = {};

    // 🔒 ACCESS CONTROL LOGIC
    if (user) {
      // 1. If User is an AGENT
      if (user.type === 'agent') {
        // Priority 1: Restrict by specific Country (if agent has one)
        if (user.country) {
          where.country = { name: { equals: user.country, mode: 'insensitive' } };
        } 
        // Priority 2: Restrict by Region (if agent has no specific country)
        else if (user.region) {
          where.country = { region: { equals: user.region, mode: 'insensitive' } };
        }

        if (user.country) {
         // Filter OUT universities that have the agent's country in their blacklist
         where.NOT = {
           excluded_countries: { has: user.country }
         };
        }
      }
      
      // 2. If User is a PARTNER (Counselor) - Optional
      // You can add logic here if counselors are also region-restricted
      // if (user.role === 'counsellor' && user.zone) { ... }
    }

    return this.prisma.university.findMany({
      where,
      include: {
        country: true, // Include country details to show flags/regions
        _count: { select: { courses: true } } // Optional: Show course count
      },
      orderBy: { name: 'asc' }
    });
  }

  async findOne(id: string) {
    const university = await this.prisma.university.findUnique({
      where: { id },
      include: { country: true, courses: true }, // Include courses
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
                ...(countryId && { countryId }) // Only update if provided
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