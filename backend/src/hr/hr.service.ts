// src/hr/hr.service.ts
import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HrScope, MANAGER_ROLES } from './hr-access.guard';

// A ping arrives roughly every 60s from AttendanceHeartbeat.tsx while the
// admin panel tab is open and visible. MAX_GAP_MIN caps how many minutes a
// single ping can add, so a laptop left open overnight (or a stale tab
// reopened hours later) can't silently inflate someone's "active hours".
const HEARTBEAT_INTERVAL_MIN = 1;
const MAX_GAP_MIN = 5;

function utcDateOnly(d: Date = new Date()): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}
function monthRange(month: number, year: number): { from: Date; to: Date } {
  const from = new Date(Date.UTC(year, month - 1, 1));
  const to = new Date(Date.UTC(year, month, 0)); // last day of the month
  return { from, to };
}

@Injectable()
export class HrService {
  constructor(private prisma: PrismaService) {}

  // ─── Heartbeat (self-tracking, no scope needed) ────────────────────────

  async heartbeat(adminId: string) {
    const now = new Date();
    const today = utcDateOnly(now);
    const existing = await this.prisma.adminDailyActivity.findUnique({
      where: { adminId_date: { adminId, date: today } },
    });

    if (!existing) {
      await this.prisma.adminDailyActivity.create({
        data: { adminId, date: today, activeMinutes: HEARTBEAT_INTERVAL_MIN, firstSeenAt: now, lastSeenAt: now },
      });
    } else {
      const gapMin = existing.lastSeenAt
        ? Math.min(MAX_GAP_MIN, Math.max(0, (now.getTime() - existing.lastSeenAt.getTime()) / 60000))
        : HEARTBEAT_INTERVAL_MIN;
      await this.prisma.adminDailyActivity.update({
        where: { id: existing.id },
        data: { activeMinutes: { increment: Math.round(gapMin) }, lastSeenAt: now },
      });
    }
    return { data: { ok: true } };
  }

  // ─── My own access level (frontend uses this to gate the Workforce nav) ──

  async getMyAccess(adminId: string, adminRole: string) {
    if (adminRole === 'SUPER_ADMIN') {
      return { data: { isSuperAdmin: true, canView: true, canEdit: true } };
    }
    const grant = await this.prisma.hRAccessGrant.findUnique({ where: { adminId } });
    return {
      data: {
        isSuperAdmin: false,
        canView: grant?.canView ?? false,
        canEdit: grant?.canEdit ?? false,
      },
    };
  }

  // ─── Scoped admin roster ──────────────────────────────────────────────
  // Same "everyone except SUPER_ADMIN" base set as admin.service.ts's
  // getMembersReport, further narrowed to one team when the caller's scope
  // is team-restricted (a granted *_MANAGER).

  private async getScopedAdmins(scope: HrScope) {
    const where: any = { adminRole: { notIn: ['SUPER_ADMIN'] as any } };
    if (!scope.allAdmins) where.teamType = scope.teamType;
    return this.prisma.admin.findMany({
      where,
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, avatarUrl: true, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  private async assertInScope(scope: HrScope, adminId: string) {
    const admin = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!admin) throw new NotFoundException('Admin not found');
    if (admin.adminRole === 'SUPER_ADMIN') throw new ForbiddenException('Not applicable to Super Admin');
    if (!scope.allAdmins && admin.teamType !== scope.teamType) {
      throw new ForbiddenException('Outside your team scope');
    }
    return admin;
  }

  // ─── Attendance: single day, all scoped admins ────────────────────────

  async getDailyAttendance(scope: HrScope, dateStr?: string) {
    const date = utcDateOnly(dateStr ? new Date(dateStr) : new Date());
    const admins = await this.getScopedAdmins(scope);
    const rows = await this.prisma.adminDailyActivity.findMany({
      where: { date, adminId: { in: admins.map((a) => a.id) } },
    });
    const byAdmin = new Map(rows.map((r) => [r.adminId, r]));
    const data = admins.map((a) => {
      const row = byAdmin.get(a.id);
      return {
        ...a,
        date: date.toISOString().slice(0, 10),
        present: !!row,
        activeMinutes: row?.activeMinutes ?? 0,
        firstSeenAt: row?.firstSeenAt ?? null,
        lastSeenAt: row?.lastSeenAt ?? null,
      };
    });
    return { data };
  }

  // ─── Attendance: monthly rollup, all scoped admins ────────────────────

  async getMonthlyAttendance(scope: HrScope, month: number, year: number) {
    const { from, to } = monthRange(month, year);
    const admins = await this.getScopedAdmins(scope);
    const rows = await this.prisma.adminDailyActivity.findMany({
      where: { date: { gte: from, lte: to }, adminId: { in: admins.map((a) => a.id) } },
    });
    const byAdmin = new Map<string, { daysPresent: number; totalMinutes: number }>();
    for (const r of rows) {
      const agg = byAdmin.get(r.adminId) ?? { daysPresent: 0, totalMinutes: 0 };
      agg.daysPresent += 1;
      agg.totalMinutes += r.activeMinutes;
      byAdmin.set(r.adminId, agg);
    }
    const daysInMonth = to.getUTCDate();
    const data = admins.map((a) => {
      const agg = byAdmin.get(a.id) ?? { daysPresent: 0, totalMinutes: 0 };
      return {
        ...a,
        month, year, daysInMonth,
        daysPresent: agg.daysPresent,
        totalHours: Math.round((agg.totalMinutes / 60) * 10) / 10,
        avgHoursPerPresentDay: agg.daysPresent > 0
          ? Math.round((agg.totalMinutes / agg.daysPresent / 60) * 10) / 10
          : 0,
        attendanceRate: daysInMonth > 0 ? Math.round((agg.daysPresent / daysInMonth) * 100) : 0,
      };
    });
    return { data };
  }

  // ─── Attendance: one admin's daily calendar for a month ───────────────

  async getMemberAttendanceDetail(scope: HrScope, adminId: string, month: number, year: number) {
    const admin = await this.assertInScope(scope, adminId);
    const { from, to } = monthRange(month, year);
    const rows = await this.prisma.adminDailyActivity.findMany({
      where: { adminId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
    return {
      data: {
        admin: { id: admin.id, name: admin.name, adminRole: admin.adminRole, teamType: admin.teamType, avatarUrl: admin.avatarUrl },
        month, year,
        days: rows.map((r) => ({
          date: r.date.toISOString().slice(0, 10),
          activeMinutes: r.activeMinutes,
          hours: Math.round((r.activeMinutes / 60) * 10) / 10,
          firstSeenAt: r.firstSeenAt,
          lastSeenAt: r.lastSeenAt,
        })),
      },
    };
  }

  // ─── Salary / payroll ───────────────────────────────────────────────

  async getSalary(scope: HrScope, month: number, year: number) {
    const admins = await this.getScopedAdmins(scope);
    const records = await this.prisma.adminSalaryRecord.findMany({
      where: { month, year, adminId: { in: admins.map((a) => a.id) } },
    });
    const byAdmin = new Map(records.map((r) => [r.adminId, r]));
    const data = admins.map((a) => {
      const r = byAdmin.get(a.id);
      return {
        ...a,
        month, year,
        recordId: r?.id ?? null,
        amount: r ? Number(r.amount) : 0,
        status: r?.status ?? 'PENDING',
        paidAt: r?.paidAt ?? null,
        notes: r?.notes ?? null,
      };
    });
    return { data, canEdit: scope.canEdit };
  }

  async upsertSalary(
    scope: HrScope,
    recorderId: string,
    adminId: string,
    dto: { month: number; year: number; amount: number; status?: 'PENDING' | 'PAID'; notes?: string },
  ) {
    if (!scope.canEdit) throw new ForbiddenException('You have view-only workforce access');
    await this.assertInScope(scope, adminId);
    if (dto.amount < 0) throw new BadRequestException('Amount cannot be negative');

    const status = dto.status ?? 'PENDING';
    const record = await this.prisma.adminSalaryRecord.upsert({
      where: { adminId_month_year: { adminId, month: dto.month, year: dto.year } },
      create: {
        adminId, month: dto.month, year: dto.year, amount: dto.amount, status,
        notes: dto.notes ?? null, recordedById: recorderId,
        paidAt: status === 'PAID' ? new Date() : null,
      },
      update: {
        amount: dto.amount, status, notes: dto.notes ?? null, recordedById: recorderId,
        paidAt: status === 'PAID' ? new Date() : null,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId: recorderId, action: 'SALARY_RECORD_UPSERT', entityType: 'admin_salary', entityId: adminId,
        metadata: { month: dto.month, year: dto.year, amount: dto.amount, status },
      },
    }).catch(() => {});

    return { data: { ...record, amount: Number(record.amount) } };
  }

  // ─── Access grants (SUPER_ADMIN only — enforced by @Roles in the controller) ──

  async listAccessGrants() {
    const admins = await this.prisma.admin.findMany({
      where: { adminRole: { notIn: ['SUPER_ADMIN'] as any } },
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, avatarUrl: true, isActive: true },
      orderBy: { name: 'asc' },
    });
    const grants = await this.prisma.hRAccessGrant.findMany();
    const byAdmin = new Map(grants.map((g) => [g.adminId, g]));
    const data = admins.map((a) => {
      const g = byAdmin.get(a.id);
      return { ...a, canView: g?.canView ?? false, canEdit: g?.canEdit ?? false, grantedAt: g?.grantedAt ?? null };
    });
    return { data };
  }

  async upsertAccessGrant(granterId: string, adminId: string, dto: { canView: boolean; canEdit: boolean }) {
    const target = await this.prisma.admin.findUnique({ where: { id: adminId } });
    if (!target) throw new NotFoundException('Admin not found');
    if (target.adminRole === 'SUPER_ADMIN') throw new BadRequestException('Super Admin already has full access');

    // canEdit implies canView — an edit-only grant with no view makes no sense.
    const canView = dto.canView || dto.canEdit;
    const canEdit = dto.canEdit;

    const grant = await this.prisma.hRAccessGrant.upsert({
      where: { adminId },
      create: { adminId, canView, canEdit, grantedById: granterId },
      update: { canView, canEdit, grantedById: granterId },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId: granterId, action: 'HR_ACCESS_GRANT_UPDATE', entityType: 'admin', entityId: adminId,
        metadata: { name: target.name, canView, canEdit },
      },
    }).catch(() => {});

    return { data: grant };
  }
}
