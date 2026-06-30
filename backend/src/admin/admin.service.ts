// src/admin/admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // ─── Stats ────────────────────────────────────────────────────────────────

  async getStats() {
    const [totalArticles, publishedArticles, totalUsers, breakingCount] = await Promise.all([
      this.prisma.article.count({ where: { status: { not: 'DELETED' } } }),
      this.prisma.article.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.user.count(),
      this.prisma.article.count({ where: { status: 'PUBLISHED', isBreaking: true } }),
    ]);

    return {
      data: {
        totalArticles,
        publishedArticles,
        totalUsers,
        breakingCount,
      },
    };
  }

  // ─── Users list ───────────────────────────────────────────────────────────

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          phone: true,
          name: true,
          role: true,
          preferredLang: true,
          articleReadCount: true,
          isBanned: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        hasMore: skip + limit < total,
      },
    };
  }

  // ─── Ban / Unban user ────────────────────────────────────────────────────

  async banUser(id: string, adminId: string) {
    return this.setBanStatus(id, adminId, true);
  }

  async unbanUser(id: string, adminId: string) {
    return this.setBanStatus(id, adminId, false);
  }

  private async setBanStatus(id: string, adminId: string, isBanned: boolean) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const updated = await this.prisma.user.update({
      where: { id },
      data: { isBanned },
      select: { id: true, phone: true, name: true, isBanned: true },
    });

    await this.prisma.auditLog.create({
      data: {
        adminId,
        action: isBanned ? 'BAN_USER' : 'UNBAN_USER',
        entityType: 'user',
        entityId: id,
      },
    });

    return { data: updated };
  }

  // ─── Audit logs ───────────────────────────────────────────────────────────

  async getAuditLogs(page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { admin: { select: { id: true, name: true, email: true } } },
      }),
      this.prisma.auditLog.count(),
    ]);

    // Flatten adminName for frontend
    const data = logs.map(({ admin, ...log }) => ({
      ...log,
      adminName: admin?.name ?? null,
    }));

    return {
      data,
      meta: { total, page, limit, hasMore: skip + limit < total },
    };
  }

  // ─── Admin accounts list ──────────────────────────────────────────────────

  async getAdminAccounts() {
    const admins = await this.prisma.admin.findMany({
      select: { id: true, name: true, email: true, adminRole: true },
      orderBy: { name: 'asc' },
    });
    return { data: admins };
  }

  // ─── Settings ─────────────────────────────────────────────────────────────

  private settings = {
    siteName: 'Agnisiragu',
    adMobAndroidAppId: '',
    adMobIosAppId: '',
    msg91SenderId: process.env.MSG91_SENDER_ID ?? '',
    msg91AuthKey: process.env.MSG91_AUTH_KEY ?? '',
  };

  async getSettings() {
    return { data: this.settings };
  }

  async updateSettings(payload: Partial<typeof this.settings>) {
    this.settings = { ...this.settings, ...payload };
    return { data: this.settings };
  }
}
