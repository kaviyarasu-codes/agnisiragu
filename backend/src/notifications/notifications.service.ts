// src/notifications/notifications.service.ts
//
// Sends push notifications via Expo's push service, NOT Firebase Admin SDK
// directly. This matters: the reader-app registers its device token with
// `getExpoPushTokenAsync()` (see apps/reader-app/src/lib/push.ts), which
// produces an Expo push token in the form "ExponentPushToken[...]" — not a
// raw FCM registration token. Firebase Admin's `sendEachForMulticast` only
// accepts real FCM tokens, so every send against Expo-format tokens failed
// silently (or threw), which is why every notification in the admin panel's
// history showed status FAILED regardless of Firebase credentials being
// configured. Expo's push service internally relays to FCM (Android) and
// APNs (iOS) on your behalf, so no Firebase service-account credentials are
// needed for this at all.
//
// The Prisma column is still named `fcmToken` (avoiding a migration for a
// rename) — despite the name, it holds Expo push tokens.
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { PrismaService } from '../prisma/prisma.service';
import { SendNotificationDto } from './notifications.dto';

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
  error?: string;
  sentAt: Date;
  createdAt: Date;
}

// Admin has occasionally pasted rich-text content (with <p>/<strong> tags)
// into the plain-text title/body fields. Push notification payloads must be
// plain text — strip any HTML before it ever reaches a device or a log.
function stripHtml(input: string | undefined | null): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo: Expo;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    // accessToken is optional (only needed for Expo's enhanced security
    // push feature); undefined is fine for standard sends.
    this.expo = new Expo({ accessToken: this.config.get<string>('EXPO_ACCESS_TOKEN') });
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
    const titleTa = stripHtml(dto.titleTa);
    const bodyTa = stripHtml(dto.bodyTa);
    const titleEn = stripHtml(dto.titleEn);
    const bodyEn = stripHtml(dto.bodyEn);

    const rawTokens = await this.resolveTokens(dto);
    // Filter out anything that isn't a well-formed Expo push token (e.g.
    // stale/garbage rows) so one bad token can't blow up the whole batch.
    const tokens = rawTokens.filter((t) => Expo.isExpoPushToken(t));
    const invalidCount = rawTokens.length - tokens.length;

    // Admin-controlled notification style (App Config → Notifications):
    // whether to show the linked article's photo as a big-picture image, and
    // whether to use the app's custom alert sound instead of the system
    // default. Both default on/off per-flag below when the admin hasn't
    // touched them yet.
    const [showImageFlag, customSoundFlag] = await Promise.all([
      this.prisma.appConfig.findUnique({ where: { key: 'notifShowArticleImage' } }),
      this.prisma.appConfig.findUnique({ where: { key: 'notifCustomSoundEnabled' } }),
    ]);
    const showArticleImage = showImageFlag ? showImageFlag.value !== false : true;
    // Android sound is entirely determined by the device-side Notification
    // Channel (see notificationsCompat.ts's ensureNotificationChannelAsync),
    // not by anything in this payload — channelId just routes the
    // notification through that channel. This flag exists for later once a
    // custom sound file is added to the channel config; today it's a no-op
    // either way but the plumbing is ready.
    const useCustomSound = customSoundFlag?.value === true;
    void useCustomSound;

    const baseMetadata = {
      titleTa,
      bodyTa,
      titleEn,
      bodyEn,
      target: dto.target ?? 'ALL',
      categoryId: dto.categoryId,
    };

    if (!tokens.length) {
      await this.prisma.auditLog.create({
        data: {
          ...(adminId ? { adminId } : {}),
          action: 'SEND_NOTIFICATION',
          entityType: 'notification',
          metadata: {
            ...baseMetadata,
            status: 'FAILED',
            successCount: 0,
            failureCount: 0,
            tokenCount: rawTokens.length,
            error: invalidCount > 0
              ? `${invalidCount} token(s) were not valid Expo push tokens`
              : 'No devices are registered to receive push notifications yet',
          } as any,
        },
      }).catch(() => {});
      return { data: { successCount: 0, failureCount: 0, message: 'No tokens to send to' } };
    }

    // `channelId`/`richContent` are documented, current Expo push API fields
    // (https://docs.expo.dev/push-notifications/sending-notifications/#message-request-format)
    // that may postdate this project's pinned expo-server-sdk type defs —
    // cast per-message rather than widening ExpoPushMessage[] itself, so a
    // stale type def can't silently drop these fields at compile time.
    const messages: ExpoPushMessage[] = tokens.map((token) => {
      const base = {
        to: token,
        sound: 'default', // iOS only — Android's sound comes from the channel below
        title: titleTa,
        body: bodyTa,
        data: { titleEn, bodyEn, ...(dto.data ?? {}) },
        // Routes through the app's own "news-alerts" channel (icon/color/
        // vibration configured on-device — see notificationsCompat.ts)
        // instead of Android's generic auto-created "Default" one.
        channelId: 'news-alerts',
        ...(dto.imageUrl && showArticleImage
          ? { richContent: { image: dto.imageUrl } }
          : {}),
      };
      return base as ExpoPushMessage;
    });

    const chunks = this.expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];
    const errors: string[] = [];
    const deadTokens: string[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await this.expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);
      } catch (err) {
        const message = err?.message ?? 'Unknown error sending a batch';
        // Expo requires every token in one request to belong to the same
        // Expo/EAS project. This table has accumulated tokens across many
        // months of testing (Expo Go, older builds under different EAS
        // project setups, etc.), so a chunk can easily mix tokens from
        // different projects — and Expo rejects the ENTIRE chunk for that,
        // even though most tokens in it are perfectly valid. That's the
        // actual cause behind every send showing 0 successful deliveries.
        // Retry one token at a time so valid tokens still get delivered,
        // and so a genuinely broken token can be identified and pruned
        // instead of silently poisoning every future batch it lands in.
        if (/same project/i.test(message)) {
          for (const single of chunk) {
            try {
              const singleTicket = await this.expo.sendPushNotificationsAsync([single]);
              tickets.push(...singleTicket);
            } catch (singleErr) {
              const singleMessage = singleErr?.message ?? 'Unknown error sending to one token';
              this.logger.error(`Expo push send failed for token ${single.to}`, singleMessage);
              errors.push(singleMessage);
              // A token that still fails when sent completely alone (no
              // other token to "conflict" with) is permanently unusable —
              // stale from an old build/project, not a transient issue.
              deadTokens.push(single.to as string);
            }
          }
        } else {
          this.logger.error('Expo push send failed for a chunk', message);
          errors.push(message);
        }
      }
    }

    if (deadTokens.length) {
      await this.prisma.pushToken
        .deleteMany({ where: { fcmToken: { in: deadTokens } } })
        .catch((err) => this.logger.error('Failed to prune dead push tokens', err?.message ?? err));
    }

    let successCount = 0;
    let failureCount = 0;
    for (const ticket of tickets) {
      if (ticket.status === 'ok') {
        successCount++;
      } else {
        failureCount++;
        if (ticket.message) errors.push(ticket.message);
      }
    }
    // Any tokens whose chunk threw entirely (no ticket at all) still count
    // as failures so the totals reconcile with tokens.length.
    failureCount += tokens.length - tickets.length;

    await this.prisma.auditLog.create({
      data: {
        ...(adminId ? { adminId } : {}),
        action: 'SEND_NOTIFICATION',
        entityType: 'notification',
        metadata: {
          ...baseMetadata,
          status: successCount > 0 ? 'SENT' : 'FAILED',
          successCount,
          failureCount,
          tokenCount: tokens.length,
          ...(deadTokens.length ? { prunedTokenCount: deadTokens.length } : {}),
          ...(errors.length ? { error: errors.slice(0, 5).join('; ') } : {}),
        } as any,
      },
    }).catch(() => {});

    return { data: { successCount, failureCount } };
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
        titleTa: stripHtml(m.titleTa),
        bodyTa: stripHtml(m.bodyTa),
        titleEn: stripHtml(m.titleEn),
        bodyEn: stripHtml(m.bodyEn),
        target: m.target ?? 'ALL',
        categoryId: m.categoryId,
        status: m.status ?? 'SENT',
        successCount: m.successCount ?? 0,
        failureCount: m.failureCount ?? 0,
        error: m.error,
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
