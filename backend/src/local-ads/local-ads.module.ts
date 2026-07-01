// src/local-ads/local-ads.module.ts
import { Module } from '@nestjs/common';
import { LocalAdsController } from './local-ads.controller';
import { LocalAdsService } from './local-ads.service';

@Module({
  controllers: [LocalAdsController],
  providers:   [LocalAdsService],
  exports:     [LocalAdsService],
})
export class LocalAdsModule {}
