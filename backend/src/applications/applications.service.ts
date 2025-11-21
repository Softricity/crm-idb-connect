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
import { SupabaseService } from '../storage/supabase.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService, private supabaseService: SupabaseService) {}
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
  async updateDocuments(
    leadId: string,
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
    const app = await this.getOrCreateApplication(leadId);
    
    // Fetch existing docs to append to arrays if needed
    const existingDocs = await this.prisma.application_documents.findFirst({
      where: { application_id: app.id },
    });

    // Object to hold the new URLs to update in DB
    const updateData: any = {};

    // Helper to process single file upload
    const processSingleFile = async (fileArray: Express.Multer.File[] | undefined, fieldName: string) => {
    if (fileArray && fileArray.length > 0) {
      // ⚡ HERE: We explicitly pass 'documents'
      const url = await this.supabaseService.uploadFile(
        fileArray[0], 
        'documents', // <--- Bucket Name
        `applications/${leadId}`
      );
      updateData[`${fieldName}_url`] = url;
    }
  };

  // Helper to process array file uploads
  const processArrayFiles = async (
      fileArray: Express.Multer.File[] | undefined, 
      fieldName: string, 
      existingUrls: string[] = []
  ) => {
    if (fileArray && fileArray.length > 0) {
      const newUrls = await Promise.all(
        fileArray.map((file) => 
          // ⚡ HERE: We explicitly pass 'documents'
          this.supabaseService.uploadFile(
            file, 
            'idb-student-documents', // <--- Bucket Name
            `applications/${leadId}`
          )
        )
      );
      updateData[`${fieldName}_url`] = [...existingUrls, ...newUrls];
    }
  };

    // Process Single Files
    await processSingleFile(files.profile_photo, 'profile_photo');
    await processSingleFile(files.passport_copy, 'passport_copy');
    await processSingleFile(files.english_test_cert, 'english_test_cert');
    await processSingleFile(files.sop, 'sop');
    await processSingleFile(files.cv_resume, 'cv_resume');
    await processSingleFile(files.financial_documents, 'financial_documents');
    await processSingleFile(files.other_documents, 'other_documents');

    // Process Arrays (Academic Docs & Recommendation Letters)
    await processArrayFiles(
        files.academic_documents, 
        'academic_documents', 
        existingDocs?.academic_documents_urls || [] // Append to existing
    );

    await processArrayFiles(
        files.recommendation_letters, 
        'recommendation_letters', 
        existingDocs?.recommendation_letters_url || [] // Append to existing
    );

    // Database Upsert
    if (existingDocs) {
      await this.prisma.application_documents.update({
        where: { id: existingDocs.id },
        data: updateData,
      });
    } else {
      await this.prisma.application_documents.create({
        data: { application_id: app.id, ...updateData },
      });
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