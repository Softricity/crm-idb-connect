import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CoursesService {
  constructor(private prisma: PrismaService) {}

  async create(createCourseDto: CreateCourseDto) {
    const { 
      university_id, 
      fee_type,
      original_fee,
      fee_currency,
      fee,
      course_currency,
      application_fee,
      application_currency,
      intake_month,
      commission_type,
      commission_value,
      details,
      ...rest 
    } = createCourseDto;
    
    // Verify university exists
    const university = await this.prisma.university.findUnique({
      where: { id: university_id },
    });
    if (!university) throw new NotFoundException('University not found');

    return this.prisma.course.create({
      data: {
        ...rest,
        feeType: fee_type,
        originalFee: original_fee,
        feeCurrency: fee_currency,
        fee,
        courseCurrency: course_currency,
        applicationFee: application_fee,
        applicationCurrency: application_currency,
        intakeMonth: intake_month,
        commissionType: commission_type,
        commissionValue: commission_value,
        details: details ? details : undefined,
        universityId: university_id,
      },
    });
  }

  async findAll(filters: CourseFilterDto, user?: any) {
    const { search, country, level, university, universityId, intake } = filters;

    // Build dynamic where clause
    const where: Prisma.CourseWhereInput = {};

    // 1. Filter by University ID
    if (universityId) {
      where.universityId = universityId;
    }

    // 2. Search
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } },
        { university: { name: { contains: search, mode: 'insensitive' as Prisma.QueryMode } } },
      ];
    }

    // 3. Filter by Level
    if (level && level.length > 0) {
      where.level = { in: level };
    }

    // 4 & 5. Handle University & Country Relation Filters
    const universityWhere: Prisma.UniversityWhereInput = {};
    let hasUniversityFilter = false;

    if (university && university.length > 0) {
      universityWhere.name = { in: university };
      hasUniversityFilter = true;
    }

    if (country && country.length > 0) {
      universityWhere.country = { name: { in: country } };
      hasUniversityFilter = true;
    }

    if (hasUniversityFilter && !universityId) {
      where.university = universityWhere;
    }

    // 6. Filter by Intake (The part that caused your error)
    if (intake && intake.length > 0) {
      const intakeCondition: Prisma.CourseWhereInput = {
        OR: intake.map((month) => ({
          intakeMonth: { 
            contains: month, 
            mode: 'insensitive' as Prisma.QueryMode // 👈 FIX 1: Explicit Cast
          },
        })),
      };
      
      if (where.OR) {
        // If Search exists, Intake must ALSO match (AND logic)
        where.AND = Array.isArray(where.AND) 
          ? [...where.AND, intakeCondition] 
          : [intakeCondition];
      } else {
        where.OR = intakeCondition.OR;
      }
    }

    // --- 🔒 7. ACCESS CONTROL LOGIC ---
    
    if (user && user.type === 'agent') {
      const accessControl: Prisma.CourseWhereInput = {};

      if (user.country) {
        // 🌍 Restrict to Agent's Assigned Country
        accessControl.university = {
          country: { 
            name: { equals: user.country, mode: 'insensitive' as Prisma.QueryMode } // 👈 FIX 2
          }
        };
      } else if (user.region) {
        // 🗺️ Restrict to Agent's Assigned Region
        accessControl.university = {
          country: { 
            region: { equals: user.region, mode: 'insensitive' as Prisma.QueryMode } // 👈 FIX 3
          }
        };
      }

      // Merge into the main query securely using AND
      if (Object.keys(accessControl).length > 0) {
        if (where.AND) {
          if (Array.isArray(where.AND)) {
            (where.AND as any[]).push(accessControl);
          } else {
            where.AND = [where.AND, accessControl];
          }
        } else {
          where.AND = [accessControl];
        }
      }
    }

    return this.prisma.course.findMany({
      where,
      include: {
        university: {
          include: {
            country: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        university: {
          include: { country: true },
        },
      },
    });
    if (!course) throw new NotFoundException(`Course ${id} not found`);
    return course;
  }

  async update(id: string, updateCourseDto: UpdateCourseDto) {
    // Verify course exists
    await this.findOne(id);

    const {
      fee_type,
      original_fee,
      fee_currency,
      fee,
      course_currency,
      application_fee,
      application_currency,
      intake_month,
      commission_type,
      commission_value,
      details,
      ...rest
    } = updateCourseDto;

    return this.prisma.course.update({
      where: { id },
      data: {
        ...rest,
        feeType: fee_type,
        originalFee: original_fee,
        feeCurrency: fee_currency,
        fee,
        courseCurrency: course_currency,
        applicationFee: application_fee,
        applicationCurrency: application_currency,
        intakeMonth: intake_month,
        commissionType: commission_type,
        commissionValue: commission_value,
        details: details !== undefined ? details : undefined,
      },
      include: {
        university: {
          include: { country: true },
        },
      },
    });
  }

  async remove(id: string) {
    // Verify course exists
    await this.findOne(id);
    
    return this.prisma.course.delete({
      where: { id },
    });
  }
  
  // Helper to get filter options (for your sidebar)
  async getFilterOptions() {
    const [countries, universities, levels] = await Promise.all([
      this.prisma.country.findMany({ select: { name: true } }),
      this.prisma.university.findMany({ select: { name: true } }),
      this.prisma.course.groupBy({ by: ['level'], _count: true }),
    ]);

    return {
      countries: countries.map(c => c.name),
      universities: universities.map(u => u.name),
      levels: levels.map(l => l.level).filter(Boolean),
    };
  }
}