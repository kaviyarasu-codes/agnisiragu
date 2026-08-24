// src/news/news.service.ts
import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleListQueryDto,
  SearchArticleDto,
} from './news.dto';

@Injectable()
export class NewsService {
  private readonly logger = new Logger(NewsService.name);

  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
    private notifications: NotificationsService,
  ) {}

  // Sends a push alert to all registered devices when a PUBLISHED article is
  // (or becomes) breaking news — gated by the admin's "Breaking News Alerts"
  // toggle in App Config (Feature Flags). Never throws — a push failure
  // (e.g. Firebase not configured) must not block publishing an article.
  private async maybeSendBreakingPush(article: {
    id: string;
    titleTa: string;
    titleEn: string;
    excerpt: string | null;
    bodyTa: string;
    bodyEn: string;
  }) {
    try {
      const flag = await this.prisma.appConfig.findUnique({ where: { key: 'breakingAlerts' } });
      if (flag && flag.value === false) return;

      const bodyTa = article.excerpt?.trim() || article.bodyTa.slice(0, 120);
      const bodyEn = article.excerpt?.trim() || article.bodyEn.slice(0, 120);
      await this.notifications.send({
        titleTa: article.titleTa,
        bodyTa,
        titleEn: article.titleEn,
        bodyEn,
        target: 'ALL',
        data: { articleId: article.id, type: 'breaking' },
      });
    } catch (err) {
      this.logger.warn(`Breaking push skipped: ${err.message}`);
    }
  }

  // ─── Audit log helper ─────────────────────────────────────────────────────

  private async log(opts: {
    adminId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    ip?: string;
    device?: string;
  }) {
    try { await this.prisma.auditLog.create({ data: opts }); } catch { /* non-critical */ }
  }

  // ─── Public: list articles ────────────────────────────────────────────────

  async findAll(query: ArticleListQueryDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const where: any = { status: 'PUBLISHED' };
    if (query.categoryId) where.categoryId = query.categoryId;

    const articles = await this.prisma.article.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
    });

    const hasMore = articles.length > limit;
    const data = hasMore ? articles.slice(0, limit) : articles;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, meta: { hasMore, nextCursor, count: data.length } };
  }

  // ─── Public: breaking news ────────────────────────────────────────────────

  async findBreaking() {
    const articles = await this.prisma.article.findMany({
      where: { status: 'PUBLISHED', isBreaking: true },
      take: 5,
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
    });
    return { data: articles };
  }

  // ─── Public: get single article ───────────────────────────────────────────

  async findOne(id: string, userId?: string) {
    const article = await this.prisma.article.findUnique({
      where: { id },
      include: { category: true, admin: { select: { id: true, name: true } } },
    });
    if (!article || article.status === 'DELETED') {
      throw new NotFoundException('Article not found');
    }

    if (userId) {
      try {
        await this.prisma.articleRead.upsert({
          where: { userId_articleId: { userId, articleId: id } },
          update: { readAt: new Date() },
          create: { userId, articleId: id },
        });
        await this.usersService.incrementReadCount(userId);
      } catch { /* ignore */ }
    }

    return { data: article };
  }

  // ─── Public: search ───────────────────────────────────────────────────────

  async search(query: SearchArticleDto) {
    const limit = Math.min(query.limit ?? 20, 50);
    const where: any = { status: 'PUBLISHED' };

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.q) {
      where.OR = [
        { titleTa: { contains: query.q, mode: 'insensitive' } },
        { titleEn: { contains: query.q, mode: 'insensitive' } },
        { bodyTa: { contains: query.q, mode: 'insensitive' } },
        { bodyEn: { contains: query.q, mode: 'insensitive' } },
      ];
    }

    const articles = await this.prisma.article.findMany({
      where,
      take: limit + 1,
      ...(query.cursor ? { cursor: { id: query.cursor }, skip: 1 } : {}),
      orderBy: { publishedAt: 'desc' },
      include: { category: true },
    });

    const hasMore = articles.length > limit;
    const data = hasMore ? articles.slice(0, limit) : articles;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return { data, meta: { hasMore, nextCursor } };
  }

  // ─── Admin: create ────────────────────────────────────────────────────────

  async create(dto: CreateArticleDto, adminId: string, ip?: string, device?: string) {
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const status = dto.status ?? 'DRAFT';
    const article = await this.prisma.article.create({
      data: {
        titleTa: dto.titleTa,
        titleEn: dto.titleEn ?? dto.titleTa,
        bodyTa: dto.bodyTa,
        bodyEn: dto.bodyEn ?? dto.bodyTa,
        excerpt: dto.excerpt,
        thumbnailUrl: dto.thumbnailUrl,
        byline: dto.byline,
        categoryId: dto.categoryId,
        adminId,
        isBreaking: dto.isBreaking ?? false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
      include: { category: true },
    });

    await this.log({
      adminId,
      action: status === 'PUBLISHED' ? 'ARTICLE_PUBLISH' : 'ARTICLE_CREATE',
      entityType: 'article',
      entityId: article.id,
      metadata: { title: article.titleEn, category: category.nameEn, status },
      ip,
      device,
    });

    if (status === 'PUBLISHED' && article.isBreaking) {
      this.maybeSendBreakingPush(article);
    }

    return { data: article };
  }

  // ─── Admin: update ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateArticleDto, adminId?: string, ip?: string, device?: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        ...(dto.status === 'PUBLISHED' && existing.status !== 'PUBLISHED' ? { publishedAt: new Date() } : {}),
      },
      include: { category: true },
    });

    await this.log({
      adminId,
      action: dto.status === 'PUBLISHED' ? 'ARTICLE_PUBLISH' : 'ARTICLE_UPDATE',
      entityType: 'article',
      entityId: id,
      metadata: { title: existing.titleEn, changes: Object.keys(dto) },
      ip,
      device,
    });

    // Fires when this edit is what NEWLY makes the article both published
    // and breaking (covers the normal admin flow: open an existing article,
    // check "Breaking News", save — not just the dedicated toggle/create
    // paths). Guarded so re-saving an already-breaking article doesn't spam
    // a push on every unrelated edit.
    const wasPublishedAndBreaking = existing.status === 'PUBLISHED' && existing.isBreaking;
    const isNowPublishedAndBreaking = article.status === 'PUBLISHED' && article.isBreaking;
    if (isNowPublishedAndBreaking && !wasPublishedAndBreaking) {
      this.maybeSendBreakingPush(article);
    }

    return { data: article };
  }

  // ─── Admin: publish ───────────────────────────────────────────────────────

  async publish(id: string, adminId?: string, ip?: string, device?: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    await this.log({
      adminId,
      action: 'ARTICLE_PUBLISH',
      entityType: 'article',
      entityId: id,
      metadata: { title: existing.titleEn },
      ip,
      device,
    });

    // Covers publishing a draft that was already marked Breaking News.
    if (article.isBreaking && existing.status !== 'PUBLISHED') {
      this.maybeSendBreakingPush(article);
    }

    return { data: article };
  }

  // ─── Admin: toggle breaking ───────────────────────────────────────────────

  async toggleBreaking(id: string, adminId?: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { isBreaking: !existing.isBreaking },
    });

    await this.log({
      adminId,
      action: article.isBreaking ? 'ARTICLE_BREAKING_ON' : 'ARTICLE_BREAKING_OFF',
      entityType: 'article',
      entityId: id,
    });

    if (article.isBreaking && article.status === 'PUBLISHED') {
      this.maybeSendBreakingPush(article);
    }

    return { data: article };
  }

  // ─── Admin: unpublish ────────────────────────────────────────────────────

  async unpublish(id: string, adminId?: string, ip?: string, device?: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'UNPUBLISHED' },
    });

    await this.log({
      adminId,
      action: 'ARTICLE_UNPUBLISH',
      entityType: 'article',
      entityId: id,
      metadata: { title: existing.titleEn },
      ip,
      device,
    });

    return { data: article };
  }

  // ─── Admin: bulk action ───────────────────────────────────────────────────

  async bulkAction(ids: string[], action: 'publish' | 'delete', adminId?: string) {
    const status = action === 'publish' ? 'PUBLISHED' : 'DELETED';
    const data: any = { status };
    if (action === 'publish') data.publishedAt = new Date();

    await this.prisma.article.updateMany({ where: { id: { in: ids } }, data });

    await this.log({
      adminId,
      action: action === 'publish' ? 'ARTICLE_BULK_PUBLISH' : 'ARTICLE_BULK_DELETE',
      entityType: 'article',
      metadata: { count: ids.length, ids },
    });

    return { data: { updated: ids.length } };
  }

  // ─── Admin: list (with status filter) ────────────────────────────────────

  async adminFindAll(query: ArticleListQueryDto & { status?: string; search?: string; page?: number }) {
    const limit = Math.min(query.limit ?? 20, 50);
    const page = query.page ? Number(query.page) : 1;
    const skip = (page - 1) * limit;

    const where: any = { status: { not: 'DELETED' } };
    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { titleTa: { contains: query.search, mode: 'insensitive' } },
        { titleEn: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      this.prisma.article.findMany({
        where,
        take: limit,
        skip,
        orderBy: { createdAt: 'desc' },
        include: { category: true, admin: { select: { id: true, name: true } } },
      }),
      this.prisma.article.count({ where }),
    ]);

    return { data: articles, meta: { total, page, limit, hasMore: skip + limit < total } };
  }

  // ─── Admin: soft delete ───────────────────────────────────────────────────

  async remove(id: string, adminId?: string, ip?: string, device?: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    await this.log({
      adminId,
      action: 'ARTICLE_DELETE',
      entityType: 'article',
      entityId: id,
      metadata: { title: existing.titleEn },
      ip,
      device,
    });

    return { data: article };
  }
}
