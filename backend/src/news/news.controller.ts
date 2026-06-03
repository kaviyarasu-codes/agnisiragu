// src/news/news.controller.ts
import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query,
  UseGuards, Request, Optional,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { NewsService } from './news.service';
import {
  CreateArticleDto, UpdateArticleDto, ArticleListQueryDto, SearchArticleDto,
} from './news.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';

const reflector = new Reflector();

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
  async findOne(@Param('id') id: string, @Request() req: any) {
    // Optionally extract user from token if present
    let userId: string | undefined;
    try {
      const authHeader = req.headers?.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        // User is injected by passport if token is valid
        userId = req.user?.id;
      }
    } catch {
      // ignore
    }
    return this.newsService.findOne(id, userId);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Create article (admin/editor)' })
  create(@Body() dto: CreateArticleDto, @CurrentUser('id') adminId: string) {
    return this.newsService.create(dto, adminId);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Update article (admin/editor)' })
  update(@Param('id') id: string, @Body() dto: UpdateArticleDto) {
    return this.newsService.update(id, dto);
  }

  @Patch(':id/publish')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Publish article (admin/editor)' })
  publish(@Param('id') id: string) {
    return this.newsService.publish(id);
  }

  @Patch(':id/breaking')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Toggle breaking flag (admin)' })
  toggleBreaking(@Param('id') id: string) {
    return this.newsService.toggleBreaking(id);
  }

  @Patch(':id/unpublish')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN', 'EDITOR')
  @ApiOperation({ summary: 'Unpublish article' })
  unpublish(@Param('id') id: string) {
    return this.newsService.unpublish(id);
  }

  @Post('bulk/:action')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Bulk publish or delete articles' })
  bulk(@Param('action') action: 'publish' | 'delete', @Body('ids') ids: string[]) {
    return this.newsService.bulkAction(ids, action);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Soft delete article (admin)' })
  remove(@Param('id') id: string) {
    return this.newsService.remove(id);
  }
}
