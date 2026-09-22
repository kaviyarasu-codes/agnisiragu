// src/hr/hr.module.ts
import { Module } from '@nestjs/common';
import { HrService } from './hr.service';
import { HrController } from './hr.controller';

@Module({
  providers: [HrService],
  controllers: [HrController],
})
export class HrModule {}
