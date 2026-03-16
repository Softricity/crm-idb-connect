import { IsString, IsNotEmpty, IsUUID } from 'class-validator';

// src/notes/dto/create-note.dto.ts
export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsNotEmpty()
  @IsUUID()
  lead_id: string;
}