// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { ConfigController } from './config.controller';

@Module({
  providers: [AdminService],
  controllers: [AdminController, ConfigController],
})
export class AdminModule {}
