// src/comments/comments.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  // Public — no login required to read, matching the "guest-first" reading
  // model used everywhere else (reactions, article views). Toxic comments
  // (flagged manually via isToxic, no auto-moderation yet) are hidden from
  // this list but kept in the DB.
  async findByArticle(articleId: string, page = 1, limit = 20) {
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { articleId, isToxic: false },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.comment.count({ where: { articleId, isToxic: false } }),
    ]);
    return { data: comments, meta: { total, page, limit, hasMore: page * limit < total } };
  }

  async create(articleId: string, userId: string, body: string) {
    const article = await this.prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
    if (!article) throw new NotFoundException('Article not found');

    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { articleId, userId, body: body.trim() },
        include: { user: { select: { id: true, name: true } } },
      }),
      this.prisma.article.update({ where: { id: articleId }, data: { commentCount: { increment: 1 } } }),
    ]);
    return { data: comment };
  }

  async remove(commentId: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new ForbiddenException('You can only delete your own comment');

    await this.prisma.$transaction([
      this.prisma.comment.delete({ where: { id: commentId } }),
      this.prisma.article.update({ where: { id: comment.articleId }, data: { commentCount: { decrement: 1 } } }),
    ]);
    return { data: { message: 'Comment deleted' } };
  }
}
