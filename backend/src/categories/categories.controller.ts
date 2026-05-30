// src/categories/categories.controller.ts
import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Reflector } from '@nestjs/core';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories (public)' })
  findAll() {
    return this.categoriesService.findAll();
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(new Reflector()), new RolesGuard(new Reflector()))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Create category (admin only)' })
  create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(new Reflector()), new RolesGuard(new Reflector()))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Update category (admin only)' })
  update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(new JwtAuthGuard(new Reflector()), new RolesGuard(new Reflector()))
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiOperation({ summary: 'Deactivate category (admin only)' })
  deactivate(@Param('id') id: string) {
    return this.categoriesService.deactivate(id);
  }
}
