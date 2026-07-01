// src/local-ads/local-ads.dto.ts
import { IsString, IsOptional, IsEnum, IsDateString, IsInt, Min, IsArray, IsUrl } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLocalAdDto {
  @ApiProperty() @IsString() title: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;

  @ApiProperty({ enum: ['IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL'] })
  @IsEnum(['IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL'])
  adType: string;

  @ApiPropertyOptional() @IsOptional() @IsString() mediaUrl?: string;
  @ApiPropertyOptional() @IsOptional() @IsArray() carousel?: string[];

  @ApiProperty() @IsDateString() startDate: string;
  @ApiProperty() @IsDateString() endDate: string;

  @ApiPropertyOptional() @IsOptional() @IsString() categoryId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() targetAudience?: string;

  @ApiPropertyOptional() @IsOptional() @IsInt() @Min(0) @Type(() => Number)
  priority?: number;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'] })
  @IsOptional() @IsEnum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED'])
  status?: string;

  @ApiProperty({ enum: ['WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM'] })
  @IsEnum(['WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM'])
  ctaType: string;

  @ApiProperty() @IsString() ctaValue: string;

  @ApiPropertyOptional({ enum: ['ADMOB', 'LOCAL', 'BOTH'] })
  @IsOptional() @IsEnum(['ADMOB', 'LOCAL', 'BOTH'])
  placement?: string;
}

export class UpdateLocalAdDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(['IMAGE', 'VIDEO', 'BANNER', 'CAROUSEL']) adType?: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsArray() carousel?: string[];
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @IsString() categoryId?: string;
  @IsOptional() @IsString() targetAudience?: string;
  @IsOptional() @IsInt() @Min(0) @Type(() => Number) priority?: number;
  @IsOptional() @IsEnum(['DRAFT', 'ACTIVE', 'PAUSED', 'EXPIRED']) status?: string;
  @IsOptional() @IsEnum(['WHATSAPP', 'PHONE', 'WEBSITE', 'EMAIL', 'MAPS', 'FORM']) ctaType?: string;
  @IsOptional() @IsString() ctaValue?: string;
  @IsOptional() @IsEnum(['ADMOB', 'LOCAL', 'BOTH']) placement?: string;
}
