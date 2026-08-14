// src/news/news.module.ts
import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { ArticlesController } from './articles.controller';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [UsersModule, NotificationsModule],
  providers: [NewsService],
  controllers: [NewsController, ArticlesController],
})
export class NewsModule {}
