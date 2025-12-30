// src/leads/dto/create-lead.dto.ts

// This DTO is now based on the 5 fields + required internal fields
export class CreateLeadDto {
  // Required Initial Inquiry Fields
  name: string;
  mobile: string;
  email: string;
  preferred_course: string; // NEW field (replaces 'purpose')
  preferred_country: string;
  
  type?: string;           // Defaults to 'lead'
  status?: string;         // Defaults to 'new'
  created_by?: string;
  assigned_to?: string;

  // Tracking Fields (if provided)
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;

  // Optional Branch Override
  branch_id?: string;  
}