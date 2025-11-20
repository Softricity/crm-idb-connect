// src/applications/applications.controller.ts
import { Controller, Get, Patch, Body, Param, UseGuards, 
  UseInterceptors, UploadedFiles } from '@nestjs/common';
import {
  UpdatePersonalDetailsDto,
  UpdateEducationDto,
  UpdatePreferencesDto,
  UpdateTestsDto,
  UpdateWorkExperienceDto,
  UpdateVisaDetailsDto,
  UpdateDocumentsDto,
} from './dto/update-sections.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { ApplicationsService } from './applications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get(':leadId')
  getOne(@Param('leadId') leadId: string) {
    return this.applicationsService.getFullApplication(leadId);
  }

  @Patch(':leadId/personal')
  updatePersonal(@Param('leadId') leadId: string, @Body() dto: UpdatePersonalDetailsDto) {
    return this.applicationsService.updatePersonalDetails(leadId, dto);
  }

  @Patch(':leadId/education')
  updateEducation(@Param('leadId') leadId: string, @Body() dto: UpdateEducationDto) {
    return this.applicationsService.updateEducation(leadId, dto);
  }

  @Patch(':leadId/preferences')
  updatePreferences(@Param('leadId') leadId: string, @Body() dto: UpdatePreferencesDto) {
    return this.applicationsService.updatePreferences(leadId, dto);
  }

  @Patch(':leadId/tests')
  updateTests(@Param('leadId') leadId: string, @Body() dto: UpdateTestsDto) {
    return this.applicationsService.updateTests(leadId, dto);
  }

  @Patch(':leadId/work-experience')
  updateWorkExperience(@Param('leadId') leadId: string, @Body() dto: UpdateWorkExperienceDto) {
    return this.applicationsService.updateWorkExperience(leadId, dto);
  }

  @Patch(':leadId/visa')
  updateVisa(@Param('leadId') leadId: string, @Body() dto: UpdateVisaDetailsDto) {
    return this.applicationsService.updateVisaDetails(leadId, dto);
  }

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
    @UploadedFiles()
    files: {
      profile_photo?: Express.Multer.File[];
      passport_copy?: Express.Multer.File[];
      academic_documents?: Express.Multer.File[];
      english_test_cert?: Express.Multer.File[];
      sop?: Express.Multer.File[];
      cv_resume?: Express.Multer.File[];
      recommendation_letters?: Express.Multer.File[];
      financial_documents?: Express.Multer.File[];
      other_documents?: Express.Multer.File[];
    },
  ) {
    // We pass the files object directly to the service
    return this.applicationsService.updateDocuments(leadId, files);
  }
}