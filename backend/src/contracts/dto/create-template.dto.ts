import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateTemplateDto {
  @IsOptional()
  @IsUUID()
  agent_id?: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
