// src/notifications/notifications.dto.ts
import { IsString, IsOptional, IsUUID, IsArray, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ example: 'முக்கிய செய்தி' })
  @IsString()
  titleTa: string;

  @ApiProperty({ example: 'Heavy rain expected in Tamil Nadu tonight.', description: 'Tamil body' })
  @IsString()
  bodyTa: string;

  @ApiProperty({ example: 'Breaking News' })
  @IsString()
  titleEn: string;

  @ApiProperty({ example: 'Heavy rain expected in Tamil Nadu tonight.' })
  @IsString()
  bodyEn: string;

  @ApiPropertyOptional({ enum: ['ALL', 'CATEGORY'], default: 'ALL' })
  @IsOptional()
  @IsIn(['ALL', 'CATEGORY'])
  target?: 'ALL' | 'CATEGORY';

  @ApiPropertyOptional({ example: 'uuid-of-category', description: 'Required when target=CATEGORY. Sends to users who have read an article in this category before.' })
  // @IsOptional() only skips undefined/null — a "By Category" send with no
  // category picked was arriving here as categoryId: '' (an unselected
  // <select>'s value), which @IsUUID() correctly rejects, but as an opaque
  // 400 with no indication of the real cause. Treat '' the same as
  // "not provided" so this fails validation only when it's actually
  // ambiguous, and the admin-panel form now blocks this case before submit too.
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Specific FCM tokens to target (overrides target/categoryId broadcast)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tokens?: string[];

  @ApiPropertyOptional({ description: 'Extra data payload for the notification' })
  @IsOptional()
  data?: Record<string, string>;
}
