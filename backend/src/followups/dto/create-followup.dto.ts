// src/followups/dto/create-followup.dto.ts
export class CreateFollowupDto {
  title: string;
  lead_id: string;
  due_date?: Date;
}