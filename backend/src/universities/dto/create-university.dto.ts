import { IsString, IsOptional, IsUUID, IsEnum, IsNumber, IsArray } from 'class-validator';
import { Transform } from 'class-transformer';
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
  @Transform(({ value }) => value ? Number(value) : value)
  commission_value?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch (e) {
        return [value];
      }
    }
    return value;
  })
  @IsArray()
  @IsString({ each: true })
  allowed_countries?: string[];
}
