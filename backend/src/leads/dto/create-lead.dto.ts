export class CreateLeadDto {
  name: string;
  mobile: string;
  email: string;
  type: 'lead' | 'application'; // Enforced by Prisma Enum in real app
  city: string;
  purpose: string;
  status: string;
  created_by?: string; // Optional, usually comes from Auth token
  
  // Optional fields
  alternate_mobile?: string;
  preferred_country?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  assigned_to?: string;
  reason?: string;
}