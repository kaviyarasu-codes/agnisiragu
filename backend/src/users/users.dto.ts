// src/users/users.dto.ts
import { IsString, IsOptional, IsIn, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'Kaviya' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'ta', enum: ['ta', 'en'] })
  @IsOptional()
  @IsIn(['ta', 'en'])
  preferredLang?: string;

  @ApiPropertyOptional({ example: 'fcm-token-here' })
  @IsOptional()
  @IsString()
  fcmToken?: string;
}

export class RegisterPushTokenDto {
  @ApiProperty({ example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]' })
  @IsString()
  fcmToken: string;

  @ApiProperty({ example: 'android', enum: ['android', 'ios'] })
  @IsIn(['android', 'ios'])
  platform: string;
}
