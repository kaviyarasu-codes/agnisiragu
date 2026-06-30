// src/categories/categories.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  // ── Public: active categories only ───────────────────────────────────────
  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return { data: categories };
  }

  // ── Admin: ALL categories including inactive ──────────────────────────────
  async findAllAdmin() {
    const categories = await this.prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { data: categories };
  }

  // ── Create ────────────────────────────────────────────────────────────────
  async create(dto: CreateCategoryDto) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Category with this slug already exists');

    // Auto-assign displayOrder = max + 1
    const maxOrder = await this.prisma.category.aggregate({ _max: { displayOrder: true } });
    const nextOrder = (maxOrder._max.displayOrder ?? 0) + 1;

    const category = await this.prisma.category.create({
      data: {
        nameTa: dto.nameTa,
        nameEn: dto.nameEn,
        slug: dto.slug,
        iconUrl: dto.iconUrl,
        displayOrder: nextOrder,
        isActive: true,
      },
    });
    return { data: category };
  }

  // ── Update ────────────────────────────────────────────────────────────────
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

  // ── Toggle active (does NOT delete) ──────────────────────────────────────
  async toggleActive(id: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    const category = await this.prisma.category.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });
    return { data: category };
  }

  // ── Reorder: swap with adjacent category (no duplicates ever) ────────────
  async reorder(id: string, direction: 'up' | 'down') {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found');

    // Get all categories sorted by displayOrder
    const all = await this.prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });

    const currentIndex = all.findIndex((c) => c.id === id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= all.length) {
      throw new BadRequestException('Cannot move further in that direction');
    }

    const swapTarget = all[swapIndex];

    // Atomic swap using a transaction
    await this.prisma.$transaction([
      this.prisma.category.update({
        where: { id: current.id },
        data: { displayOrder: swapTarget.displayOrder },
      }),
      this.prisma.category.update({
        where: { id: swapTarget.id },
        data: { displayOrder: current.displayOrder },
      }),
    ]);

    return { data: { message: 'Reordered successfully' } };
  }

  // ── Soft delete (deactivate) ──────────────────────────────────────────────
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
