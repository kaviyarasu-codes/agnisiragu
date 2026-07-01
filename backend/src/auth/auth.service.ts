// src/auth/auth.service.ts
import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import * as Redis from 'ioredis';
import axios from 'axios';

@Injectable()
export class AuthService implements OnModuleInit {
  private readonly logger = new Logger(AuthService.name);
  private redis: Redis.Redis;
  private redisReady = false;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  onModuleInit() {
    const redisUrl = this.config.get<string>('REDIS_URL', 'redis://localhost:6379');
    this.redis = new Redis.default(redisUrl, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 500, 2000);
      },
    });

    this.redis.connect().then(() => {
      this.redisReady = true;
      this.logger.log('Redis connected');
    }).catch((err) => {
      this.logger.warn(`Redis unavailable — OTP rate limiting and token blacklist disabled. Error: ${err.message}`);
    });

    this.redis.on('ready', () => { this.redisReady = true; });
    this.redis.on('error', () => { this.redisReady = false; });
  }

  // ─── Redis helpers (fail-safe) ────────────────────────────────────────────

  private async redisGet(key: string): Promise<string | null> {
    if (!this.redisReady) return null;
    try { return await this.redis.get(key); } catch { return null; }
  }

  private async redisSet(key: string, value: string, mode: 'EX', ttl: number): Promise<void> {
    if (!this.redisReady) return;
    try { await this.redis.set(key, value, mode, ttl); } catch { /* ignore */ }
  }

  private async redisDel(...keys: string[]): Promise<void> {
    if (!this.redisReady) return;
    try { await this.redis.del(...keys); } catch { /* ignore */ }
  }

  private async redisIncr(key: string): Promise<number> {
    if (!this.redisReady) return 0;
    try { return await this.redis.incr(key); } catch { return 0; }
  }

  private async redisExpire(key: string, ttl: number): Promise<void> {
    if (!this.redisReady) return;
    try { await this.redis.expire(key, ttl); } catch { /* ignore */ }
  }

  // ─── Audit Log helper ─────────────────────────────────────────────────────

  private async writeAuditLog(opts: {
    adminId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    device?: string;
  }) {
    try {
      await this.prisma.auditLog.create({ data: opts });
    } catch { /* non-critical — don't fail the request */ }
  }

  // ─── OTP ─────────────────────────────────────────────────────────────────

  async sendOtp(phone: string): Promise<{ message: string }> {
    const rateLimitKey = `otp_rate:${phone}`;
    const attempts = await this.redisIncr(rateLimitKey);
    if (attempts === 1) {
      await this.redisExpire(rateLimitKey, 600);
    }
    if (attempts > 3) {
      throw new BadRequestException('Too many OTP requests. Please try again after 10 minutes.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    await this.redisSet(`otp:${phone}`, otpHash, 'EX', 300);
    await this.sendMsg91Otp(phone, otp);
    return { message: 'OTP sent successfully' };
  }

  private async sendMsg91Otp(phone: string, otp: string): Promise<void> {
    const authKey = this.config.get<string>('MSG91_AUTH_KEY');
    const templateId = this.config.get<string>('MSG91_TEMPLATE_ID');
    const senderId = this.config.get<string>('MSG91_SENDER_ID', 'AGNSRG');

    if (!authKey || !templateId) {
      this.logger.warn(`MSG91 not configured — OTP for ${phone}: ${otp}`);
      return;
    }

    const mobile = phone.startsWith('+') ? phone.slice(1) : phone;

    try {
      await axios.post(
        'https://api.msg91.com/api/v5/otp',
        { template_id: templateId, mobile, authkey: authKey, otp, sender: senderId },
        { headers: { 'Content-Type': 'application/json' } },
      );
    } catch (err) {
      this.logger.error('MSG91 OTP send failed', err?.response?.data || err.message);
      throw new InternalServerErrorException('Failed to send OTP. Please try again.');
    }
  }

  // ─── Verify OTP ───────────────────────────────────────────────────────────

  async verifyOtp(phone: string, otp: string) {
    const storedHash = await this.redisGet(`otp:${phone}`);
    if (!storedHash) {
      throw new BadRequestException('OTP expired or not requested');
    }

    const isValid = await bcrypt.compare(otp, storedHash);
    if (!isValid) {
      throw new BadRequestException('Invalid OTP');
    }

    await this.redisDel(`otp:${phone}`, `otp_rate:${phone}`);

    let user = await this.prisma.user.findUnique({ where: { phone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone, role: 'READER' } });
    }

    const tokens = await this.issueTokens(user.id, 'user', user.role);
    return { data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user } };
  }

  // ─── Refresh ──────────────────────────────────────────────────────────────

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const blacklisted = await this.redisGet(`rt_blacklist:${refreshToken}`);
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

  async logout(refreshToken: string, adminId?: string, ip?: string, device?: string): Promise<{ message: string }> {
    try {
      const payload = this.jwtService.decode(refreshToken) as any;
      if (payload?.exp) {
        const ttl = payload.exp - Math.floor(Date.now() / 1000);
        if (ttl > 0) {
          await this.redisSet(`rt_blacklist:${refreshToken}`, '1', 'EX', ttl);
        }
      }
      const resolvedAdminId = adminId ?? (payload?.type === 'admin' ? payload?.sub : undefined);
      if (resolvedAdminId) {
        await this.writeAuditLog({
          adminId: resolvedAdminId,
          action: 'ADMIN_LOGOUT',
          entityType: 'admin',
          entityId: resolvedAdminId,
          ip,
          device,
        });
      }
    } catch { /* ignore */ }
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

  async adminLogin(email: string, password: string, ip?: string, device?: string) {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    if (!admin) throw new UnauthorizedException('Invalid credentials');
    if (admin.isActive === false) throw new UnauthorizedException('Account is deactivated');

    const valid = await bcrypt.compare(password, admin.passwordHash);
    if (!valid) {
      await this.writeAuditLog({
        action: 'ADMIN_LOGIN_FAILED',
        entityType: 'admin',
        entityId: admin.id,
        metadata: { email },
        ip,
        device,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: { lastLoginAt: new Date() },
    });

    await this.writeAuditLog({
      adminId: admin.id,
      action: 'ADMIN_LOGIN',
      entityType: 'admin',
      entityId: admin.id,
      metadata: { role: admin.adminRole, team: admin.teamType },
      ip,
      device,
    });

    const tokens = await this.issueTokens(admin.id, 'admin', admin.adminRole);
    const { passwordHash, ...adminSafe } = admin;

    return { data: { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, admin: adminSafe } };
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
