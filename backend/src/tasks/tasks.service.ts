// src/tasks/tasks.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// ─── Assignment hierarchy ───────────────────────────────────────────────────
// SUPER_ADMIN / ADMIN : can assign a task to ANY active admin (manager or
//                        member, any team).
// *_MANAGER            : can assign a task only to active *_MEMBER admins on
//                        their own team (teamType match).
// everyone else         : cannot assign tasks — can only update the status of
//                        tasks assigned to them.
// Kept as explicit lists (not a naming-convention check on the enum, which
// Prisma doesn't support filtering by) so this stays in sync with
// admin.controller.ts's ADMIN_ROLES by hand — same tradeoff made there.
const TOP_ROLES = ['SUPER_ADMIN', 'ADMIN'];
const MANAGER_ROLES = [
  'EDITOR_MANAGER', 'VERIFICATION_MANAGER', 'REPORTER_APP_MANAGER', 'REPORTERS_MANAGER',
  'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER',
];
const MEMBER_ROLES = ['EDITOR_MEMBER', 'VERIFICATION_MEMBER', 'REPORTER_APP_MEMBER', 'REPORTERS_MEMBER'];

const taskInclude = {
  assignedTo: { select: { id: true, name: true, avatarUrl: true, adminRole: true } },
  assignedBy: { select: { id: true, name: true, avatarUrl: true, adminRole: true } },
};

@Injectable()
export class TasksService {
  constructor(private prisma: PrismaService) {}

  // Roster of people the current admin is allowed to hand a task to — feeds
  // the "Assign Task" picker in the My Profile page. Returns an empty list
  // for anyone who isn't a top role or a manager (e.g. members, plain
  // EDITOR), which the frontend uses to hide the "Assign Task" button.
  async getAssignableUsers(requesterId: string, requesterRole: string, requesterTeam: string | null) {
    if (TOP_ROLES.includes(requesterRole)) {
      const admins = await this.prisma.admin.findMany({
        where: { isActive: true, id: { not: requesterId } },
        select: { id: true, name: true, adminRole: true, teamType: true },
        orderBy: { name: 'asc' },
      });
      return { data: admins };
    }
    if (MANAGER_ROLES.includes(requesterRole) && requesterTeam) {
      const admins = await this.prisma.admin.findMany({
        where: { isActive: true, adminRole: { in: MEMBER_ROLES as any }, teamType: requesterTeam },
        select: { id: true, name: true, adminRole: true, teamType: true },
        orderBy: { name: 'asc' },
      });
      return { data: admins };
    }
    return { data: [] };
  }

  async createTask(
    requesterId: string, requesterRole: string, requesterTeam: string | null,
    dto: { title: string; description?: string; assignedToId: string; dueDate?: string },
  ) {
    const canAssignToAnyone = TOP_ROLES.includes(requesterRole);
    const isManager = MANAGER_ROLES.includes(requesterRole);
    if (!canAssignToAnyone && !isManager) {
      throw new ForbiddenException('You do not have permission to assign tasks');
    }

    const target = await this.prisma.admin.findUnique({ where: { id: dto.assignedToId } });
    if (!target || !target.isActive) throw new NotFoundException('Assignee not found');

    if (!canAssignToAnyone) {
      if (!MEMBER_ROLES.includes(target.adminRole) || target.teamType !== requesterTeam) {
        throw new ForbiddenException('You can only assign tasks to members of your own team');
      }
    }

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description ?? null,
        assignedToId: dto.assignedToId,
        assignedById: requesterId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: taskInclude,
    });

    await this.prisma.auditLog.create({
      data: {
        adminId: requesterId, action: 'TASK_ASSIGN', entityType: 'task', entityId: task.id,
        metadata: { title: task.title, assignedTo: target.name },
      },
    }).catch(() => {});

    return { data: task };
  }

  async getMyTasks(adminId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { assignedToId: adminId },
      include: taskInclude,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
    return { data: tasks };
  }

  async getAssignedByMe(adminId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { assignedById: adminId },
      include: taskInclude,
      orderBy: { createdAt: 'desc' },
    });
    return { data: tasks };
  }

  async updateStatus(taskId: string, requesterId: string, requesterRole: string, status: 'NEW' | 'IN_PROGRESS' | 'DONE') {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const isAssignee = task.assignedToId === requesterId;
    const isAssigner = task.assignedById === requesterId;
    const isTopRole = TOP_ROLES.includes(requesterRole);
    if (!isAssignee && !isAssigner && !isTopRole) {
      throw new ForbiddenException('You cannot update this task');
    }

    const updated = await this.prisma.task.update({
      where: { id: taskId },
      data: { status, completedAt: status === 'DONE' ? new Date() : null },
      include: taskInclude,
    });
    return { data: updated };
  }

  async deleteTask(taskId: string, requesterId: string, requesterRole: string) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');

    const isAssigner = task.assignedById === requesterId;
    const isTopRole = TOP_ROLES.includes(requesterRole);
    if (!isAssigner && !isTopRole) {
      throw new ForbiddenException('Only the assigner or a super admin can delete this task');
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    return { data: { success: true } };
  }
}
