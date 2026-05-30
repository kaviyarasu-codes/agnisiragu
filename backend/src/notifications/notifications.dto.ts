// src/notifications/notifications.dto.ts
import { IsString, IsOptional, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendNotificationDto {
  @ApiProperty({ example: 'Breaking News' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Heavy rain expected in Tamil Nadu tonight.' })
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: 'uuid-of-category', description: 'Send only to users interested in this category. If omitted, sends to all.' })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Specific FCM tokens to target (overrides categoryId broadcast)' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tokens?: string[];

  @ApiPropertyOptional({ description: 'Extra data payload for the notification' })
  @IsOptional()
  data?: Record<string, string>;
}
