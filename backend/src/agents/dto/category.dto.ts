import { IsString, IsOptional, IsBoolean, IsNumber, IsUUID, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class CategoryUniversityAccessDto {
  @IsString()
  university_id: string;

  @IsNumber()
  commission_percent: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}

export class SetCategoryAccessDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryUniversityAccessDto)
  access: CategoryUniversityAccessDto[];
}

export class AssignAgentCategoryDto {
  @IsUUID()
  category_id: string;
}
