import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Prisma } from '../../generated/prisma/client';

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

  async findAll(filters: CourseFilterDto) {
    const { search, country, level, university, universityId, intake } = filters;

    // Build dynamic where clause
    const where: Prisma.CourseWhereInput = {};

    // 1. Filter by University ID (highest priority - direct filter)
    if (universityId) {
      where.universityId = universityId;
    }

    // 2. Search (Course Name or University Name)
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { university: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // 3. Filter by Level (e.g., ["Masters", "PhD"])
    if (level && level.length > 0) {
      where.level = { in: level };
    }

    // --- FIX: Handle University & Country Relation Filters Separately ---
    
    const universityWhere: Prisma.UniversityWhereInput = {};
    let hasUniversityFilter = false;

    // 4. Filter by University Name
    if (university && university.length > 0) {
      universityWhere.name = { in: university };
      hasUniversityFilter = true;
    }

    // 5. Filter by Country (requires querying the relation)
    if (country && country.length > 0) {
      universityWhere.country = { name: { in: country } };
      hasUniversityFilter = true;
    }

    // Assign the university filter if any condition was added (only if universityId is not set)
    if (hasUniversityFilter && !universityId) {
      where.university = universityWhere;
    }

    // ------------------------------------------------------------------

    // 6. Filter by Intake (Partial match, e.g. "Sep" in "Sep, Jan")
    if (intake && intake.length > 0) {
      where.OR = intake.map((month) => ({
        intakeMonth: { contains: month, mode: 'insensitive' },
      }));
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