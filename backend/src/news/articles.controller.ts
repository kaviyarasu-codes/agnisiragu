// src/news/articles.controller.ts
// Admin-facing /articles endpoint (mirrors /news with admin-specific list)
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { NewsService } from './news.service';
import { CreateArticleDto, UpdateArticleDto, ArticleListQueryDto } from './news.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

@ApiTags('Articles (Admin)')
@ApiBearerAuth()
@UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
@Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
@Controller('articles')
export class ArticlesController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: list articles with filters' })
  findAll(@Query() query: ArticleListQueryDto & { status?: string; search?: string }) {
    return this.newsService.adminFindAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: get single article' })
  findOne(@Param('id') id: string) {
    return this.newsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Admin: create article' })
  create(@Body() dto: CreateArticleDto, @CurrentUser('id') adminId: string) {
    return this.newsService.create(dto, adminId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: update article' })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.newsService.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Admin: publish article' })
  publish(@Param('id') id: string) {
    return this.newsService.publish(id);
  }

  @Patch(':id/unpublish')
  @ApiOperation({ summary: 'Admin: unpublish article' })
  unpublish(@Param('id') id: string) {
    return this.newsService.unpublish(id);
  }

  @Post('bulk/:action')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: bulk publish or delete' })
  bulk(@Param('action') action: 'publish' | 'delete', @Body('ids') ids: string[]) {
    return this.newsService.bulkAction(ids, action);
  }

  @Delete(':id')
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Admin: soft delete article' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
