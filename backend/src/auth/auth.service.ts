// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis.Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {
    this.redis = new Redis.default(this.config.get<string>('REDIS_URL', 'redis://localhost:6379'));
  }

  // ─── OTP ─────────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    // Rate limit: max 3 OTP requests per 10 minutes per phone
    const rateLimitKey = `otp_rate:${phone}`;
    const attempts = await this.redis.incr(rateLimitKey);
    if (attempts === 1) {
      await this.redis.expire(rateLimitKey, 600); // 10 min window
    }
    if (attempts > 3) {
      throw new BadRequestException('Too many OTP requests. Please try again after 10 minutes.');
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store hashed OTP in Redis with 5 min TTL
    const otpHash = await bcrypt.hash(otp, 10);
    await this.redis.set(`otp:${phone}`, otpHash, 'EX', 300);

    // Send via MSG91
    await this.sendMsg91Otp(phone, otp);

    return { message: 'OTP sent successfully' };
  }

  private async sendMsg91Otp(phone: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');
    const senderId = this.config.get<string>('MSG91_SENDER_ID', 'AGNSRG');

    // Strip leading + for MSG91
    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;

    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        {
          template_id: templateId,
          mobile,
          authkey: authKey,
          otp,
          sender: senderId,
        },
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error('MSG91 OTP send failed', err?.response?.data || err.message);
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  async verifyOtp(phone: string, otp: string) {
    const storedHash = await this.redis.get(`otp:${phone}`);
    if (!storedHash) {
      throw new BadRequestException('OTP expired or not requested');
    }

    const isValid = await bcrypt.compare(otp, storedHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    // Consume OTP
    await this.redis.del(`otp:${phone}`);
    await this.redis.del(`otp_rate:${phone}`);

    // Find or create user
    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({
        data: { phone, role: 'READER' },
      });
    }

    // Issue tokens
    const tokens = await this.issueTokens(user.id, 'user', user.role);

    const { ...userSafe } = user;
    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: userSafe,
      },
    };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      // Check if token is in blacklist
      const blacklisted = await this.redis.get(`rt_blacklist:${refreshToken}`);
      if (blacklisted) {
        throw new UnauthorizedException('Refresh token revoked');
      }

      const accessToken = this.jwtService.sign(
        { sub: payload.sub, type: payload.type, role: payload.role },
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
        },
      );

      return { data: { accessToken } };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(refreshToken: string): Promise<{ message: string }> {
    // Blacklist the refresh token until its natural expiry
    try {
      const payload = this.jwtService.decode(refreshToken) as any;
      if (payload?.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redis.set(`rt_blacklist:${refreshToken}`, '1', 'EX', ttl);
        }
      }
    } catch {
      // Ignore decode errors on logout
    }
    return { message: 'Logged out successfully' };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async issueTokens(id: string, type: 'user' | 'admin', role: string) {
    const payload = { sub: id, type, role };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: this.config.get<string>('JWT_EXPIRES_IN', '15m'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d'),
    });

    return { accessToken, refreshToken };
  }

  // ─── Admin Login ─────────────────────────────────────────────────────────

  async adminLogin(email: string, password: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.issueTokens(admin.id, 'admin', admin.adminRole);
    const { passwordHash, ...adminSafe } = admin;

    return {
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        admin: adminSafe,
      },
    };
  }

  // ─── JWT Strategy helper ──────────────────────────────────────────────────

  async validateJwtPayload(payload: any) {
    if (payload.type === 'admin') {
      const admin = await this.prisma.admin.findUnique({ where: { id: payload.sub } });
      if (!admin) return null;
      const { passwordHash, ...safe } = admin;
      return { ...safe, _type: 'admin' };
    } else {
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.isBanned) return null;
      return { ...user, _type: 'user' };
    }
  }
}
