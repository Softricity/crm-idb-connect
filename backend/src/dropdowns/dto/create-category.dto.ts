import { IsNotEmpty, IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateCategoryDto {
  @IsNotEmpty()
  @IsString()
  name: string; // Internal key, e.g. "visa_reject_reasons"

  @IsOptional()
  @IsString()
  label?: string; // Display name, e.g. "Visa Rejection Reasons"
}