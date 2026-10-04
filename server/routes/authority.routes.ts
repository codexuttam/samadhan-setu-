import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler, parse, Errors } from '../lib/errors';
import { authenticate, csrfProtect, login, logout, completeMfa, beginTotp, confirmTotp } from '../modules/authority/auth.service';
import { requirePermission, ticketScopeWhere, canWorkOn, inScope, PERMISSIONS } from '../modules/authority/rbac';
import { prisma } from '../lib/prisma';
import { manualTransitions } from '../modules/tickets/stateMachine';
import { transitionTicket } from '../modules/tickets/tickets.service';
import { validateFiles, presentAttachments } from '../modules/files/files.service';
import { maskPhone } from '../lib/logger';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024, files: 5 } });
export const authorityRouter = Router();

// Auth routes (unauthenticated)
authorityRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = parse(z.object({ email: z.string().email(), password: z.string() }), req.body);
    const result = await login(email, password, req, res);
    res.json(result);
  }),
);

authorityRouter.post(
  '/mfa/complete',
  asyncHandler(async (req, res) => {
    const { mfaToken, code } = parse(z.object({ mfaToken: z.string(), code: z.string().length(6) }), req.body);
    const result = await completeMfa(mfaToken, code, req, res);
    res.json(result);
  }),
);

// Protected routes middleware
authorityRouter.use(authenticate, csrfProtect);

authorityRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    await logout(req, res);
    res.json({ success: true });
  }),
);

authorityRouter.get('/me', (req, res) => {
  const u = req.authUser!;
  res.json({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.roleCode,
    roleName: u.roleName,
    scope: u.scope,
    levelOrder: u.levelOrder,
    permissions: Array.from(u.permissions),
    departmentId: u.departmentId,
    zoneId: u.zoneId,
    wardId: u.wardId,
    totpEnabled: u.totpEnabled,
  });
});

// Authority Dashboard Metrics
authorityRouter.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const u = req.authUser!;
    const scopeWhere = ticketScopeWhere(u);

    const [assignedToMe, pending, inProgress, slaApproaching, slaBreached, completed] = await Promise.all([
      prisma.ticket.count({ where: { assignedOfficerId: u.id, status: { notIn: ['RESOLVED', 'CLOSED'] } } }),
      prisma.ticket.count({ where: { ...scopeWhere, status: 'SUBMITTED' } }),
      prisma.ticket.count({ where: { ...scopeWhere, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({
        where: {
          ...scopeWhere,
          status: { in: ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS'] },
          slaDeadline: { lte: new Date(Date.now() + 6 * 3600_000), gte: new Date() },
        },
      }),
      prisma.ticket.count({
        where: {
          ...scopeWhere,
          status: { in: ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS'] },
          slaDeadline: { lte: new Date() },
        },
      }),
      prisma.ticket.count({ where: { ...scopeWhere, status: { in: ['RESOLVED', 'CLOSED'] } } }),
    ]);

    const recentEscalated = await prisma.escalation.findMany({
      where: { ticket: scopeWhere },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { ticket: { select: { publicReference: true, title: true, priority: true, status: true } } },
    });

    res.json({
      metrics: { assignedToMe, pending, inProgress, slaApproaching, slaBreached, completed },
      recentEscalated,
    });
  }),
);

// Complaints List with filtering
authorityRouter.get(
  '/complaints',
  requirePermission('ticket.view'),
  asyncHandler(async (req, res) => {
    const u = req.authUser!;
    const { status, priority, search, page = '1', limit = '20' } = req.query;
    const pageNum = Math.max(1, parseInt(page as string, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string, 10)));

    const where: any = {
      ...ticketScopeWhere(u),
      ...(status ? { status: status as any } : {}),
      ...(priority ? { priority: priority as any } : {}),
      ...(search
        ? {
            OR: [
              { publicReference: { contains: (search as string).trim(), mode: 'insensitive' } },
              { title: { contains: (search as string).trim(), mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [total, tickets] = await Promise.all([
      prisma.ticket.count({ where }),
      prisma.ticket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          category: { select: { name: true } },
          assignedOfficer: { select: { name: true } },
          ward: { select: { name: true, number: true } },
        },
      }),
    ]);

    res.json({
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      tickets: tickets.map((t) => ({
        id: t.id,
        publicReference: t.publicReference,
        category: t.category.name,
        title: t.title,
        status: t.status,
        priority: t.priority,
        assignedOfficer: t.assignedOfficer?.name || 'Unassigned',
        ward: t.ward ? `Ward ${t.ward.number}` : 'City-wide',
        slaDeadline: t.slaDeadline,
        createdAt: t.createdAt,
      })),
    });
  }),
);

// Single Complaint View (Masked Citizen Info)
authorityRouter.get(
  '/complaints/:id',
  requirePermission('ticket.view'),
  asyncHandler(async (req, res) => {
    const u = req.authUser!;
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: req.params.id },
      include: {
        category: true,
        department: true,
        ward: true,
        zone: true,
        contact: true,
        assignedOfficer: { select: { id: true, name: true, email: true } },
        attachments: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        internalNotes: { include: { author: { select: { name: true } } }, orderBy: { createdAt: 'desc' } },
        escalations: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!inScope(u, ticket)) throw Errors.forbidden('Outside scope');

    const attachments = await presentAttachments(ticket.attachments);
    const availableTransitions = manualTransitions(ticket.status).map((t) => t.to);

    res.json({
      ticket: {
        id: ticket.id,
        publicReference: ticket.publicReference,
        category: ticket.category.name,
        title: ticket.title,
        description: ticket.description,
        address: ticket.address,
        area: ticket.area,
        city: ticket.city,
        pincode: ticket.pincode,
        latitude: ticket.latitude,
        longitude: ticket.longitude,
        ward: ticket.ward ? `Ward ${ticket.ward.number} - ${ticket.ward.name}` : null,
        status: ticket.status,
        priority: ticket.priority,
        slaDeadline: ticket.slaDeadline,
        assignedOfficer: ticket.assignedOfficer,
        maskedPhone: maskPhone(ticket.contact?.phoneLast4 ? `+91000000${ticket.contact.phoneLast4}` : null),
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        attachments,
        timeline: ticket.statusHistory.map((h) => ({
          status: h.toStatus,
          note: h.publicNote,
          timestamp: h.createdAt,
          actor: h.actorLabel || h.actorType,
        })),
        internalNotes: ticket.internalNotes.map((n) => ({ id: n.id, author: n.author.name, body: n.body, createdAt: n.createdAt })),
        escalations: ticket.escalations,
      },
      availableTransitions,
      canAct: canWorkOn(u, ticket),
    });
  }),
);

// Update Ticket Status / Mark Work Completed
authorityRouter.post(
  '/complaints/:id/transition',
  upload.array('evidence', 5),
  asyncHandler(async (req, res) => {
    const files = await validateFiles(req.files as any);
    const { toStatus, publicNote, internalNote, resolutionNote, newAssigneeId } = parse(
      z.object({
        toStatus: z.string(),
        publicNote: z.string().optional(),
        internalNote: z.string().optional(),
        resolutionNote: z.string().optional(),
        newAssigneeId: z.string().uuid().optional(),
      }),
      req.body,
    );

    const updated = await transitionTicket({
      ticketId: req.params.id,
      toStatus: toStatus as any,
      actor: { type: 'AUTHORITY', user: req.authUser },
      publicNote,
      internalNote,
      resolutionNote,
      newAssigneeId,
      evidence: files,
      ip: req.ip,
    });

    res.json({ success: true, status: updated.status });
  }),
);
