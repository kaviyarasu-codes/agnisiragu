// src/comments/comments.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString() @MinLength(1) @MaxLength(1000) body: string;
}
