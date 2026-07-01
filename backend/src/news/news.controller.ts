// src/news/news.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Request } from 'express';
import { NewsService } from './news.service';
import {
  CreateArticleDto, UpdateArticleDto, ArticleListQueryDto, SearchArticleDto,
} from './news.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

const reflector = new Reflector();

function extractIp(req: Request): string {
  const fwd = req.headers['x-forwarded-for'];
  if (fwd) return (Array.isArray(fwd) ? fwd[0] : fwd.split(',')[0]).trim();
  return req.socket?.remoteAddress || req.ip || '';
}
function extractDevice(req: Request): string {
  return (req.headers['user-agent'] || '').slice(0, 255);
}

@ApiTags('News')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOperation({ summary: 'List published articles (public, cursor-paginated)' })
  findAll(@Query() query: ArticleListQueryDto) {
    return this.newsService.findAll(query);
  }

  @Get('breaking')
  @ApiOperation({ summary: 'Get top 5 breaking news (public)' })
  findBreaking() {
    return this.newsService.findBreaking();
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search articles (public)' })
  search(@Query() query: SearchArticleDto) {
    return this.newsService.search(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single article. Tracks read if bearer token provided.' })
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.newsService.findOne(id, req.user?.id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER')
  @ApiOperation({ summary: 'Create article (admin/editor)' })
  create(@Body() dto: CreateArticleDto, @CurrentUser('id') adminId: string, @Req() req: Request) {
    return this.newsService.create(dto, adminId, extractIp(req), extractDevice(req));
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER')
  @ApiOperation({ summary: 'Update article (admin/editor)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateArticleDto,
    @CurrentUser('id') adminId: string,
    @Req() req: Request,
  ) {
    return this.newsService.update(id, dto, adminId, extractIp(req), extractDevice(req));
  }

  @Patch(':id/publish')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER')
  @ApiOperation({ summary: 'Publish article' })
  publish(@Param('id') id: string, @CurrentUser('id') adminId: string, @Req() req: Request) {
    return this.newsService.publish(id, adminId, extractIp(req), extractDevice(req));
  }

  @Patch(':id/breaking')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Toggle breaking flag (admin)' })
  toggleBreaking(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.newsService.toggleBreaking(id, adminId);
  }

  @Patch(':id/unpublish')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER')
  @ApiOperation({ summary: 'Unpublish article' })
  unpublish(@Param('id') id: string, @CurrentUser('id') adminId: string, @Req() req: Request) {
    return this.newsService.unpublish(id, adminId, extractIp(req), extractDevice(req));
  }

  @Post('bulk/:action')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Bulk publish or delete articles' })
  bulk(
    @Param('action') action: 'publish' | 'delete',
    @Body('ids') ids: string[],
    @CurrentUser('id') adminId: string,
  ) {
    return this.newsService.bulkAction(ids, action, adminId);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Soft delete article (admin)' })
  remove(@Param('id') id: string, @CurrentUser('id') adminId: string, @Req() req: Request) {
    return this.newsService.remove(id, adminId, extractIp(req), extractDevice(req));
  }

  // ─── Admin list ───────────────────────────────────────────────────────────

  @Get('admin/list')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER', 'VERIFICATION_MANAGER', 'VERIFICATION_MEMBER')
  @ApiQuery({ name: 'page',       required: false })
  @ApiQuery({ name: 'limit',      required: false })
  @ApiQuery({ name: 'status',     required: false })
  @ApiQuery({ name: 'search',     required: false })
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiOperation({ summary: 'List all articles for admin panel' })
  adminFindAll(@Query() query: any) {
    return this.newsService.adminFindAll(query);
  }
}
