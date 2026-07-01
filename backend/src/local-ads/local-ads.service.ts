// src/local-ads/local-ads.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocalAdDto, UpdateLocalAdDto } from './local-ads.dto';

@Injectable()
export class LocalAdsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateLocalAdDto, adminId: string) {
    const ad = await this.prisma.localAd.create({
      data: {
        title:          dto.title,
        description:    dto.description,
        adType:         dto.adType as any,
        mediaUrl:       dto.mediaUrl,
        carousel:       dto.carousel ?? undefined,
        startDate:      new Date(dto.startDate),
        endDate:        new Date(dto.endDate),
        categoryId:     dto.categoryId,
        targetAudience: dto.targetAudience,
        priority:       dto.priority ?? 0,
        status:         (dto.status ?? 'DRAFT') as any,
        ctaType:        dto.ctaType as any,
        ctaValue:       dto.ctaValue,
        placement:      (dto.placement ?? 'BOTH') as any,
        adminId,
      },
      include: { admin: { select: { id: true, name: true } } },
    });
    await this.prisma.auditLog.create({
      data: { adminId, action: 'LOCAL_AD_CREATE', entityType: 'localAd', entityId: ad.id,
        metadata: { title: ad.title, adType: ad.adType } },
    }).catch(() => {});
    return { data: ad };
  }

  async findAll(opts: { status?: string; adType?: string; page?: number; limit?: number }) {
    const { status, adType, page = 1, limit = 20 } = opts;
    const skip = (page - 1) * limit;
    const where: any = {};
    if (status && status !== 'all') where.status = status;
    if (adType && adType !== 'all') where.adType = adType;

    const [ads, total] = await Promise.all([
      this.prisma.localAd.findMany({
        where, skip, take: limit,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: { admin: { select: { id: true, name: true } } },
      }),
      this.prisma.localAd.count({ where }),
    ]);
    return { data: ads, meta: { total, page, limit, hasMore: skip + limit < total } };
  }

  async findOne(id: string) {
    const ad = await this.prisma.localAd.findUnique({
      where: { id },
      include: { admin: { select: { id: true, name: true } } },
    });
    if (!ad) throw new NotFoundException('Ad not found');
    return { data: ad };
  }

  async update(id: string, dto: UpdateLocalAdDto, adminId: string) {
    const existing = await this.prisma.localAd.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ad not found');

    const ad = await this.prisma.localAd.update({
      where: { id },
      data: {
        ...dto,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate:   dto.endDate   ? new Date(dto.endDate)   : undefined,
        adType:    dto.adType    ? dto.adType as any        : undefined,
        ctaType:   dto.ctaType   ? dto.ctaType as any       : undefined,
        status:    dto.status    ? dto.status as any         : undefined,
        placement: dto.placement ? dto.placement as any     : undefined,
      },
      include: { admin: { select: { id: true, name: true } } },
    });
    await this.prisma.auditLog.create({
      data: { adminId, action: 'LOCAL_AD_UPDATE', entityType: 'localAd', entityId: id,
        metadata: { title: existing.title, changes: Object.keys(dto) } },
    }).catch(() => {});
    return { data: ad };
  }

  async remove(id: string, adminId: string) {
    const existing = await this.prisma.localAd.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Ad not found');
    await this.prisma.localAd.delete({ where: { id } });
    await this.prisma.auditLog.create({
      data: { adminId, action: 'LOCAL_AD_DELETE', entityType: 'localAd', entityId: id,
        metadata: { title: existing.title } },
    }).catch(() => {});
    return { data: { message: 'Ad deleted' } };
  }

  async trackClick(id: string) {
    await this.prisma.localAd.update({
      where: { id },
      data: { clickCount: { increment: 1 } },
    }).catch(() => {});
    return { data: { ok: true } };
  }

  async trackImpression(id: string) {
    await this.prisma.localAd.update({
      where: { id },
      data: { impressions: { increment: 1 } },
    }).catch(() => {});
    return { data: { ok: true } };
  }

  // ─── Public: get active ads for reader app ───────────────────────────────

  async getActiveAds(placement?: string) {
    const now = new Date();
    const where: any = {
      status: 'ACTIVE',
      startDate: { lte: now },
      endDate:   { gte: now },
    };
    if (placement === 'LOCAL') where.placement = { in: ['LOCAL', 'BOTH'] };
    else if (placement === 'ADMOB') where.placement = { in: ['ADMOB', 'BOTH'] };

    const ads = await this.prisma.localAd.findMany({
      where,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      select: {
        id: true, title: true, description: true, adType: true,
        mediaUrl: true, carousel: true, ctaType: true, ctaValue: true,
        placement: true, priority: true,
      },
    });
    return { data: ads };
  }
}
