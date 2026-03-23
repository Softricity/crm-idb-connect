// src/partners/dto/create-partner.dto.ts
import { IsArray, IsEmail, IsOptional, IsString, IsUUID } from 'class-validator'; // Assuming you use class-validator

export class CreatePartnerDto {
  @IsUUID()
  role_id: string;

  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  mobile: string;

  @IsString()
  password: string;

  @IsString()
  address: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  area: string;

  @IsString()
  zone: string;

  @IsOptional()
  @IsString()
  remarks?: string;

  @IsOptional()
  @IsString()
  agency_name?: string;

  @IsUUID()
  @IsOptional()
  branch_id?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  department_ids?: string[];

  @IsOptional()
  @IsUUID()
  primary_department_id?: string;
}