// src/notifications/notifications.service.ts
import { Injectable, OnModuleInit, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './notifications.dto';
import * as admin from 'firebase-admin';

export interface NotificationLog {
  id: string;
  title: string;
  body: string;
  sentAt: Date;
  successCount: number;
  failureCount: number;
}

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;
  private notificationLogs: NotificationLog[] = [];

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

  async send(dto: SendNotificationDto, adminId: string) {
    let tokens: string[] = [];

    if (dto.tokens && dto.tokens.length > 0) {
      tokens = dto.tokens;
    } else {
      // Fetch all push tokens (optionally filtered — category filter requires article tracking, so we do all for now)
      const pushTokens = await this.prisma.pushToken.findMany({
        select: { fcmToken: true },
      });
      tokens = pushTokens.map((t) => t.fcmToken);
    }

    if (!tokens.length) {
      return { data: { successCount: 0, failureCount: 0, message: 'No tokens to send to' } };
    }

    if (!this.firebaseApp) {
      throw new InternalServerErrorException('Firebase not configured');
    }

    const message: admin.messaging.MulticastMessage = {
      tokens,
      notification: { title: dto.title, body: dto.body },
      data: dto.data ?? {},
    };

    const response = await admin.messaging(this.firebaseApp).sendEachForMulticast(message);

    const log: NotificationLog = {
      id: `${Date.now()}`,
      title: dto.title,
      body: dto.body,
      sentAt: new Date(),
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
    this.notificationLogs.unshift(log);

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: 'SEND_NOTIFICATION',
        entityType: 'notification',
        metadata: { title: dto.title, tokens: tokens.length } as any,
      },
    });

    return {
      data: {
        successCount: response.successCount,
        failureCount: response.failureCount,
      },
    };
  }

  async getNotificationLogs(limit = 50, offset = 0) {
    const sliced = this.notificationLogs.slice(offset, offset + limit);
    return {
      data: sliced,
      meta: {
        total: this.notificationLogs.length,
        hasMore: offset + limit < this.notificationLogs.length,
      },
    };
  }
}
