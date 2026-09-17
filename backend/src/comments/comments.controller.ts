// src/comments/comments.controller.ts
// Mounted under /news/:id/comments (same resource family as
// news.controller.ts's react() endpoint) rather than a separate
// /comments root, so it reads naturally as "comments on this article".
import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './comments.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Comments')
@Controller('news')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on an article (public, no login required)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findByArticle(@Param('id') id: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.commentsService.findByArticle(id, page ? Number(page) : 1, limit ? Number(limit) : 20);
  }

  @Post(':id/comments')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector))
  @ApiOperation({ summary: 'Post a comment — requires a logged-in reader (phone OTP or Google)' })
  create(@Param('id') id: string, @CurrentUser() user: any, @Body() dto: CreateCommentDto) {
    if (user?._type !== 'user') throw new ForbiddenException('Only reader accounts can post comments');
    return this.commentsService.create(id, user.id, dto.body);
  }

  @Delete('comments/:commentId')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector))
  @ApiOperation({ summary: 'Delete your own comment' })
  remove(@Param('commentId') commentId: string, @CurrentUser() user: any) {
    if (user?._type !== 'user') throw new ForbiddenException('Only reader accounts can delete comments');
    return this.commentsService.remove(commentId, user.id);
  }
}
