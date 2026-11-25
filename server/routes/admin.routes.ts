import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler, parse, Errors } from '../lib/errors';
import { authenticate, csrfProtect, createActivationToken } from '../modules/authority/auth.service';
import { requirePermission } from '../modules/authority/rbac';
import { prisma } from '../lib/prisma';
import { audit } from '../modules/audit/audit.service';
import { DEFAULT_SETTINGS, getSettings, invalidateSettings, type SettingKey } from '../lib/settings';

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

// List Authority Accounts
adminRouter.get(
  '/users',
  requirePermission('admin.users.manage'),
  asyncHandler(async (req, res) => {
    const { status, departmentId, search, page, limit } = parse(
      z.object({
        status: z.enum(['PENDING_ACTIVATION', 'ACTIVE', 'SUSPENDED']).optional(),
        departmentId: z.string().uuid().optional(),
        search: z.string().max(120).optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(50).default(20),
      }),
      req.query,
    );
    const pageNum = page ?? 1;
    const limitNum = limit ?? 20;

    const where: any = {
      ...(status ? { status } : {}),
      ...(departmentId ? { departmentId } : {}),
      ...(search?.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: 'insensitive' } },
              { email: { contains: search.trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.authorityUser.count({ where }),
      prisma.authorityUser.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        select: {
          id: true,
          name: true,
          email: true,
          status: true,
          totpEnabled: true,
          lastLoginAt: true,
          createdAt: true,
          role: { select: { id: true, code: true, name: true, scope: true } },
          department: { select: { id: true, code: true, name: true } },
          zone: { select: { id: true, name: true } },
          ward: { select: { id: true, number: true, name: true } },
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      users,
    });
  }),
);

// Suspend or Reactivate Authority Account
adminRouter.patch(
  '/users/:id/status',
  requirePermission('admin.users.manage'),
  asyncHandler(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params);
    const { status } = parse(z.object({ status: z.enum(['ACTIVE', 'SUSPENDED']) }), req.body);

    if (id === req.authUser!.id && status === 'SUSPENDED') {
      throw Errors.badRequest('You cannot suspend your own account.');
    }

    const existing = await prisma.authorityUser.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound('Authority user');

    const updated = await prisma.$transaction(async (tx) => {
      const user = await tx.authorityUser.update({
        where: { id },
        data: { status },
        select: { id: true, name: true, email: true, status: true },
      });

      if (status === 'SUSPENDED') {
        await tx.authoritySession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return user;
    });

    await audit({
      actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
      action: 'AUTHORITY_USER_UPDATED',
      entity: 'AuthorityUser',
      entityId: id,
      ip: req.ip,
      metadata: { targetUserId: id, status },
    });

    res.json({ user: updated });
  }),
);

// Resend Activation Link for Pending Account
adminRouter.post(
  '/users/:id/resend-activation',
  requirePermission('admin.users.manage'),
  asyncHandler(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params);
    const user = await prisma.authorityUser.findUnique({ where: { id } });
    if (!user) throw Errors.notFound('Authority user');
    if (user.status !== 'PENDING_ACTIVATION') {
      throw Errors.badRequest('Activation link can only be resent for pending accounts.');
    }

    const activationLink = await createActivationToken(user.id);

    await audit({
      actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
      action: 'AUTHORITY_USER_UPDATED',
      entity: 'AuthorityUser',
      entityId: user.id,
      ip: req.ip,
      metadata: { activationLinkResent: true },
    });

    res.json({ id: user.id, activationLink });
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
        fromLevelOrder: z.coerce.number().int().min(1),
        toLevelOrder: z.coerce.number().int().min(1),
        slaHours: z.coerce.number().int().min(1),
      }).refine((r) => r.toLevelOrder > r.fromLevelOrder, {
        message: 'toLevelOrder must be greater than fromLevelOrder',
        path: ['toLevelOrder'],
      }),
      req.body,
    );

    // Prisma cannot use NULL values inside a compound-unique `where`, and
    // Postgres treats NULLs as distinct in unique indexes — so match explicitly.
    const match = {
      departmentId: data.departmentId ?? null,
      priority: data.priority ?? null,
      fromLevelOrder: data.fromLevelOrder,
    };

    const rule = await prisma.$transaction(async (tx) => {
      const existing = await tx.escalationRule.findFirst({ where: match });
      if (existing) {
        return tx.escalationRule.update({
          where: { id: existing.id },
          data: { toLevelOrder: data.toLevelOrder, slaHours: data.slaHours, active: true },
        });
      }
      return tx.escalationRule.create({
        data: { ...match, toLevelOrder: data.toLevelOrder, slaHours: data.slaHours },
      });
    });

    await audit({
      actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
      action: 'RULES_UPDATED',
      entity: 'EscalationRule',
      entityId: rule.id,
      ip: req.ip,
      metadata: { ...match, toLevelOrder: rule.toLevelOrder, slaHours: rule.slaHours },
    });
    res.json({ rule });
  }),
);

adminRouter.delete(
  '/rules/:id',
  requirePermission('admin.rules.manage'),
  asyncHandler(async (req, res) => {
    const { id } = parse(z.object({ id: z.string().uuid() }), req.params);
    const existing = await prisma.escalationRule.findUnique({ where: { id } });
    if (!existing) throw Errors.notFound('Escalation rule');

    const rule = await prisma.escalationRule.update({
      where: { id },
      data: { active: false },
    });

    await audit({
      actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
      action: 'RULES_UPDATED',
      entity: 'EscalationRule',
      entityId: id,
      ip: req.ip,
      metadata: { deactivated: true },
    });

    res.json({ rule });
  }),
);

// System Settings Management
adminRouter.get(
  '/settings',
  requirePermission('admin.settings.manage'),
  asyncHandler(async (_req, res) => {
    res.json({ settings: await getSettings() });
  }),
);

adminRouter.patch(
  '/settings/:key',
  requirePermission('admin.settings.manage'),
  asyncHandler(async (req, res) => {
    const { key } = parse(z.object({ key: z.string().min(1) }), req.params);
    if (!(key in DEFAULT_SETTINGS)) {
      throw Errors.badRequest(`Unknown setting key: ${key}`);
    }

    const settingKey = key as SettingKey;
    const template = DEFAULT_SETTINGS[settingKey] as Record<string, number>;
    const shape: Record<string, z.ZodTypeAny> = {};
    for (const subKey of Object.keys(template)) {
      shape[subKey] = z.number().finite().positive().optional();
    }

    const updates = parse(z.object(shape).strict(), req.body);
    if (Object.keys(updates).length === 0) {
      throw Errors.badRequest('Provide at least one setting field to update.');
    }

    const existing = await prisma.systemSetting.findUnique({ where: { key: settingKey } });
    const mergedValue = {
      ...((existing?.value && typeof existing.value === 'object' ? existing.value : {}) as Record<string, unknown>),
      ...updates,
    };

    await prisma.systemSetting.upsert({
      where: { key: settingKey },
      update: { value: mergedValue as any, updatedById: req.authUser!.id },
      create: { key: settingKey, value: mergedValue as any, updatedById: req.authUser!.id },
    });

    invalidateSettings();

    await audit({
      actor: { type: 'AUTHORITY', id: req.authUser!.id, role: req.authUser!.roleCode },
      action: 'SETTINGS_UPDATED',
      entity: 'SystemSetting',
      entityId: settingKey,
      ip: req.ip,
      metadata: { key: settingKey, value: updates },
    });

    res.json({ settings: await getSettings() });
  }),
);

// Audit Log Viewer
adminRouter.get(
  '/audit-logs',
  requirePermission('audit.view'),
  asyncHandler(async (req, res) => {
    const { action, actorType, ticketId, page, limit } = parse(
      z.object({
        action: z.string().max(80).optional(),
        actorType: z.enum(['CITIZEN', 'AUTHORITY', 'SYSTEM']).optional(),
        ticketId: z.string().uuid().optional(),
        page: z.coerce.number().int().min(1).default(1),
        limit: z.coerce.number().int().min(1).max(100).default(25),
      }),
      req.query,
    );
    const pageNum = page ?? 1;
    const limitNum = limit ?? 25;

    const where: any = {
      ...(action?.trim() ? { action: action.trim() } : {}),
      ...(actorType ? { actorType } : {}),
      ...(ticketId ? { ticketId } : {}),
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      logs,
    });
  }),
);
