// src/leads/dto/bulk-update.dto.ts

export class BulkAssignDto {
  leadIds: string[];
  counsellorId: string | null; // null for un-assigning
}

export class BulkStatusDto {
  leadIds: string[];
  status: string;
  reason?: string;
}

export class BulkMessageDto {
  leadIds: string[];
  message: string;
}

export class BulkDeleteDto {
  leadIds: string[];
}