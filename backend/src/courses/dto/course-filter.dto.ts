import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CourseFilterDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  country?: string[];    // Array of country names

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  level?: string[];      // Array of levels (Masters, Bachelors)

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  university?: string[]; // Array of university names

  @IsOptional()
  @IsUUID()
  universityId?: string; // Filter by specific university ID

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  intake?: string[];     // Array of months
}