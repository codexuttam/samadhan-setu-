import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parse, Errors } from '../lib/errors';
import { authenticate, csrfProtect, createActivationToken, hashPassword } from '../modules/authority/auth.service';
import { requirePermission } from '../modules/authority/rbac';
import { prisma } from '../lib/prisma';
import { audit } from '../modules/audit/audit.service';
import { getSettings, invalidateSettings } from '../lib/settings';

export const adminRouter = Router();

adminRouter.use(authenticate, csrfProtect);

// Create Authority Account
adminRouter.post(
  '/users',
  requirePermission('admin.users.manage'),
  asyncHandler(async (req, res) => {
    const data = parse(
      z.object({
        name: z.string().min(2),
        email: z.string().email(),
        roleId: z.string().uuid(),
        departmentId: z.string().uuid().optional(),
        zoneId: z.string().uuid().optional(),
        wardId: z.string().uuid().optional(),
      }),
      req.body,
    );

    const existing = await prisma.authorityUser.findUnique({ where: { email: data.email.toLowerCase().trim() } });
    if (existing) throw Errors.badRequest('An account with this email address already exists.');

    const user = await prisma.authorityUser.create({
      data: {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        roleId: data.roleId,
        departmentId: data.departmentId,
        zoneId: data.zoneId,
        wardId: data.wardId,
        status: 'PENDING_ACTIVATION',
        createdById: req.authUser!.id,
      },
    });

    const activationLink = await createActivationToken(user.id);

    await audit(
      {
        actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
        action: 'AUTHORITY_USER_CREATED',
        entity: 'AuthorityUser',
        entityId: user.id,
        ip: req.ip,
      },
    );

    res.status(201).json({ id: user.id, name: user.name, email: user.email, activationLink });
  }),
);

// Department & Ward Management
adminRouter.get(
  '/org',
  requirePermission('admin.org.manage'),
  asyncHandler(async (_req, res) => {
    const [departments, zones, wards, levels, roles] = await Promise.all([
      prisma.department.findMany({ orderBy: { name: 'asc' } }),
      prisma.zone.findMany({ orderBy: { name: 'asc' } }),
      prisma.ward.findMany({ include: { zone: true }, orderBy: { number: 'asc' } }),
      prisma.authorityLevel.findMany({ orderBy: { levelOrder: 'asc' } }),
      prisma.authorityRole.findMany({ include: { level: true } }),
    ]);

    res.json({ departments, zones, wards, levels, roles });
  }),
);

// Escalation & SLA Rules
adminRouter.get(
  '/rules',
  requirePermission('admin.rules.manage'),
  asyncHandler(async (_req, res) => {
    const rules = await prisma.escalationRule.findMany({
      include: { department: true },
      orderBy: { fromLevelOrder: 'asc' },
    });
    res.json({ rules });
  }),
);

adminRouter.post(
  '/rules',
  requirePermission('admin.rules.manage'),
  asyncHandler(async (req, res) => {
    const data = parse(
      z.object({
        departmentId: z.string().uuid().optional(),
        priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
        fromLevelOrder: z.coerce.number(),
        toLevelOrder: z.coerce.number(),
        slaHours: z.coerce.number().min(1),
      }),
      req.body,
    );

    const rule = await prisma.escalationRule.upsert({
      where: {
        departmentId_priority_fromLevelOrder: {
          departmentId: data.departmentId || null as any,
          priority: data.priority || null as any,
          fromLevelOrder: data.fromLevelOrder,
        },
      },
      update: { toLevelOrder: data.toLevelOrder, slaHours: data.slaHours, active: true },
      create: {
        departmentId: data.departmentId,
        priority: data.priority,
        fromLevelOrder: data.fromLevelOrder,
        toLevelOrder: data.toLevelOrder,
        slaHours: data.slaHours,
      },
    });

    await audit({ actor: { type: 'AUTHORITY', id: req.authUser!.id }, action: 'RULES_UPDATED', entity: 'EscalationRule', entityId: rule.id });
    res.json({ rule });
  }),
);
