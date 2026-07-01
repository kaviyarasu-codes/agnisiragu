// src/categories/categories.service.ts
import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  private async log(opts: {
    adminId?: string; action: string; entityType: string; entityId?: string; metadata?: any;
  }) {
    try { await this.prisma.auditLog.create({ data: opts }); } catch { /* non-critical */ }
  }

  async findAll() {
    const categories = await this.prisma.category.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    return { data: categories };
  }

  async findAllAdmin() {
    const categories = await this.prisma.category.findMany({
      orderBy: { displayOrder: 'asc' },
    });
    return { data: categories };
  }

  async create(dto: CreateCategoryDto, adminId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException('Category with this slug already exists');

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

    await this.log({ adminId, action: 'CATEGORY_CREATE', entityType: 'category', entityId: category.id,
      metadata: { name: category.nameEn, slug: category.slug } });

    return { data: category };
  }

  async update(id: string, dto: UpdateCategoryDto, adminId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    if (dto.slug && dto.slug !== existing.slug) {
      const slugConflict = await this.prisma.category.findUnique({ where: { slug: dto.slug } });
      if (slugConflict) throw new ConflictException('Slug already in use');
    }

    const category = await this.prisma.category.update({ where: { id }, data: dto });

    await this.log({ adminId, action: 'CATEGORY_UPDATE', entityType: 'category', entityId: id,
      metadata: { name: existing.nameEn, changes: Object.keys(dto) } });

    return { data: category };
  }

  async toggleActive(id: string, adminId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    const category = await this.prisma.category.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await this.log({ adminId,
      action: category.isActive ? 'CATEGORY_ACTIVATE' : 'CATEGORY_DEACTIVATE',
      entityType: 'category', entityId: id, metadata: { name: existing.nameEn } });

    return { data: category };
  }

  async reorder(id: string, direction: 'up' | 'down', adminId?: string) {
    const current = await this.prisma.category.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Category not found');

    const all = await this.prisma.category.findMany({ orderBy: { displayOrder: 'asc' } });
    const currentIndex = all.findIndex((c) => c.id === id);
    const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= all.length) {
      throw new BadRequestException('Cannot move further in that direction');
    }

    const swapTarget = all[swapIndex];
    await this.prisma.$transaction([
      this.prisma.category.update({ where: { id: current.id }, data: { displayOrder: swapTarget.displayOrder } }),
      this.prisma.category.update({ where: { id: swapTarget.id }, data: { displayOrder: current.displayOrder } }),
    ]);

    return { data: { message: 'Reordered successfully' } };
  }

  async deactivate(id: string, adminId?: string) {
    const existing = await this.prisma.category.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Category not found');

    const category = await this.prisma.category.update({ where: { id }, data: { isActive: false } });

    await this.log({ adminId, action: 'CATEGORY_DEACTIVATE', entityType: 'category', entityId: id,
      metadata: { name: existing.nameEn } });

    return { data: category };
  }
}
