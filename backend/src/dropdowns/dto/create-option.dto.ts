import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateOptionDto {
  @IsNotEmpty()
  @IsUUID()
  category_id: string; // Now we link by ID, not string name

  @IsNotEmpty()
  @IsString()
  label: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}