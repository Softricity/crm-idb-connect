// src/leads/dto/bulk-update.dto.ts

import { IsString, IsOptional, IsArray, IsUUID, IsNotEmpty } from 'class-validator';

export class BulkAssignDto {
  @IsArray()
  @IsUUID('4', { each: true })
  leadIds: string[];

  @IsOptional()
  @IsUUID()
  counsellorId: string | null; // null for un-assigning
}

export class BulkStatusDto {
  @IsArray()
  @IsUUID('4', { each: true })
  leadIds: string[];

  @IsString()
  @IsNotEmpty()
  status: string;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class BulkMessageDto {
  @IsArray()
  @IsUUID('4', { each: true })
  leadIds: string[];

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class BulkDeleteDto {
  @IsArray()
  @IsUUID('4', { each: true })
  leadIds: string[];
}