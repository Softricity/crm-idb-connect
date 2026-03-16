import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}