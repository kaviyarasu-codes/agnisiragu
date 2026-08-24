// src/notifications/notifications.service.ts
import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './notifications.dto';
import * as admin from 'firebase-admin';

export interface NotificationLog {
  id: string;
  titleTa: string;
  bodyTa: string;
  titleEn: string;
  bodyEn: string;
  target: string;
  categoryId?: string;
  status: 'SENT' | 'FAILED';
  successCount: number;
  failureCount: number;
  sentAt: Date;
  createdAt: Date;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  onModuleInit() {
    try {
      const projectId = this.config.get<string>('FCM_PROJECT_ID');
      const privateKey = this.config.get<string>('FCM_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const clientEmail = this.config.get<string>('FCM_CLIENT_EMAIL');

      if (projectId && privateKey && clientEmail) {
        if (!admin.apps.length) {
          this.firebaseApp = admin.initializeApp({
            credential: admin.credential.cert({ projectId, privateKey, clientEmail }),
          });
        } else {
          this.firebaseApp = admin.apps[0]!;
        }
        this.logger.log('Firebase Admin initialized');
      } else {
        this.logger.warn('Firebase credentials not configured — FCM push disabled');
      }
    } catch (err) {
      this.logger.error('Firebase init failed', err.message);
    }
  }

  private async resolveTokens(dto: SendNotificationDto): Promise<string[]> {
    if (dto.tokens && dto.tokens.length > 0) {
      return dto.tokens;
    }

    if (dto.target === 'CATEGORY' && dto.categoryId) {
      // Proxy for "interested in this category": has read at least one
      // article in it before. There's no explicit subscription model yet.
      const reads = await this.prisma.articleRead.findMany({
        where: { article: { categoryId: dto.categoryId } },
        select: { userId: true },
        distinct: ['userId'],
      });
      const userIds = reads.map((r) => r.userId);
      if (!userIds.length) return [];
      const pushTokens = await this.prisma.pushToken.findMany({
        where: { userId: { in: userIds } },
        select: { fcmToken: true },
      });
      return pushTokens.map((t) => t.fcmToken);
    }

    const pushTokens = await this.prisma.pushToken.findMany({ select: { fcmToken: true } });
    return pushTokens.map((t) => t.fcmToken);
  }

  async send(dto: SendNotificationDto, adminId?: string) {
    const tokens = await this.resolveTokens(dto);

    const baseMetadata = {
      titleTa: dto.titleTa,
      bodyTa: dto.bodyTa,
      titleEn: dto.titleEn,
      bodyEn: dto.bodyEn,
      target: dto.target ?? 'ALL',
      categoryId: dto.categoryId,
    };

    if (!tokens.length) {
      await this.prisma.auditLog.create({
        data: {
          ...(adminId ? { adminId } : {}),
          action: 'SEND_NOTIFICATION',
          entityType: 'notification',
          metadata: { ...baseMetadata, status: 'FAILED', successCount: 0, failureCount: 0, tokenCount: 0 } as any,
        },
      }).catch(() => {});
      return { data: { successCount: 0, failureCount: 0, message: 'No tokens to send to' } };
    }

    if (!this.firebaseApp) {
      await this.prisma.auditLog.create({
        data: {
          ...(adminId ? { adminId } : {}),
          action: 'SEND_NOTIFICATION',
          entityType: 'notification',
          metadata: { ...baseMetadata, status: 'FAILED', successCount: 0, failureCount: tokens.length, tokenCount: tokens.length } as any,
        },
      }).catch(() => {});
      throw new InternalServerErrorException('Firebase not configured');
    }

    // Notification chrome uses Tamil (the app's default language); the
    // English variant travels in the data payload for a future per-user
    // language-aware handler on the client.
    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: dto.titleTa, body: dto.bodyTa },
      data: {
        titleEn: dto.titleEn,
        bodyEn: dto.bodyEn,
        ...(dto.data ?? {}),
      },
    };

    const response = await admin.messaging(this.firebaseApp).sendEachForMulticast(message);

    // Audit log doubles as notification history — adminId omitted for
    // system-triggered sends (e.g. auto breaking-news push).
    await this.prisma.auditLog.create({
      data: {
        ...(adminId ? { adminId } : {}),
        action: 'SEND_NOTIFICATION',
        entityType: 'notification',
        metadata: {
          ...baseMetadata,
          status: response.successCount > 0 ? 'SENT' : 'FAILED',
          successCount: response.successCount,
          failureCount: response.failureCount,
          tokenCount: tokens.length,
        } as any,
      },
    }).catch(() => {});

    return {
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  }

  async getNotificationLogs(limit = 50, offset = 0) {
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { action: 'SEND_NOTIFICATION' },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.auditLog.count({ where: { action: 'SEND_NOTIFICATION' } }),
    ]);

    const data: NotificationLog[] = logs.map((l) => {
      const m = (l.metadata as any) ?? {};
      return {
        id: l.id,
        titleTa: m.titleTa ?? '',
        bodyTa: m.bodyTa ?? '',
        titleEn: m.titleEn ?? '',
        bodyEn: m.bodyEn ?? '',
        target: m.target ?? 'ALL',
        categoryId: m.categoryId,
        status: m.status ?? 'SENT',
        successCount: m.successCount ?? 0,
        failureCount: m.failureCount ?? 0,
        sentAt: l.createdAt,
        createdAt: l.createdAt,
      };
    });

    return {
      data,
      meta: { total, hasMore: offset + limit < total },
    };
  }
}
