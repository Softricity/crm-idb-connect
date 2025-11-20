// src/applications/dto/update-sections.dto.ts
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, ValidateNested, IsArray, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';

// --- 1. Personal Details DTO ---
export class UpdatePersonalDetailsDto {
  @IsOptional() @IsString() given_name?: string;
  @IsOptional() @IsString() surname?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsDateString() dob?: string;
  @IsOptional() @IsString() marital_status?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() alternate_phone?: string;
  @IsOptional() @IsString() email?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() citizenship?: string;
  @IsOptional() @IsString() national_id?: string;
  @IsOptional() @IsString() father_name?: string;
  @IsOptional() @IsString() mother_name?: string;
  @IsOptional() @IsString() emergency_contact_name?: string;
  @IsOptional() @IsString() emergency_contact_number?: string;
  @IsOptional() @IsString() current_status?: string;
  @IsOptional() @IsNumber() gap_years?: number;
  @IsOptional() @IsString() referral_source?: string;
}

// --- 2. Education Details DTO (Array) ---
export class EducationRecordDto {
  @IsOptional() @IsString() id?: string; // If ID exists, update; else create
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() institution_name?: string;
  @IsOptional() @IsString() board_university?: string;
  @IsOptional() @IsString() country_of_study?: string;
  @IsOptional() @IsString() major_stream?: string;
  @IsOptional() @IsString() percentage_gpa?: string;
  @IsOptional() @IsString() year_of_passing?: string;
  @IsOptional() @IsString() medium_of_instruction?: string;
  @IsOptional() @IsNumber() backlogs?: number;
  @IsOptional() @IsString() certificate_url?: string;
}

export class UpdateEducationDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EducationRecordDto)
  records: EducationRecordDto[];
}

// --- 3. Preference Details DTO ---
export class UpdatePreferencesDto {
  @IsOptional() @IsString() preferred_country?: string;
  @IsOptional() @IsString() preferred_course_type?: string;
  @IsOptional() @IsString() preferred_course_name?: string;
  @IsOptional() @IsString() preferred_intake?: string;
  @IsOptional() @IsString() preferred_university?: string;
  @IsOptional() @IsString() backup_country?: string;
  @IsOptional() @IsString() study_mode?: string;
  @IsOptional() @IsString() budget_range?: string;
  @IsOptional() @IsBoolean() scholarship_interest?: boolean;
  @IsOptional() @IsString() travel_history?: string;
}

// --- 4. Language / Aptitude Tests DTO (Array) ---
export class TestRecordDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() test_type?: string;
  @IsOptional() @IsDateString() test_date?: string;
  @IsOptional() @IsNumber() overall_score?: number;
  @IsOptional() @IsNumber() listening?: number;
  @IsOptional() @IsNumber() reading?: number;
  @IsOptional() @IsNumber() writing?: number;
  @IsOptional() @IsNumber() speaking?: number;
  @IsOptional() @IsString() trf_number?: string;
}

export class UpdateTestsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TestRecordDto)
  records: TestRecordDto[];
}

// --- 5. Work Experience DTO (Array) ---
export class WorkExperienceRecordDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() company_name?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsDateString() start_date?: string;
  @IsOptional() @IsDateString() end_date?: string;
  @IsOptional() @IsString() job_duties?: string;
  @IsOptional() @IsString() certificate_url?: string;
}

export class UpdateWorkExperienceDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkExperienceRecordDto)
  records: WorkExperienceRecordDto[];
}

// --- 6. Visa / Passport Details DTO ---
export class UpdateVisaDetailsDto {
  @IsOptional() @IsString() passport_number?: string;
  @IsOptional() @IsDateString() passport_issue_date?: string;
  @IsOptional() @IsDateString() passport_expiry_date?: string;
  @IsOptional() @IsString() passport_place_of_issue?: string;
  @IsOptional() @IsString() passport_nationality?: string;
  @IsOptional() @IsString() country_applied_for?: string;
  @IsOptional() @IsString() previous_visa_type?: string;
  @IsOptional() @IsString() visa_status?: string;
  @IsOptional() @IsString() visa_refusal_reason?: string;
  @IsOptional() @IsString() travelled_countries?: string;
  @IsOptional() @IsBoolean() is_visa_rejected_past?: boolean;
}

// --- 7. Documents DTO ---
export class UpdateDocumentsDto {
  @IsOptional() @IsString() profile_photo_url?: string;
  @IsOptional() @IsString() passport_copy_url?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) academic_documents_urls?: string[];
  @IsOptional() @IsString() english_test_cert_url?: string;
  @IsOptional() @IsString() sop_url?: string;
  @IsOptional() @IsString() cv_resume_url?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) recommendation_letters_url?: string[];
  @IsOptional() @IsString() financial_documents_url?: string;
  @IsOptional() @IsString() other_documents_url?: string;
}