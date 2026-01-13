import { IsNotEmpty, IsNumber, IsOptional, IsString, IsEnum, IsUUID } from 'class-validator';

export enum CommissionStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  PAID = 'PAID',
  REJECTED = 'REJECTED'
}

export class CreateCommissionDto {
  @IsOptional()
  @IsUUID()
  lead_id?: string;

  @IsOptional()
  @IsUUID()
  application_id?: string;

  @IsNotEmpty()
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsEnum(CommissionStatus)
  status?: CommissionStatus;

  @IsOptional()
  @IsString()
  remarks?: string;
}