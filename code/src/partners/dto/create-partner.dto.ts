// src/partners/dto/create-partner.dto.ts
import { Prisma } from '@prisma/client';

export class CreatePartnerDto {
  role: 'agent' | 'counsellor' | 'admin';
  name: string;
  email: string;
  mobile: string;
  password: string;
  address: string;
  city: string;
  state: string;
  area: string;
  zone: string;
  remarks?: string;
  agency_name?: string;
}