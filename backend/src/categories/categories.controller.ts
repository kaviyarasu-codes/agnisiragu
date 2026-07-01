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
  @Get('admin/all')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Get all categories including inactive (admin only)' })
  findAllAdmin() {
    return this.categoriesService.findAllAdmin();
  }

  // ── Create ────────────────────────────────────────────────────────────────
  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(reflector), new RolesGuard(reflector))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create category (admin only)' })
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
