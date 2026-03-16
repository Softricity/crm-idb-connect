import { IsIn, IsOptional, IsString, Max, Min, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export const REPORT_TYPES = [
  'study-lead',
  'counselling',
  'admission',
  'application',
  'visa',
  'payment',
  'follow-up',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export class ReportQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize?: number = 25;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  branch_id?: string;

  @IsOptional()
  @IsString()
  columns?: string;

  @IsOptional()
  @IsString()
  search?: string;
}
