import { IsString, IsOptional, IsUUID, IsEnum, IsNumber } from 'class-validator';
import { CommissionType } from '@prisma/client';

export class CreateUniversityDto {
  @IsString()
  name: string;

  @IsUUID()
  countryId: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  logo?: string;

  @IsOptional()
  @IsEnum(CommissionType)
  commission_type?: CommissionType;

  @IsOptional()
  @IsNumber()
  commission_value?: number;

  @IsOptional()
  @IsString()
  currency?: string;
}
