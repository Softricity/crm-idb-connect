import { IsString, IsNotEmpty } from 'class-validator';

// src/followups/dto/create-comment.dto.ts
export class CreateFollowupCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}