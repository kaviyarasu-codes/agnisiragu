// src/news/news.dto.ts
import {
  IsString, IsOptional, IsBoolean, IsEnum, IsUUID, IsDateString, IsIn,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import { ArticleStatus, CardStyle } from '@prisma/client';

export class CreateArticleDto {
  @ApiProperty({ example: 'சென்னையில் மழை' })
  @IsString()
  titleTa: string;

  @ApiPropertyOptional({ example: 'Rain in Chennai' })
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiProperty()
  @IsString()
  bodyTa: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 'சிவா குமார்' })
  @IsOptional()
  @IsString()
  byline?: string;

  @ApiProperty({ example: 'uuid-of-category' })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  // Admin-only override for which feed card layout renders this article —
  // STANDARD (default) defers to the app's legacy automatic rules.
  @ApiPropertyOptional({ enum: CardStyle, default: 'STANDARD' })
  @IsOptional()
  @IsEnum(CardStyle)
  cardStyle?: CardStyle;

  @ApiPropertyOptional({ enum: ArticleStatus, default: 'DRAFT' })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class UpdateArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleTa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  titleEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyTa?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bodyEn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  excerpt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  thumbnailUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  byline?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ArticleStatus })
  @IsOptional()
  @IsEnum(ArticleStatus)
  status?: ArticleStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBreaking?: boolean;

  @ApiPropertyOptional({ enum: CardStyle })
  @IsOptional()
  @IsEnum(CardStyle)
  cardStyle?: CardStyle;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}

export class ArticleListQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: ['ta', 'en'], default: 'ta' })
  @IsOptional()
  @IsString()
  lang?: string;
}

// Public reaction toggle (like/dislike). Guests can react too — there's no
// per-user Like table, so de-dup ("already liked this device") happens
// client-side (AsyncStorage) and this endpoint just nudges the counter.
export class ReactArticleDto {
  @ApiProperty({ enum: ['LIKE', 'DISLIKE'] })
  @IsIn(['LIKE', 'DISLIKE'])
  type: 'LIKE' | 'DISLIKE';

  @ApiProperty({ enum: [1, -1], description: '1 to add a reaction, -1 to undo it' })
  @IsIn([1, -1])
  delta: 1 | -1;
}

export class SearchArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cursor?: string;
}
