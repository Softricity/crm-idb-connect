// src/courses/courses.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards, Patch, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseFilterDto } from './dto/course-filter.dto';
import { Roles } from '../auth/roles.decorator';
import { Role } from '../auth/roles.enum';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Public } from '../auth/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  // POST /courses (Admin Only)
  @Post()
  @Roles(Role.Admin)
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  // GET /courses (Public or Protected, depending on your need)
  // Supports query params: ?search=MBA&country=USA&level=Masters
  @Get()
  findAll(@Query() filters: CourseFilterDto) {
    // Handle array params which might come as single strings
    // e.g. ?country=USA&country=UK -> ['USA', 'UK']
    // e.g. ?country=USA -> 'USA' (needs wrapping)
    
    const normalizeArray = (val: any) => {
        if (!val) return undefined;
        return Array.isArray(val) ? val : [val];
    };

    const cleanFilters: CourseFilterDto = {
        search: filters.search,
        country: normalizeArray(filters.country),
        level: normalizeArray(filters.level),
        universityId: filters.universityId,
        intake: normalizeArray(filters.intake),
    };

    return this.coursesService.findAll(cleanFilters);
  }
  
  // GET /courses/filters
  // Returns available options for the sidebar
  @Get('filters')
  getFilters() {
    return this.coursesService.getFilterOptions();
  }

  // GET /courses/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  // PATCH /courses/:id (Admin Only)
  @Patch(':id')
  @Roles(Role.Admin)
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  // DELETE /courses/:id (Admin Only)
  @Delete(':id')
  @Roles(Role.Admin)
  remove(@Param('id') id: string) {
    return this.coursesService.remove(id);
  }
}