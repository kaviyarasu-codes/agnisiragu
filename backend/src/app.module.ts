// src/app.module.ts
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CategoriesModule } from './categories/categories.module';
import { NewsModule } from './news/news.module';
import { MediaModule } from './media/media.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { HealthModule } from './health/health.module';
import { LocalAdsModule } from './local-ads/local-ads.module';
import { TeamsModule } from './teams/teams.module';
import { CommentsModule } from './comments/comments.module';
import { TasksModule } from './tasks/tasks.module';
import { TicketsModule } from './tickets/tickets.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate: (config: Record<string, unknown>) => {
        const required = [
          'DATABASE_URL',
          'JWT_SECRET',
          'JWT_REFRESH_SECRET',
        ];
        for (const key of required) {
          if (!config[key]) {
            throw new Error(`Missing required environment variable: ${key}`);
          }
        }
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    NewsModule,
    MediaModule,
    NotificationsModule,
    AdminModule,
    HealthModule,
    LocalAdsModule,
    TeamsModule,
    CommentsModule,
    TasksModule,
    TicketsModule,
  ],
  providers: [
    // ThrottlerModule.forRoot above only registers the storage/config — it
    // was never actually enforced anywhere (no guard applied), so every
    // route, including login and OTP send, had no rate limiting at all.
    // Applying it globally here gives every route a 100 req/min baseline;
    // auth.controller.ts layers tighter per-route limits on top via
    // @Throttle for the endpoints that matter most (OTP, admin login).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
