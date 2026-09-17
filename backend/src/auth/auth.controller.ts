// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { SendOtpDto, VerifyOtpDto, RefreshTokenDto, AdminLoginDto } from './auth.dto';

function extractIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return (Array.isArray(forwarded) ? forwarded[0] : forwarded.split(',')[0]).trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function extractDevice(req: Request): string {
  return (req.headers['user-agent'] || '').slice(0, 255);
}

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // In-memory limit, independent of the Redis-backed per-phone counter in
  // AuthService (which fails open — allows unlimited attempts — if Redis is
  // unreachable). This is the backstop that still holds when that happens.
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('send-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send OTP to phone number via MSG91' })
  sendOtp(@Body() dto: SendOtpDto) {
    return this.authService.sendOtp(dto.phone);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP and receive JWT tokens' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.authService.verifyOtp(dto.phone, dto.otp);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout and invalidate refresh token' })
  logout(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    return this.authService.logout(dto.refreshToken, undefined, extractIp(req), extractDevice(req));
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login with email and password' })
  @ApiResponse({ status: 200, description: 'Returns accessToken and admin profile' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  adminLogin(@Body() dto: AdminLoginDto, @Req() req: Request) {
    return this.authService.adminLogin(dto.email, dto.password, extractIp(req), extractDevice(req));
  }
}
