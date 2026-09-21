// src/tickets/tickets.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Fixed two-tier split (unlike Task's team-scoped manager rule): any
// Manager or Member may raise a ticket; only SUPER_ADMIN/ADMIN see the
// shared pool and resolve it. No team scoping — an issue raised by an
// Editor team member may well need an Admin's attention regardless of team.
const TOP_ROLES = ['SUPER_ADMIN', 'ADMIN'];

const ticketInclude = {
  raisedBy:   { select: { id: true, name: true, avatarUrl: true, adminRole: true, teamType: true } },
  resolvedBy: { select: { id: true, name: true, avatarUrl: true, adminRole: true } },
};

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async createTicket(
    requesterId: string, requesterRole: string,
    dto: { title: string; description: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH' },
  ) {
    if (TOP_ROLES.includes(requesterRole)) {
      throw new ForbiddenException('Admins resolve tickets — they are raised by managers and team members');
    }
    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        raisedById: requesterId,
      },
      include: ticketInclude,
    });
    await this.prisma.auditLog.create({
      data: { adminId: requesterId, action: 'TICKET_RAISE', entityType: 'ticket', entityId: ticket.id,
        metadata: { title: ticket.title, priority: ticket.priority } },
    }).catch(() => {});
    return { data: ticket };
  }

  async getMyTickets(adminId: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: { raisedById: adminId },
      include: ticketInclude,
      orderBy: { createdAt: 'desc' },
    });
    return { data: tickets };
  }

  // Shared pool — SUPER_ADMIN/ADMIN only, enforced by the controller's
  // @Roles guard (unlike Task, this split has no team-scoping to compute,
  // so a plain role check is sufficient here).
  async getAllTickets(status?: string) {
    const tickets = await this.prisma.ticket.findMany({
      where: status ? { status: status as any } : undefined,
      include: ticketInclude,
      orderBy: [{ status: 'asc' }, { priority: 'desc' }, { createdAt: 'asc' }],
    });
    return { data: tickets };
  }

  async updateTicket(
    ticketId: string, resolverId: string,
    dto: { status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'; resolutionNote?: string },
  ) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    const updated = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.resolutionNote !== undefined ? { resolutionNote: dto.resolutionNote } : {}),
        ...(dto.status === 'RESOLVED' ? { resolvedById: resolverId, resolvedAt: new Date() } : {}),
      },
      include: ticketInclude,
    });
    return { data: updated };
  }
}
