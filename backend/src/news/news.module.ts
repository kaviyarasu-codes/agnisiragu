// src/news/news.module.ts
import { Module } from '@nestjs/common';
import { NewsService } from './news.service';
import { NewsController } from './news.controller';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [NewsService],
  controllers: [NewsController],
})
export class NewsModule {}
