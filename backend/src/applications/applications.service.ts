// src/applications/applications.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdatePersonalDetailsDto,
  UpdateEducationDto,
  UpdatePreferencesDto,
  UpdateTestsDto,
  UpdateWorkExperienceDto,
  UpdateVisaDetailsDto,
  UpdateDocumentsDto,
} from './dto/update-sections.dto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  // Helper: Find or Create Application
  private async getOrCreateApplication(leadId: string) {
    let app = await this.prisma.applications.findFirst({ where: { lead_id: leadId } });
    if (!app) {
      // Generate a simple Student ID (Logic can be improved)
      const studentId = `STU-${Date.now().toString().slice(-6)}`;
      app = await this.prisma.applications.create({
        data: { lead_id: leadId, student_id: studentId },
      });
    }
    return app;
  }

  // 1. Personal Details
  async updatePersonalDetails(leadId: string, dto: UpdatePersonalDetailsDto) {
    const app = await this.getOrCreateApplication(leadId);

    // Split data between 'applications' and 'family_details'
    const { 
      father_name, mother_name, emergency_contact_name, emergency_contact_number, 
      ...appData 
    } = dto;

    // Update main app
    await this.prisma.applications.update({
      where: { id: app.id },
      data: appData,
    });

    // Upsert Family Details
    const familyData = { father_name, mother_name, emergency_contact_name, emergency_contact_number };
    const existingFamily = await this.prisma.application_family_details.findFirst({ where: { application_id: app.id } });

    if (existingFamily) {
      await this.prisma.application_family_details.update({
        where: { id: existingFamily.id },
        data: familyData,
      });
    } else {
      await this.prisma.application_family_details.create({
        data: { application_id: app.id, ...familyData },
      });
    }

    return this.getFullApplication(leadId);
  }

  // 2. Education (One-to-Many Handling)
  async updateEducation(leadId: string, dto: UpdateEducationDto) {
    const app = await this.getOrCreateApplication(leadId);
    
    // Strategy: We can delete all and re-create, OR update individually. 
    // Here, we loop through records to upsert.
    for (const record of dto.records) {
      if (record.id) {
        await this.prisma.application_education.update({
          where: { id: record.id },
          data: { ...record, id: undefined }, // don't update ID
        });
      } else {
        await this.prisma.application_education.create({
          data: { ...record, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId);
  }

  // 3. Preferences
  async updatePreferences(leadId: string, dto: UpdatePreferencesDto) {
    const app = await this.getOrCreateApplication(leadId);
    const existing = await this.prisma.application_preferences.findFirst({ where: { application_id: app.id } });

    if (existing) {
      await this.prisma.application_preferences.update({ where: { id: existing.id }, data: dto });
    } else {
      await this.prisma.application_preferences.create({ data: { application_id: app.id, ...dto } });
    }
    return this.getFullApplication(leadId);
  }

  // 4. Tests (One-to-Many)
  async updateTests(leadId: string, dto: UpdateTestsDto) {
    const app = await this.getOrCreateApplication(leadId);
    for (const record of dto.records) {
      if (record.id) {
        await this.prisma.application_tests.update({
          where: { id: record.id },
          data: { ...record, id: undefined },
        });
      } else {
        await this.prisma.application_tests.create({
          data: { ...record, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId);
  }

  // 5. Work Experience (One-to-Many)
  async updateWorkExperience(leadId: string, dto: UpdateWorkExperienceDto) {
    const app = await this.getOrCreateApplication(leadId);
    for (const record of dto.records) {
      if (record.id) {
        await this.prisma.application_work_experience.update({
          where: { id: record.id },
          data: { ...record, id: undefined },
        });
      } else {
        await this.prisma.application_work_experience.create({
          data: { ...record, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId);
  }

  // 6. Visa / Passport Details
  async updateVisaDetails(leadId: string, dto: UpdateVisaDetailsDto) {
    const app = await this.getOrCreateApplication(leadId);
    const existing = await this.prisma.application_visa_details.findFirst({ where: { application_id: app.id } });

    if (existing) {
      await this.prisma.application_visa_details.update({ where: { id: existing.id }, data: dto });
    } else {
      await this.prisma.application_visa_details.create({ data: { application_id: app.id, ...dto } });
    }
    return this.getFullApplication(leadId);
  }

  // 7. Documents
  async updateDocuments(leadId: string, dto: UpdateDocumentsDto) {
    const app = await this.getOrCreateApplication(leadId);
    const existing = await this.prisma.application_documents.findFirst({ where: { application_id: app.id } });

    if (existing) {
      await this.prisma.application_documents.update({ where: { id: existing.id }, data: dto });
    } else {
      await this.prisma.application_documents.create({ data: { application_id: app.id, ...dto } });
    }
    return this.getFullApplication(leadId);
  }

  async getFullApplication(leadId: string) {
    return this.prisma.applications.findFirst({
      where: { lead_id: leadId },
      include: {
        family_details: true,
        education: true,
        preferences: true,
        tests: true,
        work_experience: true,
        visa_details: true,
        documents: true,
      },
    });
  }
}