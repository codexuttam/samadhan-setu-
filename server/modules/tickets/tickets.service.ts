import type { ActorType, Prisma, TicketPriority, TicketStatus } from '@prisma/client';
import { prisma, withTx, type Tx } from '../../lib/prisma';
import { encrypt, phoneHash } from '../../lib/crypto';
import { AppError, Errors } from '../../lib/errors';
import { getSettings } from '../../lib/settings';
import { audit } from '../audit/audit.service';
import { consumeCreateVerification, requirePhone } from '../otp/otp.service';
import { findTransition, manualTransitions, slaApplies } from './stateMachine';
import { createNotification, dispatch } from '../notifications/notifications.service';
import { recordAttachments, storeFiles, type ValidatedFile } from '../files/files.service';
import { canWorkOn, inScope, type AuthUser } from '../authority/rbac';

export interface CreateTicketInput {
  categoryId: string;
  subcategory?: string;
  title: string;
  description: string;
  address: string;
  area: string;
  wardId?: string;
  city: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  phone: string;
  otpVerificationToken: string;
  evidence: ValidatedFile[];
  ip?: string;
}

/** Generate a formatted public reference: SS-2026-000184. Atomic via DB sequence table. */
async function nextPublicReference(tx: Tx): Promise<string> {
  const year = new Date().getFullYear();
  await tx.$executeRaw`
    INSERT INTO "TicketSequence" ("year", "lastValue") VALUES (${year}, 1)
    ON CONFLICT ("year") DO UPDATE SET "lastValue" = "TicketSequence"."lastValue" + 1;
  `;
  const row = await tx.ticketSequence.findUniqueOrThrow({ where: { year } });
  return `SS-${year}-${row.lastValue.toString().padStart(6, '0')}`;
}

async function calcSla(tx: Tx, departmentId: string, priority: TicketPriority, fromLevelOrder = 1) {
  const rule = await tx.escalationRule.findFirst({
    where: { active: true, fromLevelOrder, OR: [{ departmentId, priority }, { departmentId, priority: null }, { departmentId: null, priority: null }] },
    orderBy: [{ departmentId: 'desc' }, { priority: 'desc' }],
  });
  const hours = rule?.slaHours ?? (await getSettings()).sla.defaultHours;
  return new Date(Date.now() + hours * 3600_000);
}

// ─────────────────────────────────────────────────────────────
// Citizen: Raise Complaint (Phase 2 & 4)
// ─────────────────────────────────────────────────────────────
export async function createTicket(input: CreateTicketInput) {
  const e164 = requirePhone(input.phone);
  const category = await prisma.ticketCategory.findUnique({ where: { id: input.categoryId }, include: { department: true } });
  if (!category || !category.active) throw Errors.badRequest('Please choose a valid issue category.');

  let ward: { id: string; zoneId: string } | null = null;
  if (input.wardId) {
    ward = await prisma.ward.findUnique({ where: { id: input.wardId }, select: { id: true, zoneId: true } });
  }

  const storedFiles = await storeFiles(input.evidence);

  const { ticket, notifId } = await withTx(async (tx) => {
    await consumeCreateVerification(tx, input.otpVerificationToken, e164);
    const publicRef = await nextPublicReference(tx);
    const slaDeadline = await calcSla(tx, category.departmentId, category.defaultPriority, 1);

    const t = await tx.ticket.create({
      data: {
        publicReference: publicRef,
        categoryId: category.id,
        subcategory: input.subcategory?.trim(),
        title: input.title.trim(),
        description: input.description.trim(),
        address: input.address.trim(),
        area: input.area.trim(),
        city: input.city.trim() || 'Dwarka, Delhi',
        pincode: input.pincode.trim(),
        latitude: input.latitude,
        longitude: input.longitude,
        wardId: ward?.id ?? null,
        zoneId: ward?.zoneId ?? null,
        departmentId: category.departmentId,
        priority: category.defaultPriority,
        status: 'SUBMITTED',
        slaDeadline,
        currentLevelOrder: 1,
        escalationLevel: 0,
      },
    });

    await tx.ticketContact.create({
      data: {
        ticketId: t.id,
        phoneEncrypted: encrypt(e164),
        phoneHash: phoneHash(e164),
        phoneLast4: e164.slice(-4),
      },
    });

    if (storedFiles.length) {
      await recordAttachments(tx, t.id, storedFiles, 'CITIZEN_EVIDENCE', { type: 'CITIZEN' });
    }

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: t.id,
        fromStatus: null,
        toStatus: 'SUBMITTED',
        actorType: 'CITIZEN',
        publicNote: 'Complaint registered successfully by citizen.',
      },
    });

    const notifId = await createNotification(tx, t.id, 'TICKET_CREATED', 'init');

    await audit(
      { actor: { type: 'CITIZEN' }, action: 'COMPLAINT_CREATED', ticketId: t.id, entity: 'Ticket', entityId: t.id, ip: input.ip },
      tx,
    );

    return { ticket: t, notifId };
  });

  dispatch([notifId]);
  return { ticketId: ticket.id, publicReference: ticket.publicReference };
}

// ─────────────────────────────────────────────────────────────
// Core status transition runner (Deterministic State Machine)
// ─────────────────────────────────────────────────────────────
export interface TransitionInput {
  ticketId: string;
  toStatus: TicketStatus;
  actor: { type: ActorType; user?: AuthUser };
  publicNote?: string;
  internalNote?: string;
  resolutionNote?: string;
  evidence?: ValidatedFile[];
  newAssigneeId?: string;
  newDepartmentId?: string;
  newWardId?: string;
  ip?: string;
}

export async function transitionTicket(input: TransitionInput) {
  const storedProof = input.evidence?.length ? await storeFiles(input.evidence) : [];

  const { ticket, notifId } = await withTx(async (tx) => {
    const t = await tx.ticket.findUniqueOrThrow({
      where: { id: input.ticketId },
      include: { category: true, assignedOfficer: true },
    });

    const rule = findTransition(t.status, input.toStatus, input.actor.type);
    if (!rule) throw Errors.invalidTransition(t.status, input.toStatus);

    if (input.actor.type === 'AUTHORITY') {
      const u = input.actor.user!;
      if (!inScope(u, t)) throw Errors.forbidden('This complaint is outside your assigned ward or department.');
      if (rule.permission && !u.permissions.has(rule.permission)) throw Errors.forbidden();
      if (rule.assigneeOnly && !canWorkOn(u, t)) {
        throw Errors.forbidden('This complaint is currently assigned to another officer.');
      }
    }

    if (input.toStatus === 'WORK_COMPLETED') {
      if (!input.resolutionNote?.trim()) throw Errors.badRequest('Please enter a description of the work completed.');
      if (t.category.requiresCompletionProof && storedProof.length === 0) {
        throw Errors.badRequest('This category requires photo evidence of completed work.');
      }
    }

    const updates: Prisma.TicketUpdateInput = {
      status: input.toStatus,
      version: { increment: 1 },
    };

    if (input.toStatus === 'WORK_COMPLETED') {
      updates.completedAt = new Date();
      updates.completedBy = input.actor.user ? { connect: { id: input.actor.user.id } } : undefined;
      updates.resolutionNote = input.resolutionNote?.trim();
      // Instantly advance to verification
      updates.status = 'AWAITING_CITIZEN_VERIFICATION';
    } else if (input.toStatus === 'RESOLVED') {
      updates.resolvedAt = new Date();
      updates.status = 'RESOLVED';
    } else if (input.toStatus === 'CLOSED') {
      updates.closedAt = new Date();
    } else if (input.toStatus === 'REOPENED') {
      updates.reopenCount = { increment: 1 };
      // Reset SLA on reopen
      updates.slaDeadline = await calcSla(tx, t.departmentId, t.priority, t.currentLevelOrder);
    }

    // Reassignment if requested alongside status update
    if (input.newAssigneeId) {
      const officer = await tx.authorityUser.findUnique({ where: { id: input.newAssigneeId }, include: { role: { include: { level: true } } } });
      if (!officer || officer.status !== 'ACTIVE') throw Errors.badRequest('Invalid officer selected for assignment.');
      updates.assignedOfficer = { connect: { id: officer.id } };
      updates.currentLevelOrder = officer.role.level.levelOrder;
    }

    const updated = await tx.ticket.update({
      where: { id: t.id, version: t.version }, // Optimistic Concurrency
      data: updates,
    });

    if (storedProof.length) {
      await recordAttachments(tx, t.id, storedProof, 'COMPLETION_PROOF', {
        type: input.actor.type,
        id: input.actor.user?.id,
      });
    }

    if (input.internalNote?.trim() && input.actor.user) {
      await tx.ticketInternalNote.create({
        data: { ticketId: t.id, authorId: input.actor.user.id, body: input.internalNote.trim() },
      });
    }

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: t.id,
        fromStatus: t.status,
        toStatus: updated.status,
        actorType: input.actor.type,
        actorId: input.actor.user?.id,
        actorLabel: input.actor.user ? `${input.actor.user.name} (${input.actor.user.roleName})` : input.actor.type,
        publicNote: input.publicNote || rule.publicLabel,
      },
    });

    let notifEvent: any = 'STATUS_UPDATED';
    if (updated.status === 'AWAITING_CITIZEN_VERIFICATION') notifEvent = 'WORK_COMPLETED';
    else if (updated.status === 'REOPENED') notifEvent = 'COMPLAINT_REOPENED';
    else if (updated.status === 'CLOSED') notifEvent = 'COMPLAINT_CLOSED';

    const notifId = await createNotification(tx, t.id, notifEvent, `${t.version}`);

    await audit(
      {
        actor: { type: input.actor.type, id: input.actor.user?.id, role: input.actor.user?.roleCode },
        action: updated.status === 'WORK_COMPLETED' ? 'WORK_COMPLETED' : 'STATUS_CHANGED',
        ticketId: t.id,
        metadata: { from: t.status, to: updated.status },
        ip: input.ip,
      },
      tx,
    );

    return { ticket: updated, notifId };
  });

  dispatch([notifId]);
  return ticket;
}
