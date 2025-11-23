// src/applications/applications.controller.ts
import { Controller, Get, Patch, Body, Param, UseGuards, 
  UseInterceptors, UploadedFiles } from '@nestjs/common';
import {
  UpdatePersonalDetailsDto, UpdateEducationDto, UpdatePreferencesDto,
  UpdateTestsDto, UpdateWorkExperienceDto, UpdateVisaDetailsDto,
} from './dto/update-sections.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/get-user.decorator';
import { Public } from '../auth/public.decorator';

// Guard removed from class; individual endpoints made public for student panel access.
// SECURITY NOTE: Public write access allows anyone with a leadId to modify data.
// Consider implementing a proper Lead JWT auth in future.
// @UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Public()
  @Get(':leadId')
  getOne(@Param('leadId') leadId: string) {
    return this.applicationsService.getFullApplication(leadId, null);
  }

  @Public()
  @Patch(':leadId/personal')
  updatePersonal(@Param('leadId') leadId: string, @Body() dto: UpdatePersonalDetailsDto) {
    return this.applicationsService.updatePersonalDetails(leadId, dto, null);
  }

  // New alias for family-only updates used by student panel step "family"
  @Public()
  @Patch(':leadId/family')
  updateFamily(@Param('leadId') leadId: string, @Body() body: any) {
    return this.applicationsService.updateFamilyDetails(leadId, body, null);
  }

  @Public()
  @Patch(':leadId/education')
  updateEducation(@Param('leadId') leadId: string, @Body() dto: UpdateEducationDto) {
    return this.applicationsService.updateEducation(leadId, dto, null);
  }

  @Public()
  @Patch(':leadId/preferences')
  updatePreferences(@Param('leadId') leadId: string, @Body() dto: UpdatePreferencesDto) {
    return this.applicationsService.updatePreferences(leadId, dto, null);
  }

  @Public()
  @Patch(':leadId/tests')
  updateTests(@Param('leadId') leadId: string, @Body() dto: UpdateTestsDto) {
    return this.applicationsService.updateTests(leadId, dto, null);
  }

  @Public()
  @Patch(':leadId/work-experience')
  updateWorkExperience(@Param('leadId') leadId: string, @Body() dto: UpdateWorkExperienceDto) {
    return this.applicationsService.updateWorkExperience(leadId, dto, null);
  }

  // Alias route matching student panel section key "work"
  @Public()
  @Patch(':leadId/work')
  updateWorkAlias(@Param('leadId') leadId: string, @Body() body: any) {
    const dto: UpdateWorkExperienceDto = { records: body.work_experience || body.records || [] };
    return this.applicationsService.updateWorkExperience(leadId, dto, null);
  }

  @Public()
  @Patch(':leadId/visa')
  updateVisa(@Param('leadId') leadId: string, @Body() dto: UpdateVisaDetailsDto) {
    return this.applicationsService.updateVisaDetails(leadId, dto, null);
  }

  @Public()
  @Patch(':leadId/documents')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile_photo', maxCount: 1 },
      { name: 'passport_copy', maxCount: 1 },
      { name: 'academic_documents', maxCount: 10 },
      { name: 'english_test_cert', maxCount: 1 },
      { name: 'sop', maxCount: 1 },
      { name: 'cv_resume', maxCount: 1 },
      { name: 'recommendation_letters', maxCount: 5 },
      { name: 'financial_documents', maxCount: 1 },
      { name: 'other_documents', maxCount: 1 },
    ]),
  )
  updateDocuments(
    @Param('leadId') leadId: string,
    @UploadedFiles() files: any,
  ) {
    return this.applicationsService.updateDocuments(leadId, files, null);
  }
}