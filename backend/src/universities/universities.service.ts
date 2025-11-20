import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUniversityDto } from './dto/create-university.dto';
import { UpdateUniversityDto } from './dto/update-university.dto';

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

  async findAll(countryId?: string) {
    return this.prisma.university.findMany({
      where: countryId ? { countryId } : undefined,
      include: { 
        country: true,
        _count: { select: { courses: true } }
      },
      orderBy: { name: 'asc' },
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