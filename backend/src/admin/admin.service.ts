// src/admin/admin.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function startOfDay(d: Date): Date {
  const c = new Date(d); c.setHours(0, 0, 0, 0); return c;
}
function subDays(d: Date, n: number): Date {
  const c = new Date(d); c.setDate(c.getDate() - n); return c;
}
function subMonths(d: Date, n: number): Date {
  const c = new Date(d); c.setMonth(c.getMonth() - n); return c;
}
function subYears(d: Date, n: number): Date {
  const c = new Date(d); c.setFullYear(c.getFullYear() - n); return c;
}
function formatDay(d: Date): string { return d.toISOString().slice(0, 10); }
function dayLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}
function startOfWeek(d: Date): Date {
  const c = new Date(d);
  const day = c.getDay();
  c.setDate(c.getDate() - day + (day === 0 ? -6 : 1));
  c.setHours(0, 0, 0, 0);
  return c;
}

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats() {
    const todayStart = startOfDay(new Date());
    const [totalArticles, publishedArticles, totalUsers, breakingCount, todayArticles, todayUsers] =
      await Promise.all([
        this.prisma.article.count({ where: { status: { not: 'DELETED' } } }),
        this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
        this.prisma.user.count(),
        this.prisma.article.count({ where: { status: 'PUBLISHED', isBreaking: true } }),
        this.prisma.article.count({ where: { createdAt: { gte: todayStart } } }),
        this.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      ]);
    return { data: { totalArticles, publishedArticles, totalUsers, breakingCount, todayArticles, todayUsers } };
  }

  // ─── Weekly Trend (Dashboard chart) ──────────────────────────────────────

  async getWeeklyTrend() {
    const now = new Date();
    const days = Array.from({ length: 7 }, (_, i) => subDays(startOfDay(now), 6 - i));
    const from = days[0];

    type Row = { day: string; count: bigint };
    const rows = await this.prisma.$queryRaw<Row[]>`
      SELECT DATE("createdAt") AS day, COUNT(*)::bigint AS count
      FROM "Article"
      WHERE "createdAt" >= ${from}
      GROUP BY DATE("createdAt")
      ORDER BY DATE("createdAt")
    `;

    const countMap = new Map<string, number>(
      rows.map((r) => [String(r.day).slice(0, 10), Number(r.count)]),
    );
    return {
      data: days.map((d) => ({ day: dayLabel(d), count: countMap.get(formatDay(d)) ?? 0 })),
    };
  }

  // ─── Reports (period-based trend) ────────────────────────────────────────

  async getReports(period: string) {
    const now = new Date();
    type Row = { period: Date; count: bigint };

    const mergeInto = (rows: Row[], slots: { label: string; key: string }[]) => {
      const map = new Map<string, number>();
      for (const r of rows) map.set(formatDay(new Date(r.period)), Number(r.count));
      return slots.map((s) => ({ label: s.label, count: map.get(s.key) ?? 0 }));
    };

    let articleRows: Row[];
    let userRows: Row[];
    let slots: { label: string; key: string }[];

    if (period === 'daily') {
      const from = subDays(startOfDay(now), 6);
      slots = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(startOfDay(now), 6 - i);
        return { label: d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' }), key: formatDay(d) };
      });
      [articleRows, userRows] = await Promise.all([
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE("publishedAt") AS period, COUNT(*)::bigint AS count
          FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE("createdAt") AS period, COUNT(*)::bigint AS count
          FROM "User" WHERE "createdAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
      ]);

    } else if (period === 'weekly') {
      const from = subDays(now, 55);
      slots = Array.from({ length: 8 }, (_, i) => {
        const d = subDays(now, (7 - i) * 7);
        return { label: `W${i + 1}`, key: formatDay(startOfWeek(d)) };
      });
      [articleRows, userRows] = await Promise.all([
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('week', "publishedAt") AS period, COUNT(*)::bigint AS count
          FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('week', "createdAt") AS period, COUNT(*)::bigint AS count
          FROM "User" WHERE "createdAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
      ]);

    } else if (period === 'monthly') {
      const from = new Date(now.getFullYear(), now.getMonth() - 11, 1);
      slots = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(now, 11 - i);
        return {
          label: d.toLocaleDateString('en-US', { month: 'short' }),
          key: formatDay(new Date(d.getFullYear(), d.getMonth(), 1)),
        };
      });
      [articleRows, userRows] = await Promise.all([
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('month', "publishedAt") AS period, COUNT(*)::bigint AS count
          FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('month', "createdAt") AS period, COUNT(*)::bigint AS count
          FROM "User" WHERE "createdAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
      ]);

    } else { // yearly
      const from = new Date(now.getFullYear() - 4, 0, 1);
      slots = Array.from({ length: 5 }, (_, i) => {
        const yr = now.getFullYear() - 4 + i;
        return { label: String(yr), key: formatDay(new Date(yr, 0, 1)) };
      });
      [articleRows, userRows] = await Promise.all([
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('year', "publishedAt") AS period, COUNT(*)::bigint AS count
          FROM "Article" WHERE status = 'PUBLISHED' AND "publishedAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
        this.prisma.$queryRaw<Row[]>`
          SELECT DATE_TRUNC('year', "createdAt") AS period, COUNT(*)::bigint AS count
          FROM "User" WHERE "createdAt" >= ${from}
          GROUP BY 1 ORDER BY 1`,
      ]);
    }

    const articleBySlot = mergeInto(articleRows, slots);
    const userBySlot    = mergeInto(userRows, slots);
    const trend = slots.map((s, i) => ({
      label: s.label,
      articles: articleBySlot[i].count,
      users: userBySlot[i].count,
    }));

    const [totalArticles, totalUsers, totalReads] = await Promise.all([
      this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.user.count(),
      this.prisma.articleRead.count(),
    ]);
    const daysInPeriod = period === 'daily' ? 7 : period === 'weekly' ? 56 : period === 'monthly' ? 365 : 1825;
    const avgPerDay = totalArticles > 0 ? Math.round((totalArticles / daysInPeriod) * 10) / 10 : 0;

    return { data: { trend, summary: { totalArticles, totalUsers, totalReads, avgPerDay } } };
  }

  // ─── Category breakdown ───────────────────────────────────────────────────

  async getCategoryReport() {
    const rows = await this.prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT c."nameEn" AS name, COUNT(a.id)::bigint AS count
      FROM "Category" c
      LEFT JOIN "Article" a ON a."categoryId" = c.id AND a.status = 'PUBLISHED'
      GROUP BY c."nameEn"
      ORDER BY count DESC
    `;
    return { data: rows.map((r) => ({ name: r.name, count: Number(r.count) })) };
  }

  // ─── Users list ───────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        select: { id: true, phone: true, name: true, role: true,
          preferredLang: true, articleReadCount: true, isBanned: true, createdAt: true },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data: users, meta: { total, page, limit, hasMore: skip + limit < total } };
  }

  // ─── Ban / Unban user ────────────────────────────────────────────────────

  async banUser(id: string, adminId: string)   { return this.setBanStatus(id, adminId, true);  }
  async unbanUser(id: string, adminId: string) { return this.setBanStatus(id, adminId, false); }

  private async setBanStatus(id: string, adminId: string, isBanned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    const updated = await this.prisma.user.update({
      where: { id }, data: { isBanned },
      select: { id: true, phone: true, name: true, isBanned: true },
    });
    await this.prisma.auditLog.create({
      data: { adminId, action: isBanned ? 'BAN_USER' : 'UNBAN_USER', entityType: 'user', entityId: id },
    });
    return { data: updated };
  }

  // ─── Audit logs ───────────────────────────────────────────────────────────

  async getAuditLogs(options: {
    page?: number; limit?: number;
    action?: string; adminId?: string;
    dateFrom?: string; dateTo?: string;
  }) {
    const { page = 1, limit = 50, action, adminId, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action)  where.action  = { contains: action, mode: 'insensitive' };
    if (adminId) where.adminId = adminId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); where.createdAt.lte = end; }
    }
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    const data = logs.map(({ admin, ...log }) => ({ ...log, adminName: admin?.name ?? null }));
    return { data, meta: { total, page, limit, hasMore: skip + limit < total } };
  }

  // ─── Admin accounts list ──────────────────────────────────────────────────

  async getAdminAccounts() {
    const admins = await this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, adminRole: true,
        isActive: true, phone: true, teamType: true, lastLoginAt: true, createdAt: true },
      orderBy: { name: 'asc' },
    });
    return { data: admins };
  }

  // ─── Create admin account ─────────────────────────────────────────────────

  async createAdminAccount(dto: {
    name: string; email: string; password: string; adminRole: string; team?: string;
  }) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.admin.create({
      data: {
        name: dto.name, email: dto.email, passwordHash,
        adminRole: dto.adminRole as any, teamType: dto.team ?? null, isActive: true,
      },
      select: { id: true, name: true, email: true, adminRole: true, isActive: true, teamType: true, createdAt: true },
    });
    return { data: admin };
  }

  // ─── Update admin account ─────────────────────────────────────────────────

  async updateAdminAccount(id: string, dto: {
    name?: string; adminRole?: string; password?: string; isActive?: boolean;
  }) {
    const existing = await this.prisma.admin.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Admin not found');
    const updateData: any = {};
    if (dto.name      !== undefined) updateData.name      = dto.name;
    if (dto.adminRole !== undefined) updateData.adminRole = dto.adminRole;
    if (dto.isActive  !== undefined) updateData.isActive  = dto.isActive;
    if (dto.password)                updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.admin.update({
      where: { id }, data: updateData,
      select: { id: true, name: true, email: true, adminRole: true,
        isActive: true, teamType: true, lastLoginAt: true },
    });
    return { data: updated };
  }

  // ─── Delete admin account ─────────────────────────────────────────────────

  async deleteAdminAccount(id: string) {
    const existing = await this.prisma.admin.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Admin not found');
    const articleCount = await this.prisma.article.count({ where: { adminId: id } });
    if (articleCount > 0) {
      throw new BadRequestException(
        `Cannot delete — this admin has ${articleCount} article(s). Deactivate instead.`,
      );
    }
    await this.prisma.auditLog.updateMany({ where: { adminId: id }, data: { adminId: null } });
    await this.prisma.mediaFile.updateMany({ where: { adminId: id }, data: { adminId: null } });
    await this.prisma.admin.delete({ where: { id } });
    return { data: { message: 'Admin deleted' } };
  }

  // ─── App Config ───────────────────────────────────────────────────────────

  async getAppConfig() {
    const rows = await this.prisma.appConfig.findMany();
    const config: Record<string, any> = {};
    for (const row of rows) config[row.key] = row.value;
    return { data: config };
  }

  async saveAppConfig(payload: Record<string, any>) {
    for (const [key, value] of Object.entries(payload)) {
      await this.prisma.appConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
    }
    return this.getAppConfig();
  }

  // ─── Settings (legacy in-memory) ─────────────────────────────────────────

  private settings = {
    siteName: 'Agnisiragu',
    adMobAndroidAppId: '',
    adMobIosAppId: '',
    msg91SenderId: process.env.MSG91_SENDER_ID ?? '',
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
  };

  async getSettings()                                    { return { data: this.settings }; }
  async updateSettings(payload: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...payload };
    return { data: this.settings };
  }
}
