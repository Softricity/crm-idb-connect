// src/applications/applications.controller.ts
import { Controller, Get, Patch, Body, Param } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import {
  UpdatePersonalDto,
  UpdateIdentificationsDto,
  UpdatePreferencesDto,
  UpdateFamilyDto,
  UpdateAddressDto,
  UpdateDocumentsDto,
  UpdateDeclarationsDto
} from './dto/update-sections.dto';

@Controller('applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Get(':leadId')
  getApplication(@Param('leadId') leadId: string) {
    return this.applicationsService.getApplication(leadId);
  }

  @Patch(':leadId/personal')
  updatePersonal(@Param('leadId') leadId: string, @Body() dto: UpdatePersonalDto) {
    return this.applicationsService.updatePersonal(leadId, dto);
  }

  @Patch(':leadId/identifications')
  updateIdentifications(@Param('leadId') leadId: string, @Body() dto: UpdateIdentificationsDto) {
    return this.applicationsService.updateIdentifications(leadId, dto);
  }

  @Patch(':leadId/preferences')
  updatePreferences(@Param('leadId') leadId: string, @Body() dto: UpdatePreferencesDto) {
    return this.applicationsService.updatePreferences(leadId, dto);
  }

  @Patch(':leadId/family')
  updateFamily(@Param('leadId') leadId: string, @Body() dto: UpdateFamilyDto) {
    return this.applicationsService.updateFamily(leadId, dto);
  }

  @Patch(':leadId/address')
  updateAddress(@Param('leadId') leadId: string, @Body() dto: UpdateAddressDto) {
    return this.applicationsService.updateAddress(leadId, dto);
  }

  @Patch(':leadId/documents')
  updateDocuments(@Param('leadId') leadId: string, @Body() dto: UpdateDocumentsDto) {
    return this.applicationsService.updateDocuments(leadId, dto);
  }

  @Patch(':leadId/declarations')
  updateDeclarations(@Param('leadId') leadId: string, @Body() dto: UpdateDeclarationsDto) {
    return this.applicationsService.updateDeclarations(leadId, dto);
  }
}