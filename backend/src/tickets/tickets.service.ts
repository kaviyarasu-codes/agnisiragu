// src/tickets/tickets.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Any Manager, Member, or plain ADMIN may raise a ticket (to Super Admin or
// another Admin); only SUPER_ADMIN and ADMIN see the shared pool and
// resolve it (RolesGuard on the controller). SUPER_ADMIN itself is the only
// role that can't raise one — there's no one above it to raise to. No team
// scoping — an issue raised by an Editor team member may well need an
// Admin's attention regardless of team.
const CANNOT_RAISE_TICKETS = ['SUPER_ADMIN'];

const ticketInclude = {
  raisedBy:   { select: { id: true, name: true, avatarUrl: true, adminRole: true, teamType: true } },
  resolvedBy: { select: { id: true, name: true, avatarUrl: true, adminRole: true } },
};

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  async createTicket(
    requesterId: string, requesterRole: string,
    dto: { title: string; description: string; priority?: 'LOW' | 'MEDIUM' | 'HIGH'; attachmentUrls?: string[] },
  ) {
    if (CANNOT_RAISE_TICKETS.includes(requesterRole)) {
      throw new ForbiddenException('Super Admin resolves tickets — there is no one above Super Admin to raise one to');
    }
    const ticket = await this.prisma.ticket.create({
      data: {
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? 'MEDIUM',
        attachmentUrls: dto.attachmentUrls ?? [],
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
