// src/applications/applications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdatePersonalDto,
  UpdateIdentificationsDto,
  UpdatePreferencesDto,
  UpdateFamilyDto,
  UpdateAddressDto,
  UpdateDocumentsDto,
  UpdateDeclarationsDto,
} from './dto/update-sections.dto';
// Import Enums from your generated client
import {
  gender_enum,
  marital_status_enum,
  category_enum,
} from '../../generated/prisma/client';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Helper: Ensure an application record exists for a lead.
   * Returns the application ID.
   */
  private async ensureApplicationExists(leadId: string) {
    // Use findFirst because 'lead_id' is not marked @unique in your DB
    const lead = await this.prisma.leads.findFirst({ where: { id: leadId } });
    if (!lead) throw new NotFoundException(`Lead ${leadId} not found`);

    let application = await this.prisma.applications.findFirst({
      where: { lead_id: leadId },
    });

    if (!application) {
      application = await this.prisma.applications.create({
        data: {
          lead_id: leadId,
          // Removed 'status: draft' because the column doesn't exist in your DB
        },
      });

      // Also update lead type to 'application'
      await this.prisma.leads.update({
        where: { id: leadId },
        data: { type: 'application' },
      });
    }

    return application.id;
  }

  async getApplication(leadId: string) {
    // Changed findUnique -> findFirst
    const application = await this.prisma.applications.findFirst({
      where: { lead_id: leadId },
      include: {
        application_identifications: true,
        application_preferences: true,
        application_family_details: true,
        application_addresses: true,
        application_documents: true,
        application_declarations: true,
      },
    });

    if (!application) {
      return null;
    }
    return application;
  }

  // --- SECTION UPDATERS ---

  async updatePersonal(leadId: string, dto: UpdatePersonalDto) {
    const appId = await this.ensureApplicationExists(leadId);

    // Convert string inputs to Enums
    const data: any = { ...dto };
    if (dto.gender) data.gender = dto.gender as gender_enum;
    if (dto.marital_status)
      data.marital_status = dto.marital_status as marital_status_enum;
    if (dto.category) data.category = dto.category as category_enum;

    return this.prisma.applications.update({
      where: { id: appId },
      data: data,
    });
  }

  async updateIdentifications(leadId: string, dto: UpdateIdentificationsDto) {
    const appId = await this.ensureApplicationExists(leadId);

    // Manual Upsert logic (Find -> Update or Create)
    const existing = await this.prisma.application_identifications.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_identifications.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_identifications.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }

  async updatePreferences(leadId: string, dto: UpdatePreferencesDto) {
    const appId = await this.ensureApplicationExists(leadId);

    const existing = await this.prisma.application_preferences.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_preferences.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_preferences.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }

  async updateFamily(leadId: string, dto: UpdateFamilyDto) {
    const appId = await this.ensureApplicationExists(leadId);

    const existing = await this.prisma.application_family_details.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_family_details.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_family_details.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }

  async updateAddress(leadId: string, dto: UpdateAddressDto) {
    const appId = await this.ensureApplicationExists(leadId);

    const existing = await this.prisma.application_addresses.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_addresses.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_addresses.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }

  async updateDocuments(leadId: string, dto: UpdateDocumentsDto) {
    const appId = await this.ensureApplicationExists(leadId);

    const existing = await this.prisma.application_documents.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_documents.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_documents.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }

  async updateDeclarations(leadId: string, dto: UpdateDeclarationsDto) {
    const appId = await this.ensureApplicationExists(leadId);

    const existing = await this.prisma.application_declarations.findFirst({
      where: { application_id: appId },
    });

    if (existing) {
      return this.prisma.application_declarations.update({
        where: { id: existing.id },
        data: dto,
      });
    } else {
      return this.prisma.application_declarations.create({
        data: {
          application_id: appId,
          ...dto,
        },
      });
    }
  }
}