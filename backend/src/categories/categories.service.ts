// src/categories/categories.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return { data: categories };
  }

  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Category with this slug already exists');

    const category = await this.prisma.category.create({
      data: {
        nameTa: dto.nameTa,
        nameEn: dto.nameEn,
        slug: dto.slug,
        iconUrl: dto.iconUrl,
        displayOrder: dto.displayOrder ?? 0,
      },
    });
    return { data: category };
  }

  async update(id: string, dto: UpdateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException('Slug already in use');
    }

    const category = await this.prisma.category.update({ where: { id }, data: dto });
    return { data: category };
  }

  async deactivate(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');
    const category = await this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
    return { data: category };
  }
}
