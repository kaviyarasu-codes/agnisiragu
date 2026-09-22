// src/auth/auth.dto.ts
import { IsString, IsPhoneNumber, IsOptional, IsBoolean, Length, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendOtpDto {
  @ApiProperty({ example: '+919876543210', description: 'Phone number with country code' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone must be a valid international phone number' })
  phone: string;
}

export class VerifyOtpDto {
  @ApiProperty({ example: '+919876543210' })
  @IsString()
  @Matches(/^\+[1-9]\d{6,14}$/, { message: 'phone must be a valid international phone number' })
  phone: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  @Matches(/^\d{6}$/, { message: 'OTP must be numeric' })
  otp: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsString()
  refreshToken: string;
}

export class AdminLoginDto {
  @ApiProperty({ example: 'admin@agnisiragu.com' })
  @IsString()
  email: string;

  @ApiProperty({ example: 'Admin@123456' })
  @IsString()
  password: string;

  // Sent only on a resubmitted login after the person has already seen and
  // confirmed the "already signed in on <device>" prompt (see
  // AuthService.adminLogin) — signs the other device out and proceeds.
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  forceLogout?: boolean;
}
