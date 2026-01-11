import { IsString, IsBoolean, IsOptional, IsArray, IsEnum } from 'class-validator';

enum TargetAudience {
  USER = 'user',
  BRANCH = 'branch',
  BRANCH_SPECIFIC = 'branch-specific',
  ROLE_BASED = 'role-based',
}

export class CreateAnnouncementDto {
  @IsString()
  title: string;

  @IsString()
  content: string;

  @IsEnum(TargetAudience)
  target_audience: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  users?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  branches?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];

  @IsOptional()
  @IsString()
  branch_id?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
