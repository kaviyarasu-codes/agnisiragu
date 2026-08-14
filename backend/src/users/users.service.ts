// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto, RegisterPushTokenDto } from './users.dto';

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
}
