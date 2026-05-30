// src/admin/admin.controller.ts
import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';
import { Type } from 'class-transformer';

const reflector = new Reflector();

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get platform statistics' })
  getStats() {
    return this.adminService.getStats();
  }

  @Get('users')
  @ApiOperation({ summary: 'Get paginated user list with optional search' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
      search,
    );
  }

  @Patch('users/:id/ban')
  @ApiOperation({ summary: 'Ban a user' })
  banUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.banUser(id, adminId);
  }

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get paginated audit logs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  getAuditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.adminService.getAuditLogs(
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
    );
  }
}
