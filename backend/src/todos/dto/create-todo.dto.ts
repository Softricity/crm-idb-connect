import { IsString, IsNotEmpty, IsOptional, IsDateString } from 'class-validator';

export class CreateTodoDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
