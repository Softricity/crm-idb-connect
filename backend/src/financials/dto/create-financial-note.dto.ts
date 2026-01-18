import { IsNotEmpty, IsString, IsEnum, IsUUID } from 'class-validator';
import { FinancialStatus } from '@prisma/client';

export class CreateFinancialNoteDto {
  @IsNotEmpty()
  @IsEnum(FinancialStatus)
  stage: FinancialStatus; // The stage section where the user clicked "Add Note"

  @IsNotEmpty()
  @IsString()
  content: string;
}