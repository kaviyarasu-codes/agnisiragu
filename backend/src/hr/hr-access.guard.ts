// src/hr/hr-access.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma/prisma.service';
import { HR_EDIT_KEY } from './hr-edit.decorator';

// Mirrors tasks.service.ts's MANAGER_ROLES list — kept in sync by hand with
// admin.controller.ts's ADMIN_ROLES, same tradeoff made throughout this codebase.
export const MANAGER_ROLES = [
  'EDITOR_MANAGER', 'VERIFICATION_MANAGER', 'REPORTER_APP_MANAGER', 'REPORTERS_MANAGER',
  'ADVERTISEMENT_MANAGER', 'LOCAL_ADS_MANAGER', 'ADMOB_MANAGER',
];

export interface HrScope {
  allAdmins: boolean;       // true = every admin (SUPER_ADMIN, or a granted plain ADMIN)
  teamType: string | null;  // set when scope is restricted to one team (granted *_MANAGER)
  canEdit: boolean;
}

// Workforce data (attendance, hours, payment) is SUPER_ADMIN-only by
// default. Super Admin can flip on a per-admin HRAccessGrant to let a
// specific ADMIN or *_MANAGER view (and optionally edit) it — see
// HRAccessGrant in schema.prisma. This can't be a static @Roles() list like
// most of the app, since it depends on a per-row DB grant, so it's its own
// guard that computes and attaches `req.hrScope` for the service layer to
// filter by.
@Injectable()
export class HrAccessGuard implements CanActivate {
  constructor(private prisma: PrismaService, private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Access denied');

    if (user.adminRole === 'SUPER_ADMIN') {
      req.hrScope = { allAdmins: true, teamType: null, canEdit: true } as HrScope;
      return true;
    }

    const requireEdit = this.reflector.getAllAndOverride<boolean>(HR_EDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]) ?? false;

    const grant = await this.prisma.hRAccessGrant.findUnique({ where: { adminId: user.id } });
    if (!grant || !grant.canView) {
      throw new ForbiddenException('You do not have access to workforce data');
    }
    if (requireEdit && !grant.canEdit) {
      throw new ForbiddenException('You have view-only workforce access');
    }

    const isManager = MANAGER_ROLES.includes(user.adminRole);
    req.hrScope = {
      allAdmins: !isManager,
      teamType: isManager ? (user.teamType ?? null) : null,
      canEdit: grant.canEdit,
    } as HrScope;
    return true;
  }
}
