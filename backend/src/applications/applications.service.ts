import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdatePersonalDetailsDto, UpdateEducationDto, UpdatePreferencesDto,
  UpdateTestsDto, UpdateWorkExperienceDto, UpdateVisaDetailsDto,
} from './dto/update-sections.dto';
import { SupabaseService } from '../storage/supabase.service';
import { getScope } from '../common/utils/scope.util';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    private prisma: PrismaService, 
    private supabaseService: SupabaseService,
    private mailService: MailService
  ) {}

  // --- Password Helpers ---
  private generateRandomPassword(length = 8): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  // 🔒 SECURITY HELPER
  private async validateLeadAccess(leadId: string, user: any) {
    // If user is null (public access), only verify lead exists
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

  // Helper: Find or Create Application & Handle Conversion Logic
  private async getOrCreateApplication(leadId: string, user?: any) {
    let app = await this.prisma.applications.findFirst({ where: { lead_id: leadId } });
    
    if (!app) {
      // 1. Create Application Record
      const studentId = `STU-${Date.now().toString().slice(-6)}`;
      app = await this.prisma.applications.create({
        data: { lead_id: leadId, student_id: studentId },
      });

      // 2. Fetch Lead to check type and email
      const lead = await this.prisma.leads.findUnique({ where: { id: leadId } });
      if (lead) {
        // 3. Update Lead Type to 'application'
        await this.prisma.leads.update({
          where: { id: leadId },
          data: { type: 'application' }
        });

        // 4. Handle "Lead to Application" Email Notification
        // Only send if the trigger is NOT the student themselves (i.e., triggered by Partner/Admin)
        // If user is null, it might be public access (student), so we skip email.
        // If user is set and NOT the student (has a role), we send email.
        const isStaffUser = user && user.role && (user.role.name === 'admin' || user.role.name === 'counsellor' || user.role.name === 'agent');
        
        if (isStaffUser) {
          const newPassword = this.generateRandomPassword();
          const hashedPassword = await this.hashPassword(newPassword);

          // Update password in DB
          await this.prisma.leads.update({
            where: { id: leadId },
            data: { password: hashedPassword }
          });

          // Resend Credentials
          await this.mailService.sendWelcomeEmail(lead.email, newPassword);
          this.logger.log(`Converted lead ${leadId} to application. Credentials sent to ${lead.email}`);
        }
      }
    }
    return app;
  }

  // --- Explicit Conversion (Manual Trigger) ---
  async convertLeadToApplication(leadId: string, user: any) {
    await this.validateLeadAccess(leadId, user);
    // getOrCreateApplication handles the logic of creation + email sending
    return this.getOrCreateApplication(leadId, user);
  }

  // --- Update Methods ---

  // 1. Personal Details
  async updatePersonalDetails(leadId: string, dto: UpdatePersonalDetailsDto, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId, user);

    const { 
      father_name, mother_name, emergency_contact_name, emergency_contact_number, 
      ...appData 
    } = dto;

    const normalized: any = { ...appData };
    if (typeof normalized.dob === 'string') {
      const trimmed = normalized.dob.trim();
      normalized.dob = trimmed ? new Date(trimmed) : null;
    }
    Object.keys(normalized).forEach((key) => {
      if (typeof normalized[key] === 'string' && normalized[key].trim() === '') {
        normalized[key] = null;
      }
    });

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

  // Family-only update
  async updateFamilyDetails(leadId: string, body: any, user: any) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId, user);
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
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId, user);
    
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
    const app = await this.getOrCreateApplication(leadId, user);
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
    const app = await this.getOrCreateApplication(leadId, user);
    for (const record of dto.records) {
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
    const app = await this.getOrCreateApplication(leadId, user);
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
    const app = await this.getOrCreateApplication(leadId, user);
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
    user: any
  ) {
    await this.validateLeadAccess(leadId, user);
    const app = await this.getOrCreateApplication(leadId, user);
    
    try {
      const summary: Record<string, any> = {};
      Object.keys(files || {}).forEach((k) => {
        const arr = files[k];
        summary[k] = Array.isArray(arr) ? arr.map((f: any) => f.originalname) : arr?.originalname;
      });
      this.logger.log(`[updateDocuments] leadId ${leadId} fields ${JSON.stringify(summary)}`);
    } catch (logErr) {
      this.logger.warn('[updateDocuments] logging error', logErr);
    }

    const existingDocs = await this.prisma.application_documents.findFirst({
      where: { application_id: app.id },
    });

    const updateData: any = {};

    const processSingleFile = async (fileArray: Express.Multer.File[] | undefined, fieldName: string) => {
      if (fileArray && fileArray.length > 0) {
        const url = await this.supabaseService.uploadFile(fileArray[0], `applications/${leadId}`, 'idb-student-documents');
        updateData[`${fieldName}_url`] = url;
      }
    };

    const processArrayFiles = async (fileArray: Express.Multer.File[] | undefined, fieldName: string, existingUrls: string[] = []) => {
      if (fileArray && fileArray.length > 0) {
        const newUrls = await Promise.all(
          fileArray.map((file) => this.supabaseService.uploadFile(file, `applications/${leadId}`, 'idb-student-documents'))
        );
        const targetKey = fieldName === 'academic_documents' ? 'academic_documents_urls' : `${fieldName}_url`;
        updateData[targetKey] = [...existingUrls, ...newUrls];
      }
    };

    await processSingleFile(files.profile_photo, 'profile_photo');
    await processSingleFile(files.passport_copy, 'passport_copy');
    await processSingleFile(files.english_test_cert, 'english_test_cert');
    await processSingleFile(files.sop, 'sop');
    await processSingleFile(files.cv_resume, 'cv_resume');
    await processSingleFile(files.financial_documents, 'financial_documents');
    await processSingleFile(files.other_documents, 'other_documents');

    await processArrayFiles(files.academic_documents, 'academic_documents', existingDocs?.academic_documents_urls || []);
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