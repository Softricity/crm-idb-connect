import { IsString, IsOptional, IsNumber, IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class CreateCourseDto {
  // Basic Course Fields
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  duration?: number;

  @IsOptional()
  @IsString()
  fee_type?: string;
  
  // Fee fields with currencies
  @IsOptional()
  @IsNumber()
  original_fee?: number;

  @IsOptional()
  @IsString()
  fee_currency?: string;

  @IsOptional()
  @IsNumber()
  fee?: number;

  @IsOptional()
  @IsString()
  course_currency?: string;

  @IsOptional()
  @IsNumber()
  application_fee?: number;

  @IsOptional()
  @IsString()
  application_currency?: string;
  
  // Intake and commission
  @IsOptional()
  @IsString()
  intake_month?: string;

  @IsOptional()
  @IsString()
  commission_type?: string;

  @IsOptional()
  @IsNumber()
  commission_value?: number;
  
  // Course details (array of points)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  details?: string[];

  // Relations
  @IsNotEmpty()
  @IsUUID()
  university_id: string;
}