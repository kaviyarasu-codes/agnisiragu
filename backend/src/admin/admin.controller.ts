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
import { IsEmail, IsString, MinLength, IsOptional, IsBoolean, IsIn, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';

const reflector = new Reflector();

// Mirrors backend/prisma/schema.prisma's AdminRole enum. Kept as a literal
// list (rather than importing the Prisma enum) so this DTO has no runtime
// dependency on @prisma/client — but it means the two must be kept in sync
// by hand when a role is added/removed.
const ADMIN_ROLES = [
  'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER',
  'VERIFICATION_MANAGER', 'VERIFICATION_MEMBER', 'REPORTER_APP_MANAGER', 'REPORTER_APP_MEMBER',
  'REPORTERS_MANAGER', 'REPORTERS_MEMBER', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER',
] as const;

class CreateAdminDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail()                email: string;
  @IsString() @MinLength(8) password: string;
  @IsIn(ADMIN_ROLES)        adminRole: string;
  @IsOptional() @IsString() team?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() avatarUrl?: string;
}

class UpdateMyProfileDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString()               phone?: string;
  @IsOptional() @IsString()               avatarUrl?: string;
  @ValidateIf((o) => o.password !== undefined && o.password !== '')
  @IsString() @MinLength(8) password?: string;
}

class UpdateAdminDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsIn(ADMIN_ROLES)        adminRole?: string;
  @IsOptional() @IsString()               phone?: string;
  @IsOptional() @IsString()               avatarUrl?: string;
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
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform statistics' })
  getStats() { return this.adminService.getStats(); }

  @Get('stats/weekly-trend')
  @ApiOperation({ summary: 'Article counts last 7 days (dashboard chart)' })
  getWeeklyTrend() { return this.adminService.getWeeklyTrend(); }

  // Reports expose every other admin/member's performance data, scores and
  // login activity — restricted to the two top roles, same as Support
  // Tickets and the account-management routes below (accounts/*, which
  // stay SUPER_ADMIN-only since creating/deleting admin accounts is more
  // sensitive still). A Manager/Member should only ever see their own
  // stats, via /admin/me and their own My Profile tab — never this.
  @Get('reports')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'period', required: false, enum: ['daily', 'weekly', 'monthly', 'yearly'] })
  @ApiOperation({ summary: 'Articles + users trend by period (super admin/admin only)' })
  getReports(@Query('period') period?: string) {
    return this.adminService.getReports(period ?? 'monthly');
  }

  @Get('reports/categories')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Article count by category (super admin/admin only)' })
  getCategoryReport() { return this.adminService.getCategoryReport(); }

  @Get('reports/members')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'All members performance report (super admin/admin only)' })
  getMembersReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getMembersReport(dateFrom, dateTo);
  }

  @Get('reports/teams')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Team-level performance report (super admin/admin only)' })
  getTeamReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getTeamReport(dateFrom, dateTo);
  }

  @Get('reports/member/:id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Individual member detail report (super admin/admin only)' })
  getMemberDetail(
    @Param('id') id: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.adminService.getMemberDetail(id, dateFrom, dateTo);
  }

  @Get('reports/ads')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiQuery({ name: 'dateFrom', required: false })
  @ApiQuery({ name: 'dateTo',   required: false })
  @ApiOperation({ summary: 'Advertisement team report (super admin/admin only)' })
  getAdReport(@Query('dateFrom') dateFrom?: string, @Query('dateTo') dateTo?: string) {
    return this.adminService.getAdReport(dateFrom, dateTo);
  }

  @Get('me')
  @ApiOperation({ summary: "Current admin's own fresh profile (resync avatar/name/role)" })
  getMe(@CurrentUser('id') id: string) { return this.adminService.getMe(id); }

  @Get('directory')
  @ApiOperation({ summary: 'Minimal active-admin roster (id/name/role) — any authenticated admin, used by the byline picker' })
  getAdminDirectory() { return this.adminService.getAdminDirectory(); }

  @Patch('me')
  @ApiOperation({ summary: "Update own profile (name/phone/password/avatar) — any authenticated admin, cannot change own role/isActive" })
  updateMe(@CurrentUser('id') id: string, @Body() dto: UpdateMyProfileDto) {
    return this.adminService.updateMyProfile(id, dto);
  }

  // No @Roles() here — SUPER_ADMIN/ADMIN get the full roster, and a
  // *_MANAGER gets their own team's Members, enforced (and scoped) inside
  // AdminService. Same "no static role list, service checks the
  // relationship" pattern as TasksController's assignment hierarchy.
  @Get('accounts')
  @ApiOperation({ summary: 'List admin accounts (super admin/admin: everyone; team manager: own team\'s members only)' })
  getAdminAccounts(@CurrentUser('id') id: string, @CurrentUser('adminRole') role: string, @CurrentUser('teamType') team: string) {
    return this.adminService.getAdminAccounts(id, role, team ?? null);
  }

  @Post('accounts')
  @ApiOperation({ summary: 'Create admin account (super admin/admin: any role; team manager: Members on their own team only)' })
  createAdminAccount(
    @CurrentUser('id') id: string, @CurrentUser('adminRole') role: string, @CurrentUser('teamType') team: string,
    @Body() dto: CreateAdminDto,
  ) {
    return this.adminService.createAdminAccount(dto, id, role, team ?? null);
  }

  @Patch('accounts/:id')
  @ApiOperation({ summary: 'Update admin account (super admin/admin: anyone, incl. role; team manager: own team\'s members, no role changes)' })
  updateAdminAccount(
    @Param('id') id: string,
    @CurrentUser('id') requesterId: string, @CurrentUser('adminRole') role: string, @CurrentUser('teamType') team: string,
    @Body() dto: UpdateAdminDto,
  ) {
    return this.adminService.updateAdminAccount(id, dto, requesterId, role, team ?? null);
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
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Full audit trail across all admins (super admin/admin only)' })
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
