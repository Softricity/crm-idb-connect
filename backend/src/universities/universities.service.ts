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

  async findAll(user?: any, countryId?: string) {
    console.log('🔍 Universities.findAll called with:', { 
      userType: user?.type, 
      userRole: user?.role,
      countryId 
    });
    
    const where: Prisma.UniversityWhereInput = {};

    // Priority 1: If countryId is explicitly provided (UI filter), use it directly
    // This applies to ALL user types (admin, partner, agent)
    if (countryId) {
      where.countryId = countryId;
      console.log('✅ Filtering by countryId:', countryId);
      
      // Even with explicit countryId, still apply blacklist for agents
      if (user?.type === 'agent' && user.country) {
        where.NOT = {
          excluded_countries: { has: user.country }
        };
        console.log('🚫 Applying blacklist filter for agent country:', user.country);
      }
    } 
    // Priority 2: No explicit countryId - apply access control based on user type
    else if (user?.type === 'agent') {
      console.log('🔒 Applying agent access control');
      // AGENT-specific access control
      // Priority 1: Restrict by specific Country (if agent has one)
      if (user.country) {
        where.country = { name: { equals: user.country, mode: 'insensitive' } };
        // Also apply blacklist
        where.NOT = {
          excluded_countries: { has: user.country }
        };
        console.log('🌍 Agent restricted to country:', user.country);
      } 
      // Priority 2: Restrict by Region (if agent has no specific country)
      else if (user.region) {
        where.country = { region: { equals: user.region, mode: 'insensitive' } };
        console.log('🗺️ Agent restricted to region:', user.region);
      }
    } else {
      console.log('👤 Partner/Admin - no restrictions applied');
    }
    // For partners/admins without explicit countryId: return all universities
    // (no restrictions applied)

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