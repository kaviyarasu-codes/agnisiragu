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
    action?: string; adminId?: string; team?: string;
    dateFrom?: string; dateTo?: string;
  }) {
    const { page = 1, limit = 50, action, adminId, team, dateFrom, dateTo } = options;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (action)  where.action  = { contains: action, mode: 'insensitive' };
    if (adminId) where.adminId = adminId;
    if (team)    where.admin   = { teamType: team };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo)   { const end = new Date(dateTo); end.setHours(23, 59, 59, 999); where.createdAt.lte = end; }
    }
    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where, skip, take: limit, orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true, teamType: true } } },
      }),
      this.prisma.auditLog.count({ where }),
    ]);
    const data = logs.map(({ admin, ...log }) => ({
      ...log,
      adminName: admin?.name ?? null,
      adminTeam: admin?.teamType ?? null,
    }));
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
    name: string; email: string; password: string; adminRole: string; team?: string; phone?: string;
  }) {
    const existing = await this.prisma.admin.findUnique({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Email already registered');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const admin = await this.prisma.admin.create({
      data: {
        name: dto.name, email: dto.email, passwordHash,
        adminRole: dto.adminRole as any, teamType: dto.team ?? null,
        phone: dto.phone ?? null, isActive: true,
      },
      select: { id: true, name: true, email: true, adminRole: true, isActive: true, teamType: true, createdAt: true },
    });
    await this.prisma.auditLog.create({
      data: { action: 'ADMIN_CREATE', entityType: 'admin', entityId: admin.id,
        metadata: { name: admin.name, email: admin.email, role: admin.adminRole } },
    }).catch(() => {});
    return { data: admin };
  }

  // ─── Update admin account ─────────────────────────────────────────────────

  async updateAdminAccount(id: string, dto: {
    name?: string; adminRole?: string; password?: string; phone?: string; isActive?: boolean;
  }) {
    const existing = await this.prisma.admin.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Admin not found');
    const updateData: any = {};
    if (dto.name      !== undefined) updateData.name      = dto.name;
    if (dto.adminRole !== undefined) updateData.adminRole = dto.adminRole;
    if (dto.phone     !== undefined) updateData.phone     = dto.phone || null;
    if (dto.isActive  !== undefined) updateData.isActive  = dto.isActive;
    if (dto.password && dto.password.trim() !== '') updateData.passwordHash = await bcrypt.hash(dto.password, 10);
    const updated = await this.prisma.admin.update({
      where: { id }, data: updateData,
      select: { id: true, name: true, email: true, adminRole: true,
        isActive: true, teamType: true, lastLoginAt: true },
    });
    await this.prisma.auditLog.create({
      data: { action: 'ADMIN_UPDATE', entityType: 'admin', entityId: id,
        metadata: { name: updated.name, changes: Object.keys(updateData) } },
    }).catch(() => {});
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
    const name = existing.name;
    await this.prisma.admin.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { action: 'ADMIN_DELETE', entityType: 'admin', metadata: { name, email: existing.email } },
    }).catch(() => {});
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

  // ─── Reports: all members summary ─────────────────────────────────────────

  async getMembersReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    // All admins (non-system)
    const admins = await this.prisma.admin.findMany({
      where: { adminRole: { notIn: ['SUPER_ADMIN', 'ADMIN'] as any } },
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, lastLoginAt: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    // Article counts per admin in date range
    const articleRows = await this.prisma.$queryRaw<{ adminId: string; published: bigint; draft: bigint; total: bigint }[]>`
      SELECT
        "adminId",
        COUNT(*) FILTER (WHERE status = 'PUBLISHED') ::bigint AS published,
        COUNT(*) FILTER (WHERE status = 'DRAFT')     ::bigint AS draft,
        COUNT(*)                                      ::bigint AS total
      FROM "Article"
      WHERE "createdAt" BETWEEN ${from} AND ${to}
      GROUP BY "adminId"
    `;

    // Edit counts (ARTICLE_UPDATE audit logs) per admin in date range
    const editRows = await this.prisma.$queryRaw<{ adminId: string; edits: bigint }[]>`
      SELECT "adminId", COUNT(*)::bigint AS edits
      FROM "AuditLog"
      WHERE action = 'ARTICLE_UPDATE'
        AND "createdAt" BETWEEN ${from} AND ${to}
        AND "adminId" IS NOT NULL
      GROUP BY "adminId"
    `;

    // Login counts per admin in date range
    const loginRows = await this.prisma.$queryRaw<{ adminId: string; logins: bigint }[]>`
      SELECT "adminId", COUNT(*)::bigint AS logins
      FROM "AuditLog"
      WHERE action = 'ADMIN_LOGIN'
        AND "createdAt" BETWEEN ${from} AND ${to}
        AND "adminId" IS NOT NULL
      GROUP BY "adminId"
    `;

    const articleMap = new Map(articleRows.map(r => [r.adminId, r]));
    const editMap    = new Map(editRows.map(r    => [r.adminId, Number(r.edits)]));
    const loginMap   = new Map(loginRows.map(r   => [r.adminId, Number(r.logins)]));

    const members = admins.map(a => {
      const arts      = articleMap.get(a.id);
      const published = arts ? Number(arts.published) : 0;
      const drafts    = arts ? Number(arts.draft)     : 0;
      const edits     = editMap.get(a.id)    ?? 0;
      const logins    = loginMap.get(a.id)   ?? 0;
      // Performance score: weighted formula
      const score = Math.min(100, Math.round((published * 4 + edits * 1.5 + logins * 0.5)));
      return { ...a, published, drafts, edits, logins, score };
    });

    return { data: members };
  }

  // ─── Reports: team summary (group members by teamType) ───────────────────

  async getTeamReport(dateFrom?: string, dateTo?: string) {
    const { data: members } = await this.getMembersReport(dateFrom, dateTo);

    const teamMap = new Map<string, {
      teamType: string; memberCount: number; published: number;
      drafts: number; edits: number; logins: number; score: number;
      members: typeof members;
    }>();

    for (const m of members) {
      const key = m.teamType ?? 'UNASSIGNED';
      if (!teamMap.has(key)) {
        teamMap.set(key, { teamType: key, memberCount: 0, published: 0, drafts: 0, edits: 0, logins: 0, score: 0, members: [] });
      }
      const t = teamMap.get(key)!;
      t.memberCount++;
      t.published += m.published;
      t.drafts    += m.drafts;
      t.edits     += m.edits;
      t.logins    += m.logins;
      t.members.push(m);
    }

    const teams = Array.from(teamMap.values()).map(t => ({
      ...t,
      score: t.memberCount > 0 ? Math.round(t.published / t.memberCount * 4 + t.edits / t.memberCount) : 0,
    }));

    return { data: teams };
  }

  // ─── Reports: individual member detail ───────────────────────────────────

  async getMemberDetail(adminId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, lastLoginAt: true, createdAt: true, isActive: true },
    });
    if (!admin) throw new Error('Admin not found');

    const [articles, auditLogs] = await Promise.all([
      this.prisma.article.findMany({
        where: { adminId, createdAt: { gte: from, lte: to } },
        select: { id: true, titleEn: true, status: true, publishedAt: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.auditLog.findMany({
        where: { adminId, createdAt: { gte: from, lte: to } },
        select: { id: true, action: true, entityType: true, createdAt: true, ip: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    const published = articles.filter(a => a.status === 'PUBLISHED').length;
    const drafts    = articles.filter(a => a.status === 'DRAFT').length;
    const edits     = auditLogs.filter(l => l.action === 'ARTICLE_UPDATE').length;
    const logins    = auditLogs.filter(l => l.action === 'ADMIN_LOGIN').length;
    const score     = Math.min(100, Math.round(published * 4 + edits * 1.5 + logins * 0.5));

    // Daily activity (logins per day)
    const loginDays = new Map<string, number>();
    for (const l of auditLogs.filter(x => x.action === 'ADMIN_LOGIN')) {
      const day = l.createdAt.toISOString().slice(0, 10);
      loginDays.set(day, (loginDays.get(day) ?? 0) + 1);
    }
    const loginActivity = Array.from(loginDays.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return { data: { admin, metrics: { published, drafts, edits, logins, score }, articles, loginActivity } };
  }

  // ─── Reports: reporter app users summary ─────────────────────────────────

  async getReporterReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const [total, verified, active, newInRange] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isVerified: true } }).catch(() => 0),
      this.prisma.user.count({ where: { isBanned: false } }),
      this.prisma.user.count({ where: { createdAt: { gte: from, lte: to } } }),
    ]);

    // Top reporters by article submissions (reporter_app submissions via Article model)
    const topReporters = await this.prisma.$queryRaw<{ name: string; count: bigint }[]>`
      SELECT u.name, COUNT(a.id)::bigint AS count
      FROM "User" u
      LEFT JOIN "Article" a ON a."byline" ILIKE '%' || u.name || '%'
        AND a."createdAt" BETWEEN ${from} AND ${to}
      GROUP BY u.id, u.name
      ORDER BY count DESC
      LIMIT 10
    `.catch(() => [] as any[]);

    return {
      data: {
        summary: { total, verified, active, newInRange },
        topReporters: topReporters.map((r: any) => ({ name: r.name, count: Number(r.count) })),
      },
    };
  }

  // ─── Reports: advertisement team ─────────────────────────────────────────

  async getAdReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const [ads, activeAds] = await Promise.all([
      this.prisma.localAd.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: {
          id: true, title: true, adType: true, status: true, placement: true,
          clickCount: true, impressions: true, startDate: true, endDate: true,
          admin: { select: { name: true } },
        },
        orderBy: { impressions: 'desc' },
      }),
      this.prisma.localAd.count({ where: { status: 'ACTIVE' } }),
    ]);

    const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0);
    const totalClicks      = ads.reduce((s, a) => s + (a.clickCount ?? 0), 0);
    const avgCtr           = totalImpressions > 0
      ? Math.round((totalClicks / totalImpressions) * 1000) / 10
      : 0;

    return {
      data: {
        summary: { total: ads.length, activeAds, totalImpressions, totalClicks, avgCtr },
        ads,
      },
    };
  }
}

  // ─── Reports: all members summary ─────────────────────────────────────────

  async getMembersReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const admins = await this.prisma.admin.findMany({
      where: { adminRole: { notIn: ['SUPER_ADMIN', 'ADMIN'] as any } },
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, lastLoginAt: true, isActive: true, createdAt: true },
      orderBy: { name: 'asc' },
    });

    const articleRows = await this.prisma.$queryRaw<{ adminId: string; published: bigint; draft: bigint }[]>`
      SELECT "adminId",
        COUNT(*) FILTER (WHERE status = 'PUBLISHED')::bigint AS published,
        COUNT(*) FILTER (WHERE status = 'DRAFT')    ::bigint AS draft
      FROM "Article"
      WHERE "createdAt" BETWEEN ${from} AND ${to}
      GROUP BY "adminId"
    `;
    const editRows = await this.prisma.$queryRaw<{ adminId: string; edits: bigint }[]>`
      SELECT "adminId", COUNT(*)::bigint AS edits
      FROM "AuditLog"
      WHERE action = 'ARTICLE_UPDATE' AND "createdAt" BETWEEN ${from} AND ${to} AND "adminId" IS NOT NULL
      GROUP BY "adminId"
    `;
    const loginRows = await this.prisma.$queryRaw<{ adminId: string; logins: bigint }[]>`
      SELECT "adminId", COUNT(*)::bigint AS logins
      FROM "AuditLog"
      WHERE action = 'ADMIN_LOGIN' AND "createdAt" BETWEEN ${from} AND ${to} AND "adminId" IS NOT NULL
      GROUP BY "adminId"
    `;

    const articleMap = new Map(articleRows.map(r => [r.adminId, r]));
    const editMap    = new Map(editRows.map(r    => [r.adminId, Number(r.edits)]));
    const loginMap   = new Map(loginRows.map(r   => [r.adminId, Number(r.logins)]));

    const members = admins.map(a => {
      const arts      = articleMap.get(a.id);
      const published = arts ? Number(arts.published) : 0;
      const drafts    = arts ? Number(arts.draft)     : 0;
      const edits     = editMap.get(a.id)  ?? 0;
      const logins    = loginMap.get(a.id) ?? 0;
      const score     = Math.min(100, Math.round(published * 4 + edits * 1.5 + logins * 0.5));
      return { ...a, published, drafts, edits, logins, score };
    });

    return { data: members };
  }

  // ─── Reports: team summary ────────────────────────────────────────────────

  async getTeamReport(dateFrom?: string, dateTo?: string) {
    const { data: members } = await this.getMembersReport(dateFrom, dateTo);
    const teamMap = new Map<string, any>();

    for (const m of members) {
      const key = m.teamType ?? 'UNASSIGNED';
      if (!teamMap.has(key)) teamMap.set(key, { teamType: key, memberCount: 0, published: 0, drafts: 0, edits: 0, logins: 0, members: [] });
      const t = teamMap.get(key)!;
      t.memberCount++; t.published += m.published; t.drafts += m.drafts;
      t.edits += m.edits; t.logins += m.logins; t.members.push(m);
    }

    const teams = Array.from(teamMap.values()).map(t => ({
      ...t,
      score: t.memberCount > 0 ? Math.min(100, Math.round((t.published / t.memberCount) * 4 + (t.edits / t.memberCount) * 1.5)) : 0,
    }));

    return { data: teams };
  }

  // ─── Reports: individual member detail ───────────────────────────────────

  async getMemberDetail(adminId: string, dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const admin = await this.prisma.admin.findUnique({
      where: { id: adminId },
      select: { id: true, name: true, email: true, adminRole: true, teamType: true, lastLoginAt: true, createdAt: true, isActive: true },
    });
    if (!admin) throw new Error('Admin not found');

    const [articles, auditLogs] = await Promise.all([
      this.prisma.article.findMany({
        where: { adminId, createdAt: { gte: from, lte: to } },
        select: { id: true, titleEn: true, status: true, publishedAt: true, createdAt: true },
        orderBy: { createdAt: 'desc' }, take: 50,
      }),
      this.prisma.auditLog.findMany({
        where: { adminId, createdAt: { gte: from, lte: to } },
        select: { id: true, action: true, createdAt: true, ip: true },
        orderBy: { createdAt: 'desc' }, take: 200,
      }),
    ]);

    const published = articles.filter(a => a.status === 'PUBLISHED').length;
    const drafts    = articles.filter(a => a.status === 'DRAFT').length;
    const edits     = auditLogs.filter(l => l.action === 'ARTICLE_UPDATE').length;
    const logins    = auditLogs.filter(l => l.action === 'ADMIN_LOGIN').length;
    const score     = Math.min(100, Math.round(published * 4 + edits * 1.5 + logins * 0.5));

    const loginDays = new Map<string, number>();
    for (const l of auditLogs.filter(x => x.action === 'ADMIN_LOGIN')) {
      const day = new Date(l.createdAt).toISOString().slice(0, 10);
      loginDays.set(day, (loginDays.get(day) ?? 0) + 1);
    }
    const loginActivity = Array.from(loginDays.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, count]) => ({ date, count }));

    return { data: { admin, metrics: { published, drafts, edits, logins, score }, articles, loginActivity } };
  }

  // ─── Reports: ad team ────────────────────────────────────────────────────

  async getAdReport(dateFrom?: string, dateTo?: string) {
    const from = dateFrom ? new Date(dateFrom) : new Date('2020-01-01');
    const to   = dateTo   ? new Date(dateTo)   : new Date();

    const [ads, activeAds] = await Promise.all([
      this.prisma.localAd.findMany({
        where: { createdAt: { gte: from, lte: to } },
        select: { id: true, title: true, adType: true, status: true, placement: true,
          clickCount: true, impressions: true, startDate: true, endDate: true,
          admin: { select: { name: true } } },
        orderBy: { impressions: 'desc' },
      }),
      this.prisma.localAd.count({ where: { status: 'ACTIVE' } }),
    ]);

    const totalImpressions = ads.reduce((s, a) => s + (a.impressions ?? 0), 0);
    const totalClicks      = ads.reduce((s, a) => s + (a.clickCount  ?? 0), 0);
    const avgCtr = totalImpressions > 0 ? Math.round((totalClicks / totalImpressions) * 1000) / 10 : 0;

    return { data: { summary: { total: ads.length, activeAds, totalImpressions, totalClicks, avgCtr }, ads } };
  }
}
