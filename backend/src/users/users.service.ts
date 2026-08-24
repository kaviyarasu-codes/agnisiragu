// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, RegisterPushTokenDto, RegisterGuestPushTokenDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    return { data: user };
  }

  async updateMe(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.preferredLang !== undefined && { preferredLang: dto.preferredLang }),
        ...(dto.fcmToken !== undefined && { fcmToken: dto.fcmToken }),
      },
    });
    return { data: user };
  }

  async getReadCount(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { articleReadCount: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return { data: { articleReadCount: user.articleReadCount } };
  }

  async incrementReadCount(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { articleReadCount: { increment: 1 } },
    });
  }

  // Registers/refreshes an Expo/FCM push token for breaking-news alerts.
  // Upserted by fcmToken (unique) so re-registering the same device just
  // re-points it at the current user (handles logout/login on one device).
  async registerPushToken(userId: string, dto: RegisterPushTokenDto) {
    const token = await this.prisma.pushToken.upsert({
      where: { fcmToken: dto.fcmToken },
      create: { userId, fcmToken: dto.fcmToken, platform: dto.platform },
      update: { userId, platform: dto.platform },
    });
    return { data: { id: token.id } };
  }

  // Public, no-login path — most installs never log in (login is only
  // required after the free-article limit), so breaking-news push can't be
  // gated on having an account. Ties the token to an auto-created "guest"
  // user keyed by a client-generated device ID. Never overwrites a token
  // that's already registered — this stops a stale guest call (e.g. a race
  // on app boot) from downgrading a token that a real login already claimed.
  async registerGuestPushToken(dto: RegisterGuestPushTokenDto) {
    const existing = await this.prisma.pushToken.findUnique({ where: { fcmToken: dto.fcmToken } });
    if (existing) return { data: { id: existing.id } };

    const guestPhone = `guest:${dto.deviceId}`;
    let user = await this.prisma.user.findUnique({ where: { phone: guestPhone } });
    if (!user) {
      user = await this.prisma.user.create({ data: { phone: guestPhone, role: 'READER' } });
    }

    const token = await this.prisma.pushToken.create({
      data: { userId: user.id, fcmToken: dto.fcmToken, platform: dto.platform },
    });
    return { data: { id: token.id } };
  }
}
