// src/partners/dto/bulk-delete.dto.ts
import { IsArray, IsUUID } from 'class-validator';

export class BulkDeletePartnerDto {
  @IsArray()
  @IsUUID('4', { each: true })
  partnerIds: string[];
}