import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateTemplateDto {
  @IsUUID()
  agent_id: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
