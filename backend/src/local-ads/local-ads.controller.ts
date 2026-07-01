// src/local-ads/local-ads.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LocalAdsService } from './local-ads.service';
import { CreateLocalAdDto, UpdateLocalAdDto } from './local-ads.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Local Ads')
@Controller('local-ads')
export class LocalAdsController {
  constructor(private readonly localAdsService: LocalAdsService) {}

  // ─── Public: active ads for reader app ───────────────────────────────────

  @Get('active')
  @ApiQuery({ name: 'placement', required: false, enum: ['LOCAL', 'ADMOB', 'BOTH'] })
  @ApiOperation({ summary: 'Get active local ads (public, for reader app)' })
  getActive(@Query('placement') placement?: string) {
    return this.localAdsService.getActiveAds(placement);
  }

  @Post(':id/click')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track ad click (public)' })
  trackClick(@Param('id') id: string) {
    return this.localAdsService.trackClick(id);
  }

  @Post(':id/impression')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track ad impression (public)' })
  trackImpression(@Param('id') id: string) {
    return this.localAdsService.trackImpression(id);
  }

  // ─── Admin: CRUD ──────────────────────────────────────────────────────────

  @Get()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER')
  @ApiQuery({ name: 'status',  required: false })
  @ApiQuery({ name: 'adType', required: false })
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiOperation({ summary: 'List all ads (admin)' })
  findAll(
    @Query('status')  status?: string,
    @Query('adType')  adType?: string,
    @Query('page')    page?: string,
    @Query('limit')   limit?: string,
  ) {
    return this.localAdsService.findAll({
      status,
      adType,
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    });
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER')
  findOne(@Param('id') id: string) {
    return this.localAdsService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER')
  @ApiOperation({ summary: 'Create local ad' })
  create(@Body() dto: CreateLocalAdDto, @CurrentUser('id') adminId: string) {
    return this.localAdsService.create(dto, adminId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER')
  @ApiOperation({ summary: 'Update local ad' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLocalAdDto,
    @CurrentUser('id') adminId: string,
  ) {
    return this.localAdsService.update(id, dto, adminId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'ADVERTISEMENT_MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete local ad' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.localAdsService.remove(id, adminId);
  }
}
