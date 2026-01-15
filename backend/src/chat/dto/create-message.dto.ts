import { IsNotEmpty, IsString, IsUUID, IsOptional } from 'class-validator';

export class CreateMessageDto {
  @IsNotEmpty()
  @IsUUID()
  lead_id: string; // The ID of the student (Room)

  @IsNotEmpty()
  @IsString()
  message: string;
}