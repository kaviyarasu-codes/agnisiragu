// src/notifications/notifications.controller.ts
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto } from './notifications.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';
import { Type } from 'class-transformer';

const reflector = new Reflector();

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send FCM push notification (admin only)' })
  send(@Body() dto: SendNotificationDto, @CurrentUser('id') adminId: string) {
    return this.notificationsService.send(dto, adminId);
  }

  @Get()
  @ApiOperation({ summary: 'List sent notifications log (admin only)' })
  getLogs(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationsService.getNotificationLogs(
      limit ? Number(limit) : 50,
      offset ? Number(offset) : 0,
    );
  }
}
