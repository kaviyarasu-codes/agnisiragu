// src/admin/admin.controller.ts
import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

const reflector = new Reflector();

class CreateAdminDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail()                email: string;
  @IsString() @MinLength(8) password: string;
  @IsString()               adminRole: string;
  @IsOptional() @IsString() team?: string;
  @IsOptional() @IsString() phone?: string;
}

class UpdateAdminDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString()               adminRole?: string;
  @IsOptional() @IsString()               phone?: string;
  // Only validate password when it's a non-empty string — empty string means "keep current"
  @ValidateIf((o) => o.password !== undefined && o.password !== '')
  @IsString() @MinLength(8) password?: string;
  @IsOptional() @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true'  || value === true)  return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  isActive?: boolean;
}

@ApiTags('Admin')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics' })
  getStats() { return this.adminService.getStats(); }

  @Get('stats/weekly-trend')
  @ApiOperation({ summary: 'Article counts last 7 days (dashboard chart)' })
  getWeeklyTrend() { return this.adminService.getWeeklyTrend(); }

  @Get('reports')
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @ApiOperation({ summary: 'Articles + users trend by period' })
  getReports(@Query('period') period?: string) {
    return this.adminService.getReports(period ?? 'monthly');
  }

  @Get('reports/categories')
  @ApiOperation({ summary: 'Article count by category' })
  getCategoryReport() { return this.adminService.getCategoryReport(); }

  @Get('reports/members')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'All members performance report' })
  getMembersReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getMembersReport(dateFrom, dateTo);
  }

  @Get('reports/teams')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Team-level performance report' })
  getTeamReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getTeamReport(dateFrom, dateTo);
  }

  @Get('reports/member/:id')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Individual member detail report' })
  getMemberDetail(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getMemberDetail(id, dateFrom, dateTo);
  }

  @Get('reports/ads')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Advertisement team report' })
  getAdReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getAdReport(dateFrom, dateTo);
  }

  @Get('accounts')
  @ApiOperation({ summary: 'List all admin accounts' })
  getAdminAccounts() { return this.adminService.getAdminAccounts(); }

  @Post('accounts')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Create admin account (super admin only)' })
  createAdminAccount(@Body() dto: CreateAdminDto) {
    return this.adminService.createAdminAccount(dto);
  }

  @Patch('accounts/:id')
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Update admin account (super admin only)' })
  updateAdminAccount(@Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.adminService.updateAdminAccount(id, dto);
  }

  @Delete('accounts/:id')
  @Roles('SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete admin account (super admin only)' })
  deleteAdminAccount(@Param('id') id: string) {
    return this.adminService.deleteAdminAccount(id);
  }

  @Get('users')
  @ApiQuery({ name: 'page',   required: false })
  @ApiQuery({ name: 'limit',  required: false })
  @ApiQuery({ name: 'search', required: false })
  getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getUsers(
      page  ? Number(page)  : 1,
      limit ? Number(limit) : 20,
      search,
    );
  }

  @Patch('users/:id/ban')
  banUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.banUser(id, adminId);
  }

  @Patch('users/:id/unban')
  unbanUser(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.adminService.unbanUser(id, adminId);
  }

  @Get('audit-logs')
  @ApiQuery({ name: 'page',     required: false })
  @ApiQuery({ name: 'limit',    required: false })
  @ApiQuery({ name: 'action',   required: false })
  @ApiQuery({ name: 'adminId',  required: false })
  @ApiQuery({ name: 'team',     required: false })
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  getAuditLogs(
    @Query('page')     page?: string,
    @Query('limit')    limit?: string,
    @Query('action')   action?: string,
    @Query('adminId')  adminId?: string,
    @Query('team')     team?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo')   dateTo?: string,
  ) {
    return this.adminService.getAuditLogs({
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 50,
      action, adminId, team, dateFrom, dateTo,
    });
  }

  @Get('app-config')
  @Roles('SUPER_ADMIN')
  getAppConfig() { return this.adminService.getAppConfig(); }

  @Patch('app-config')
  @Roles('SUPER_ADMIN')
  saveAppConfig(@Body() body: Record<string, any>) {
    return this.adminService.saveAppConfig(body);
  }

  @Get('settings')
  @Roles('SUPER_ADMIN')
  getSettings() { return this.adminService.getSettings(); }

  @Patch('settings')
  @Roles('SUPER_ADMIN')
  updateSettings(@Body() body: Record<string, any>) {
    return this.adminService.updateSettings(body);
  }
}
