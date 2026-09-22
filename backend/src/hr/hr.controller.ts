// src/hr/hr.controller.ts
// Workforce module — attendance, active-hours, and payroll for every admin/
// team member, plus the access-grant management that decides who besides
// SUPER_ADMIN can see or edit it. Performance itself is already covered by
// GET /admin/reports/* (admin.controller.ts) — this module adds the pieces
// that didn't exist yet: hours active, daily/monthly attendance, payment.
import {
  Controller, Get, Patch, Param, Query, Body, UseGuards, Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Reflector } from '@nestjs/core';
import { IsInt, IsNumber, IsOptional, IsString, IsIn, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { HrService } from './hr.service';
import { HrAccessGuard, HrScope } from './hr-access.guard';
import { HrEdit } from './hr-edit.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

const reflector = new Reflector();

class UpsertSalaryDto {
  @Type(() => Number) @IsInt() @Min(1) @Max(12) month: number;
  @Type(() => Number) @IsInt() @Min(2020) @Max(2100) year: number;
  @Type(() => Number) @IsNumber() @Min(0) amount: number;
  @IsOptional() @IsIn(['PENDING', 'PAID']) status?: 'PENDING' | 'PAID';
  @IsOptional() @IsString() notes?: string;
}

class UpsertAccessGrantDto {
  @IsBoolean() canView: boolean;
  @IsBoolean() canEdit: boolean;
}

@ApiTags('Workforce (HR)')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector))
@Controller('hr')
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Patch('heartbeat')
  @ApiOperation({ summary: 'Record activity for the current admin (called every ~60s by the admin panel while the tab is open)' })
  heartbeat(@CurrentUser('id') id: string) {
    return this.hrService.heartbeat(id);
  }

  @Get('my-access')
  @ApiOperation({ summary: "Current admin's own Workforce access level — used to gate the sidebar link" })
  getMyAccess(@CurrentUser('id') id: string, @CurrentUser('adminRole') role: string) {
    return this.hrService.getMyAccess(id, role);
  }

  @Get('attendance')
  @UseGuards(HrAccessGuard)
  @ApiQuery({ name: 'date', required: false, description: 'YYYY-MM-DD, defaults to today' })
  @ApiOperation({ summary: 'Attendance + active hours for one day, scoped to what the caller can see' })
  getDailyAttendance(@Request() req: any, @Query('date') date?: string) {
    return this.hrService.getDailyAttendance(req.hrScope as HrScope, date);
  }

  @Get('attendance/monthly')
  @UseGuards(HrAccessGuard)
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiOperation({ summary: 'Monthly attendance rollup (days present, total hours), scoped to what the caller can see' })
  getMonthlyAttendance(@Request() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.hrService.getMonthlyAttendance(req.hrScope as HrScope, Number(month), Number(year));
  }

  @Get('attendance/member/:id')
  @UseGuards(HrAccessGuard)
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiOperation({ summary: "One admin's daily attendance calendar for a month" })
  getMemberAttendanceDetail(
    @Request() req: any, @Param('id') id: string,
    @Query('month') month: string, @Query('year') year: string,
  ) {
    return this.hrService.getMemberAttendanceDetail(req.hrScope as HrScope, id, Number(month), Number(year));
  }

  @Get('salary')
  @UseGuards(HrAccessGuard)
  @ApiQuery({ name: 'month', required: true })
  @ApiQuery({ name: 'year', required: true })
  @ApiOperation({ summary: 'Monthly salary records for every admin in the caller\'s scope' })
  getSalary(@Request() req: any, @Query('month') month: string, @Query('year') year: string) {
    return this.hrService.getSalary(req.hrScope as HrScope, Number(month), Number(year));
  }

  @Patch('salary/:adminId')
  @UseGuards(HrAccessGuard)
  @HrEdit()
  @ApiOperation({ summary: 'Set/update one admin\'s salary amount + paid status for a month (edit access required)' })
  upsertSalary(
    @Request() req: any, @CurrentUser('id') recorderId: string,
    @Param('adminId') adminId: string, @Body() dto: UpsertSalaryDto,
  ) {
    return this.hrService.upsertSalary(req.hrScope as HrScope, recorderId, adminId, dto);
  }

  @Get('access-grants')
  @UseGuards(new RolesGuard(reflector))
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'List every admin\'s Workforce access grant (super admin only)' })
  listAccessGrants() {
    return this.hrService.listAccessGrants();
  }

  @Patch('access-grants/:adminId')
  @UseGuards(new RolesGuard(reflector))
  @Roles('SUPER_ADMIN')
  @ApiOperation({ summary: 'Grant/revoke Workforce view+edit access for one admin or team manager (super admin only)' })
  upsertAccessGrant(
    @CurrentUser('id') granterId: string, @Param('adminId') adminId: string, @Body() dto: UpsertAccessGrantDto,
  ) {
    return this.hrService.upsertAccessGrant(granterId, adminId, dto);
  }
}
