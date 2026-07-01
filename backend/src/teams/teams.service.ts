// src/teams/teams.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateTeamDto {
  name: string;
  nameTa?: string;
  type: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface UpdateTeamDto {
  name?: string;
  nameTa?: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  private async log(opts: {
    adminId?: string; action: string; entityType: string;
    entityId?: string; metadata?: Record<string, any>;
  }) {
    try {
      await this.prisma.auditLog.create({ data: { ...opts, entityType: opts.entityType } });
    } catch { }
  }

  async findAll() {
    const teams = await this.prisma.team.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return { data: teams };
  }

  async findOne(id: string) {
    const team = await this.prisma.team.findUnique({ where: { id } });
    if (!team) throw new NotFoundException('Team not found');
    return { data: team };
  }

  async create(dto: CreateTeamDto, adminId?: string) {
    const existing = await this.prisma.team.findUnique({ where: { type: dto.type } });
    if (existing) throw new ConflictException('Team type already exists');

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        nameTa: dto.nameTa,
        type: dto.type.toUpperCase().replace(/\s+/g, '_'),
        description: dto.description,
        color: dto.color ?? '#6366f1',
        isActive: dto.isActive ?? true,
      },
    });

    this.log({ adminId, action: 'TEAM_CREATE', entityType: 'Team', entityId: team.id, metadata: { name: team.name } }).catch(() => {});
    return { data: team, message: 'Team created' };
  }

  async update(id: string, dto: UpdateTeamDto, adminId?: string) {
    await this.findOne(id);
    const team = await this.prisma.team.update({
      where: { id },
      data: dto,
    });
    this.log({ adminId, action: 'TEAM_UPDATE', entityType: 'Team', entityId: id }).catch(() => {});
    return { data: team, message: 'Team updated' };
  }

  async remove(id: string, adminId?: string) {
    await this.findOne(id);
    await this.prisma.team.delete({ where: { id } });
    this.log({ adminId, action: 'TEAM_DELETE', entityType: 'Team', entityId: id }).catch(() => {});
    return { message: 'Team deleted' };
  }

  async toggleActive(id: string, adminId?: string) {
    const { data: team } = await this.findOne(id);
    const updated = await this.prisma.team.update({
      where: { id },
      data: { isActive: !team.isActive },
    });
    return { data: updated };
  }
}
