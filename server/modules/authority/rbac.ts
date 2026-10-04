import type { AuthorityScope, Prisma } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { Errors } from '../../lib/errors';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  roleCode: string;
  roleName: string;
  scope: AuthorityScope;
  levelOrder: number;
  levelName: string;
  permissions: Set<string>;
  departmentId: string | null;
  zoneId: string | null;
  wardId: string | null;
  sessionId: string;
  totpEnabled: boolean;
}

declare module 'express-serve-static-core' {
  interface Request {
    authUser?: AuthUser;
  }
}

export const PERMISSIONS = {
  'ticket.view': 'View complaints within scope',
  'ticket.accept': 'Accept an assigned complaint',
  'ticket.update_status': 'Move a complaint through work statuses',
  'ticket.note.add': 'Add internal notes',
  'ticket.evidence.upload': 'Upload work evidence',
  'ticket.complete': 'Mark work completed',
  'ticket.assign': 'Assign / reassign officers within scope',
  'ticket.escalate': 'Escalate a complaint upward',
  'ticket.close': 'Close a resolved complaint',
  'ticket.reopen_closed': 'Reopen a closed complaint',
  'sla.monitor': 'Monitor SLA and escalations',
  'reports.view': 'View reports and analytics',
  'audit.view': 'View audit logs',
  'admin.users.manage': 'Create and manage authority accounts',
  'admin.roles.manage': 'Manage roles and permissions',
  'admin.org.manage': 'Manage departments, zones and wards',
  'admin.rules.manage': 'Configure escalation / SLA rules and categories',
  'admin.settings.manage': 'Manage platform configuration',
} as const;

export type Permission = keyof typeof PERMISSIONS;

export function has(user: AuthUser, p: Permission) {
  return user.permissions.has(p);
}

/** Express middleware — every authority API declares the permission it needs. */
export const requirePermission =
  (...perms: Permission[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const u = req.authUser;
    if (!u) return next(Errors.unauthorized());
    if (!perms.every((p) => u.permissions.has(p))) return next(Errors.forbidden());
    next();
  };

/** Attribute-based scope: which tickets a user can see at all. Enforced in every query. */
export function ticketScopeWhere(u: AuthUser): Prisma.TicketWhereInput {
  const dept = u.departmentId ? { departmentId: u.departmentId } : {};
  switch (u.scope) {
    case 'WARD':
      return u.wardId ? { wardId: u.wardId, ...dept } : { id: '00000000-0000-0000-0000-000000000000' };
    case 'ZONE':
      return u.zoneId ? { zoneId: u.zoneId, ...dept } : { id: '00000000-0000-0000-0000-000000000000' };
    case 'DEPARTMENT':
      return u.departmentId ? { departmentId: u.departmentId } : { id: '00000000-0000-0000-0000-000000000000' };
    case 'DISTRICT':
    case 'SYSTEM':
      return {};
  }
}

export function inScope(
  u: AuthUser,
  t: { departmentId: string; zoneId: string | null; wardId: string | null },
) {
  const deptOk = !u.departmentId || u.departmentId === t.departmentId;
  switch (u.scope) {
    case 'WARD':
      return !!u.wardId && u.wardId === t.wardId && deptOk;
    case 'ZONE':
      return !!u.zoneId && u.zoneId === t.zoneId && deptOk;
    case 'DEPARTMENT':
      return !!u.departmentId && u.departmentId === t.departmentId;
    default:
      return true;
  }
}

/** Is the user allowed to perform assignee-only work on this ticket? */
export function canWorkOn(u: AuthUser, t: { assignedOfficerId: string | null; currentLevelOrder: number }) {
  if (t.assignedOfficerId) return t.assignedOfficerId === u.id;
  // unowned queue at the user's level (or below, for seniors) — acting claims it
  return u.levelOrder >= t.currentLevelOrder;
}
