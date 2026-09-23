// src/categories/categories.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString, IsIn } from 'class-validator';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Reflector } from '@nestjs/core';

class ReorderDto {
  @IsString()
  @IsIn(['up', 'down'])
  direction: 'up' | 'down';
}

const reflector = new Reflector();

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  // ── Public: active categories only ───────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Get all active categories (public)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  // ── Admin: ALL categories including inactive ──────────────────────────────
  // Every team needs to browse categories to tag their own content (articles,
  // local ads, etc.) — this used to be SUPER_ADMIN/ADMIN only, which silently
  // 403'd the list for every Manager/Member. Matches the broader allow-list
  // pattern used for news/articles read access (see news.controller.ts).
  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles(
    'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER',
    'VERIFICATION_MANAGER', 'VERIFICATION_MEMBER', 'REPORTER_APP_MANAGER', 'REPORTER_APP_MEMBER',
    'REPORTERS_MANAGER', 'REPORTERS_MEMBER', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER',
  )
  @ApiOperation({ summary: 'Get all categories including inactive (any admin role)' })
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  // ── Create ────────────────────────────────────────────────────────────────
  // Same broadened allow-list as above — any team can add a category their
  // content needs, not just Super Admin/Admin. Editing/reordering/deleting
  // an existing (possibly someone else's) category stays admin-only below.
  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles(
    'SUPER_ADMIN', 'ADMIN', 'EDITOR', 'EDITOR_MANAGER', 'EDITOR_MEMBER',
    'VERIFICATION_MANAGER', 'VERIFICATION_MEMBER', 'REPORTER_APP_MANAGER', 'REPORTER_APP_MEMBER',
    'REPORTERS_MANAGER', 'REPORTERS_MEMBER', 'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER',
  )
  @ApiOperation({ summary: 'Create category (any admin role)' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser('id') adminId: string) {
    return this.categoriesService.create(dto, adminId);
  }

  // ── Reorder: swap with adjacent (no duplicates possible) ─────────────────
  @Patch(':id/reorder')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Move category up or down (atomic swap)' })
  reorder(@Param('id') id: string, @Body() dto: ReorderDto, @CurrentUser('id') adminId: string) {
    return this.categoriesService.reorder(id, dto.direction, adminId);
  }

  // ── Toggle active/inactive ────────────────────────────────────────────────
  @Patch(':id/toggle')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Toggle category active/inactive (never deletes)' })
  toggleActive(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.categoriesService.toggleActive(id, adminId);
  }

  // ── Update (name, slug, icon) ─────────────────────────────────────────────
  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update category fields (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto, @CurrentUser('id') adminId: string) {
    return this.categoriesService.update(id, dto, adminId);
  }

  // ── Soft delete ───────────────────────────────────────────────────────────
  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Deactivate category — does NOT delete from DB' })
  deactivate(@Param('id') id: string, @CurrentUser('id') adminId: string) {
    return this.categoriesService.deactivate(id, adminId);
  }
}
