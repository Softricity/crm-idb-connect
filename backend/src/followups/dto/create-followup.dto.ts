import { IsString, IsNotEmpty, IsOptional, IsDateString, IsUUID } from 'class-validator';

// src/followups/dto/create-followup.dto.ts
export class CreateFollowupDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsNotEmpty()
  @IsUUID()
  lead_id: string;

  @IsOptional()
  @IsDateString()
  due_date?: Date;
}