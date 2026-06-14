// src/news/news.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import {
  CreateArticleDto,
  UpdateArticleDto,
  ArticleListQueryDto,
  SearchArticleDto,
} from './news.dto';

@Injectable()
export class NewsService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

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

    return {
      data,
      meta: { hasMore, nextCursor, count: data.length },
    };
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

    // Track read if user is authenticated
    if (userId) {
      try {
        await this.prisma.articleRead.upsert({
          where: { userId_articleId: { userId, articleId: id } },
          update: { readAt: new Date() },
          create: { userId, articleId: id },
        });
        await this.usersService.incrementReadCount(userId);
      } catch {
        // Ignore tracking errors
      }
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

  async create(dto: CreateArticleDto, adminId: string) {
    // Verify category exists
    const category = await this.prisma.category.findUnique({ where: { id: dto.categoryId } });
    if (!category) throw new NotFoundException('Category not found');

    const status = dto.status ?? 'DRAFT';
    const article = await this.prisma.article.create({
      data: {
        titleTa: dto.titleTa,
        titleEn: dto.titleEn,
        bodyTa: dto.bodyTa,
        bodyEn: dto.bodyEn,
        excerpt: dto.excerpt,
        thumbnailUrl: dto.thumbnailUrl,
        categoryId: dto.categoryId,
        adminId,
        isBreaking: dto.isBreaking ?? false,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
        status,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
      },
      include: { category: true },
    });

    return { data: article };
  }

  // ─── Admin: update ────────────────────────────────────────────────────────

  async update(id: string, dto: UpdateArticleDto) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: {
        ...dto,
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
      },
      include: { category: true },
    });

    return { data: article };
  }

  // ─── Admin: publish ───────────────────────────────────────────────────────

  async publish(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'PUBLISHED', publishedAt: new Date() },
    });

    return { data: article };
  }

  // ─── Admin: toggle breaking ───────────────────────────────────────────────

  async toggleBreaking(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { isBreaking: !existing.isBreaking },
    });

    return { data: article };
  }

  // ─── Admin: unpublish ────────────────────────────────────────────────────

  async unpublish(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing || existing.status === 'DELETED') throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'UNPUBLISHED' },
    });

    return { data: article };
  }

  // ─── Admin: bulk action ───────────────────────────────────────────────────

  async bulkAction(ids: string[], action: 'publish' | 'delete') {
    const status = action === 'publish' ? 'PUBLISHED' : 'DELETED';
    const data: any = { status };
    if (action === 'publish') data.publishedAt = new Date();

    await this.prisma.article.updateMany({
      where: { id: { in: ids } },
      data,
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

  async remove(id: string) {
    const existing = await this.prisma.article.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Article not found');

    const article = await this.prisma.article.update({
      where: { id },
      data: { status: 'DELETED' },
    });

    return { data: article };
  }
}
