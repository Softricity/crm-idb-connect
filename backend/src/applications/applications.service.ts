// src/applications/applications.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdatePersonalDetailsDto, UpdateEducationDto, UpdatePreferencesDto,
  UpdateTestsDto, UpdateWorkExperienceDto, UpdateVisaDetailsDto,
} from './dto/update-sections.dto';
import { SupabaseService } from '../storage/supabase.service';
import { getScope } from '../common/utils/scope.util'; // <--- IMPORT SCOPE

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService, private supabaseService: SupabaseService) {}

  // 🔒 SECURITY HELPER
  private async validateLeadAccess(leadId: string, user: any) {
    // If user is null (public access), only verify lead exists (no branch scope restriction)
    if (!user) {
      const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
      if (!lead) throw new ForbiddenException('Lead not found or inaccessible.');
      return;
    }
    const scope = getScope(user);
    const lead = await this.prisma.leads.findFirst({
      where: {
        id: leadId,
        ...scope
      }
    });
    if (!lead) throw new ForbiddenException('You do not have access to this Lead.');
  }

  // Helper: Find or Create Application
  private async getOrCreateApplication(leadId: string) {
    let app = await this.prisma.applications.findFirst({ where: { lead_id: leadId } });
    if (!app) {
      const studentId = `STU-${Date.now().toString().slice(-6)}`;
      app = await this.prisma.applications.create({
        data: { lead_id: leadId, student_id: studentId },
      });
    }
    return app;
  }

  // 1. Personal Details (Updated to accept User)
  async updatePersonalDetails(leadId: string, dto: UpdatePersonalDetailsDto, user: any) {
    await this.validateLeadAccess(leadId, user); // <--- CHECK PERMISSION

    const app = await this.getOrCreateApplication(leadId);

    const { 
      father_name, mother_name, emergency_contact_name, emergency_contact_number, 
      ...appData 
    } = dto;

    // Normalize date and empty string values
    const normalized: any = { ...appData };
    // Handle dob (Date only string -> Date object)
    if (typeof normalized.dob === 'string') {
      const trimmed = normalized.dob.trim();
      normalized.dob = trimmed ? new Date(trimmed) : null;
    }
    // Convert empty strings to null for scalar optional fields
    Object.keys(normalized).forEach((key) => {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = null;
      }
    });

    // Whitelist only scalar columns belonging to applications table to prevent Prisma relation validation error
    const allowedFields = [
      'given_name','surname','dob','gender','marital_status','email','phone','alternate_phone','address','city','state','country','citizenship','national_id','current_status','gap_years','referral_source','application_stage','system_remarks'
    ];
    const updateData: Record<string, any> = {};
    for (const key of allowedFields) {
      if (key in normalized) updateData[key] = normalized[key];
    }

    await this.prisma.applications.update({
      where: { id: app.id },
      data: updateData,
    });

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

    return this.getFullApplication(leadId, user);
  }

  // Family-only update (used by public /family route)
  async updateFamilyDetails(leadId: string, body: any, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    // Support both flat body fields and nested body.family_details[0]
    const source = body?.family_details?.[0] ? body.family_details[0] : body;
    const { father_name, mother_name, emergency_contact_name, emergency_contact_number } = source;
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
    return this.getFullApplication(leadId, user);
  }

  // 2. Education
  async updateEducation(leadId: string, dto: UpdateEducationDto, user: any) {
    await this.validateLeadAccess(leadId, user); // <--- CHECK PERMISSION
    const app = await this.getOrCreateApplication(leadId);
    
    for (const record of dto.records) {
      if (record.id) {
        await this.prisma.application_education.update({
          where: { id: record.id },
          data: { ...record, id: undefined }, 
        });
      } else {
        await this.prisma.application_education.create({
          data: { ...record, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId, user);
  }

  // 3. Preferences
  async updatePreferences(leadId: string, dto: UpdatePreferencesDto, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    const existing = await this.prisma.application_preferences.findFirst({ where: { application_id: app.id } });

    if (existing) {
      await this.prisma.application_preferences.update({ where: { id: existing.id }, data: dto });
    } else {
      await this.prisma.application_preferences.create({ data: { application_id: app.id, ...dto } });
    }
    return this.getFullApplication(leadId, user);
  }

  // 4. Tests
  async updateTests(leadId: string, dto: UpdateTestsDto, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    for (const record of dto.records) {
      // Normalize date string for test_date
      const payload: any = { ...record };
      if (typeof payload.test_date === 'string') {
        const trimmed = payload.test_date.trim();
        payload.test_date = trimmed ? new Date(trimmed) : null;
      }
      if (record.id) {
        await this.prisma.application_tests.update({
          where: { id: record.id },
          data: { ...payload, id: undefined },
        });
      } else {
        await this.prisma.application_tests.create({
          data: { ...payload, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId, user);
  }

  // 5. Work Experience
  async updateWorkExperience(leadId: string, dto: UpdateWorkExperienceDto, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    for (const record of dto.records) {
      const payload: any = { ...record };
      ['start_date','end_date'].forEach((field) => {
        if (typeof payload[field] === 'string') {
          const trimmed = payload[field].trim();
          payload[field] = trimmed ? new Date(trimmed) : null;
        }
      });
      if (record.id) {
        await this.prisma.application_work_experience.update({
          where: { id: record.id },
          data: { ...payload, id: undefined },
        });
      } else {
        await this.prisma.application_work_experience.create({
          data: { ...payload, application_id: app.id },
        });
      }
    }
    return this.getFullApplication(leadId, user);
  }

  // 6. Visa Details
  async updateVisaDetails(leadId: string, dto: UpdateVisaDetailsDto, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    const existing = await this.prisma.application_visa_details.findFirst({ where: { application_id: app.id } });

    const payload: any = { ...dto };
    ['passport_issue_date','passport_expiry_date'].forEach((field) => {
      if (typeof payload[field] === 'string') {
        const trimmed = payload[field].trim();
        payload[field] = trimmed ? new Date(trimmed) : null;
      }
    });

    if (existing) {
      await this.prisma.application_visa_details.update({ where: { id: existing.id }, data: payload });
    } else {
      await this.prisma.application_visa_details.create({ data: { application_id: app.id, ...payload } });
    }
    return this.getFullApplication(leadId, user);
  }

  // 7. Documents
  async updateDocuments(
    leadId: string,
    files: any,
    user: any // <--- Accept User
  ) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId);
    // Debug logging (can be switched to proper logger later)
    try {
      // Avoid logging full file buffers, just names & field keys
      const summary: Record<string, any> = {};
      Object.keys(files || {}).forEach((k) => {
        const arr = files[k];
        summary[k] = Array.isArray(arr) ? arr.map((f: any) => f.originalname) : arr?.originalname;
      });
      // eslint-disable-next-line no-console
      console.log('[updateDocuments] leadId', leadId, 'fields', summary);
    } catch (logErr) {
      // eslint-disable-next-line no-console
      console.warn('[updateDocuments] logging error', logErr);
    }

    const existingDocs = await this.prisma.application_documents.findFirst({
      where: { application_id: app.id },
    });

    const updateData: any = {};

    const processSingleFile = async (
      fileArray: Express.Multer.File[] | undefined,
      fieldName: string,
    ) => {
      if (fileArray && fileArray.length > 0) {
        try {
          const url = await this.supabaseService.uploadFile(
            fileArray[0],
            `applications/${leadId}`,
            'idb-student-documents',
          );
          updateData[`${fieldName}_url`] = url;
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[updateDocuments] single upload failed', fieldName, err);
          throw err; // propagate to return 500
        }
      }
    };

    const processArrayFiles = async (
      fileArray: Express.Multer.File[] | undefined,
      fieldName: string,
      existingUrls: string[] = [],
    ) => {
      if (fileArray && fileArray.length > 0) {
        try {
          const newUrls = await Promise.all(
            fileArray.map((file) =>
              this.supabaseService.uploadFile(
                file,
                `applications/${leadId}`,
                'idb-student-documents',
              ),
            ),
          );
          const targetKey =
            fieldName === 'academic_documents'
              ? 'academic_documents_urls'
              : `${fieldName}_url`;
          updateData[targetKey] = [...existingUrls, ...newUrls];
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('[updateDocuments] multi upload failed', fieldName, err);
          throw err;
        }
      }
    };

    await processSingleFile(files.profile_photo, 'profile_photo');
    await processSingleFile(files.passport_copy, 'passport_copy');
    await processSingleFile(files.english_test_cert, 'english_test_cert');
    await processSingleFile(files.sop, 'sop');
    await processSingleFile(files.cv_resume, 'cv_resume');
    await processSingleFile(files.financial_documents, 'financial_documents');
    await processSingleFile(files.other_documents, 'other_documents');

    await processArrayFiles(
      files.academic_documents,
      'academic_documents',
      existingDocs?.academic_documents_urls || [],
    );
    await processArrayFiles(files.recommendation_letters, 'recommendation_letters', existingDocs?.recommendation_letters_url || []);

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

    // eslint-disable-next-line no-console
    console.log('[updateDocuments] updateData applied keys:', Object.keys(updateData));

    return this.getFullApplication(leadId, user);
  }

  async getFullApplication(leadId: string, user: any) {
    await this.validateLeadAccess(leadId, user);

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