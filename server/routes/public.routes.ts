import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { asyncHandler, parse, Errors } from '../lib/errors';
import { requestOtp, verifyCreateOtp, verifyTrackOtp } from '../modules/otp/otp.service';
import { createTicket } from '../modules/tickets/tickets.service';
import { validateFiles, presentAttachments } from '../modules/files/files.service';
import { resolveAccessToken } from '../modules/tracking/accessTokens';
import { prisma } from '../lib/prisma';
import { processCitizenVerification } from '../modules/tickets/verification.service';

const upload = multer({ limits: { fileSize: 50 * 1024 * 1024, files: 5 } });
export const publicRouter = Router();

// Categories listing
publicRouter.get(
  '/categories',
  asyncHandler(async (_req, res) => {
    const categories = await prisma.ticketCategory.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, code: true, name: true, description: true, defaultPriority: true },
    });
    const wards = await prisma.ward.findMany({
      where: { active: true },
      orderBy: { number: 'asc' },
      select: { id: true, code: true, name: true, number: true },
    });
    res.json({ categories, wards });
  }),
);

// OTP Request
publicRouter.post(
  '/otp/request',
  asyncHandler(async (req, res) => {
    const data = parse(
      z.object({
        phone: z.string().min(10),
        purpose: z.enum(['CREATE_TICKET', 'TRACK_TICKET']),
        publicReference: z.string().optional(),
      }),
      req.body,
    );
    const result = await requestOtp({ ...data, ip: req.ip });
    res.json(result);
  }),
);

// OTP Verify (Create flow)
publicRouter.post(
  '/otp/verify-create',
  asyncHandler(async (req, res) => {
    const data = parse(z.object({ challengeId: z.string(), code: z.string().length(6) }), req.body);
    const token = await verifyCreateOtp(data.challengeId, data.code);
    res.json({ token });
  }),
);

// OTP Verify (Track flow)
publicRouter.post(
  '/otp/verify-track',
  asyncHandler(async (req, res) => {
    const data = parse(z.object({ challengeId: z.string(), code: z.string().length(6) }), req.body);
    const accessToken = await verifyTrackOtp(data.challengeId, data.code);
    res.json({ accessToken });
  }),
);

// Create Complaint
publicRouter.post(
  '/complaints',
  upload.array('evidence', 5),
  asyncHandler(async (req, res) => {
    const files = await validateFiles(req.files as any);
    const body = parse(
      z.object({
        categoryId: z.string().uuid(),
        subcategory: z.string().optional(),
        title: z.string().min(5).max(120),
        description: z.string().min(10).max(2000),
        address: z.string().min(5).max(250),
        area: z.string().min(2).max(100),
        wardId: z.string().uuid().optional(),
        city: z.string().default('Amravati'),
        pincode: z.string().min(6).max(6),
        latitude: z.coerce.number().optional(),
        longitude: z.coerce.number().optional(),
        phone: z.string(),
        otpVerificationToken: z.string(),
      }),
      req.body,
    );

    const result = await createTicket({ ...body, city: body.city || 'Amravati', evidence: files, ip: req.ip });
    res.status(201).json(result);
  }),
);

// Public Tracking by Secure Access Token
publicRouter.get(
  '/track/secure/:token',
  asyncHandler(async (req, res) => {
    const access = await resolveAccessToken(req.params.token, 'ANY');
    const ticket = await prisma.ticket.findUniqueOrThrow({
      where: { id: access.ticketId },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        ward: { select: { name: true, number: true } },
        attachments: { orderBy: { createdAt: 'asc' } },
        statusHistory: { orderBy: { createdAt: 'asc' } },
      },
    });

    const attachments = await presentAttachments(ticket.attachments);

    res.json({
      ticket: {
        id: access.id, // Scoped token ID
        publicReference: ticket.publicReference,
        category: ticket.category.name,
        subcategory: ticket.subcategory,
        title: ticket.title,
        description: ticket.description,
        address: ticket.address,
        area: ticket.area,
        ward: ticket.ward ? `Ward ${ticket.ward.number} - ${ticket.ward.name}` : null,
        status: ticket.status,
        priority: ticket.priority,
        resolutionNote: ticket.resolutionNote,
        completedAt: ticket.completedAt,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        attachments,
        timeline: ticket.statusHistory.map((h) => ({
          status: h.toStatus,
          note: h.publicNote,
          timestamp: h.createdAt,
          actor: h.actorLabel || h.actorType,
        })),
      },
      tokenScope: access.scope,
    });
  }),
);

// Verification and Dispute Submission
publicRouter.post(
  '/verify/:token',
  upload.array('evidence', 5),
  asyncHandler(async (req, res) => {
    const access = await resolveAccessToken(req.params.token, 'VERIFY');
    const files = await validateFiles(req.files as any);
    const body = parse(
      z.object({
        outcome: z.enum(['RESOLVED', 'NOT_RESOLVED']),
        comment: z.string().optional(),
        reviewDescription: z.string().optional(),
        rating: z.coerce.number().optional(),
      }),
      req.body,
    );

    const ticket = await processCitizenVerification({
      ticketAccessTokenId: access.id,
      ticketId: access.ticketId,
      ...body,
      evidence: files,
      ip: req.ip,
    });

    res.json({ status: ticket.status, publicReference: ticket.publicReference });
  }),
);
