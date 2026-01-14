// src/leads/dto/create-lead.dto.ts
  
   

import { IsEmail, IsNotEmpty, IsOptional, IsString, IsBoolean, IsUUID } from 'class-validator';

export class CreateLeadDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsOptional()
  @IsString()
  type?: string;           // Defaults to 'lead'

  @IsOptional()
  @IsString()
  status?: string;         // Defaults to 'new'

  @IsOptional()
  @IsString()
  utm_source?: string;

  @IsOptional()
  @IsString()
  utm_medium?: string;

  @IsOptional()
  @IsString()
  utm_campaign?: string;

  @IsOptional()
  @IsString()
  branch_id?: string; 

  @IsOptional()
  @IsString()
  preferred_country?: string;

  @IsOptional()
  @IsString()
  preferred_course?: string;

  @IsOptional()
  @IsUUID() // 👈 ADD THIS
  created_by?: string; 

  @IsOptional()
  @IsUUID()
  assigned_to?: string;
}