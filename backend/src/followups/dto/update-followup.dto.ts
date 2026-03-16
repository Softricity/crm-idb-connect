// src/followups/dto/update-followup.dto.ts
import { IsString, IsOptional, IsDateString, IsBoolean } from 'class-validator';

export class UpdateFollowupDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsDateString()
  due_date?: Date;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}