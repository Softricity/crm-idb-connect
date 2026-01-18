import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';

export class AddCommentDto {
  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsArray()
  attachment_urls?: string[];
}