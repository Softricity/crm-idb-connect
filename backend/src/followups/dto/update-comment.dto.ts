import { IsString, IsNotEmpty } from 'class-validator';

// src/followups/dto/update-comment.dto.ts
export class UpdateFollowupCommentDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}