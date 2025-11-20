// src/applications/applications.controller.ts
import { Controller, Get, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  UpdatePersonalDetailsDto,
  UpdateEducationDto,
  UpdatePreferencesDto,
  UpdateTestsDto,
  UpdateWorkExperienceDto,
  UpdateVisaDetailsDto,
  UpdateDocumentsDto,
} from './dto/update-sections.dto';
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
  updateDocuments(@Param('leadId') leadId: string, @Body() dto: UpdateDocumentsDto) {
    return this.applicationsService.updateDocuments(leadId, dto);
  }
}