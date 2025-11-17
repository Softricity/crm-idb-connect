// src/applications/dto/update-sections.dto.ts
import { IsString, IsBoolean, IsOptional, IsDateString, IsEmail } from 'class-validator';

export class UpdatePersonalDto {
  @IsOptional() @IsString() program_discipline?: string;
  @IsOptional() @IsString() program_course?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsDateString() dob?: string; // ISO Date
  @IsOptional() @IsString() gender?: string; // Matches gender_enum
  @IsOptional() @IsString() marital_status?: string; // Matches marital_status_enum
  @IsOptional() @IsString() category?: string; // Matches category_enum
  @IsOptional() @IsString() religion?: string;
  @IsOptional() @IsString() nationality?: string;
  @IsOptional() @IsString() blood_group?: string;
}

export class UpdateIdentificationsDto {
  @IsOptional() @IsString() aadhaar_number?: string;
  @IsOptional() @IsString() pan_card_number?: string;
  @IsOptional() @IsString() passport_number?: string;
  @IsOptional() @IsString() passport_issuing_country?: string;
  @IsOptional() @IsDateString() passport_valid_upto?: string;
}

export class UpdatePreferencesDto {
  @IsOptional() @IsBoolean() hostel_facility_required?: boolean;
  @IsOptional() @IsString() hostel_type?: string;
  @IsOptional() @IsBoolean() travel_accommodation_required?: boolean;
  @IsOptional() @IsBoolean() has_given_exam?: boolean;
  @IsOptional() @IsBoolean() has_work_experience?: boolean;
}

export class UpdateFamilyDto {
  @IsOptional() @IsString() father_title?: string;
  @IsOptional() @IsString() father_name?: string;
  @IsOptional() @IsEmail()  father_email?: string;
  @IsOptional() @IsString() father_mobile?: string;
  @IsOptional() @IsString() father_occupation?: string;
  
  @IsOptional() @IsString() mother_title?: string;
  @IsOptional() @IsString() mother_name?: string;
  @IsOptional() @IsEmail()  mother_email?: string;
  @IsOptional() @IsString() mother_mobile?: string;
  @IsOptional() @IsString() mother_occupation?: string;

  @IsOptional() @IsString() guardian_title?: string;
  @IsOptional() @IsString() guardian_name?: string;
  @IsOptional() @IsEmail()  guardian_email?: string;
  @IsOptional() @IsString() guardian_mobile?: string;
  @IsOptional() @IsString() guardian_occupation?: string;
  @IsOptional() @IsString() guardian_relationship?: string;
  @IsOptional() @IsString() family_annual_income?: string;
}

export class UpdateAddressDto {
  @IsOptional() @IsBoolean() is_permanent_same_as_correspondence?: boolean;
  
  // Correspondence
  @IsOptional() @IsString() correspondence_address_line_1?: string;
  @IsOptional() @IsString() correspondence_address_line_2?: string;
  @IsOptional() @IsString() correspondence_city?: string;
  @IsOptional() @IsString() correspondence_district?: string;
  @IsOptional() @IsString() correspondence_state?: string;
  @IsOptional() @IsString() correspondence_country?: string;
  @IsOptional() @IsString() correspondence_pincode?: string;

  // Permanent
  @IsOptional() @IsString() permanent_address_line_1?: string;
  @IsOptional() @IsString() permanent_address_line_2?: string;
  @IsOptional() @IsString() permanent_city?: string;
  @IsOptional() @IsString() permanent_district?: string;
  @IsOptional() @IsString() permanent_state?: string;
  @IsOptional() @IsString() permanent_country?: string;
  @IsOptional() @IsString() permanent_pincode?: string;
}

export class UpdateDocumentsDto {
  // For now, we accept URLs. File upload logic can be added separately if needed.
  @IsOptional() @IsString() passport_photo_url?: string;
  @IsOptional() @IsString() class_x_marksheet_url?: string;
  @IsOptional() @IsString() class_xii_marksheet_url?: string;
  @IsOptional() @IsString() graduation_marksheet_url?: string;
  @IsOptional() @IsString() aadhaar_card_url?: string;
  @IsOptional() @IsString() entrance_exam_scorecard_url?: string;
  @IsOptional() @IsString() work_experience_certificates_url?: string;
  @IsOptional() @IsString() passport_url?: string;
}

export class UpdateDeclarationsDto {
  @IsOptional() @IsBoolean() declaration_agreed?: boolean;
  @IsOptional() @IsString() declaration_applicant_name?: string;
  @IsOptional() @IsString() declaration_parent_name?: string;
  @IsOptional() @IsDateString() declaration_date?: string;
  @IsOptional() @IsString() declaration_place?: string;
}