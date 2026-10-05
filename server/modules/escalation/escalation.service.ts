import { prisma, withTx } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { AppError, Errors } from '../../lib/errors';
import { createNotification, dispatch } from '../notifications/notifications.service';
import { audit } from '../audit/audit.service';
import { queue } from '../queue/queue';
import type { AuthUser } from '../authority/rbac';

const ESCALATION_JOB = 'escalation-sla-check';
const WARNING_JOB = 'escalation-sla-warning-check';
export const MAX_ESCALATION_LEVEL = 4;

/**
 * SLA Warning Processor: Sends proactive warnings for tickets approaching SLA deadline.
 */
export async function checkSlaWarnings() {
  try {
    const upcomingTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS', 'REOPENED', 'ESCALATED'] },
        slaWarningSent: false,
        slaDeadline: { gte: new Date(), lte: new Date(Date.now() + 12 * 3600_000) },
      },
      take: 50,
    });

    for (const t of upcomingTickets) {
      try {
        const notifId = await withTx(async (tx) => {
          await tx.ticket.update({
            where: { id: t.id },
            data: { slaWarningSent: true },
          });

          await tx.ticketStatusHistory.create({
            data: {
              ticketId: t.id,
              fromStatus: t.status,
              toStatus: t.status,
              actorType: 'SYSTEM',
              publicNote: `SLA Warning: SLA deadline is approaching in less than 12 hours (${t.slaDeadline?.toLocaleString('en-IN')}).`,
            },
          });

          const notifId = await createNotification(tx, t.id, 'SLA_WARNING', `warn_${t.version}`);

          await audit(
            {
              actor: { type: 'SYSTEM' },
              action: 'SLA_WARNING_TRIGGERED',
              ticketId: t.id,
              metadata: { slaDeadline: t.slaDeadline },
            },
            tx,
          );

          return notifId;
        });

        if (notifId) dispatch([notifId]);
      } catch (err) {
        logger.error('Failed processing SLA warning for ticket', { ticketId: t.id, err: err as Error });
      }
    }
  } catch (err) {
    logger.error('SLA Warning worker iteration error', { err: err as Error });
  }
}

/**
 * Idempotent SLA Escalation Processor.
 * Automatically checks for overdue tickets and escalates them to the next hierarchy level.
 */
export async function checkSlaEscalations() {
  try {
    const overdueTickets = await prisma.ticket.findMany({
      where: {
        status: { in: ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS', 'REOPENED'] },
        slaDeadline: { lte: new Date() },
      },
      include: {
        department: true,
        assignedOfficer: { include: { role: { include: { level: true } } } },
      },
      take: 50,
    });

    for (const t of overdueTickets) {
      const fromLevelOrder = t.currentLevelOrder;
      const targetLevel = fromLevelOrder + 1;
      const isMaxLevelReached = targetLevel > MAX_ESCALATION_LEVEL;

      // Find next authority officer at next level
      let nextOfficer = null;
      if (!isMaxLevelReached) {
        nextOfficer = await prisma.authorityUser.findFirst({
          where: {
            departmentId: t.departmentId,
            role: { level: { levelOrder: targetLevel } },
            status: 'ACTIVE',
          },
          include: { role: { include: { level: true } } },
        });
      }

      // If no department officer at next level, search for admin user fallback
      if (!nextOfficer) {
        nextOfficer = await prisma.authorityUser.findFirst({
          where: {
            role: { code: 'SUPER_ADMIN' },
            status: 'ACTIVE',
          },
          include: { role: { include: { level: true } } },
        });
      }

      const toLevelOrder = nextOfficer?.role?.level?.levelOrder ? Math.min(nextOfficer.role.level.levelOrder, MAX_ESCALATION_LEVEL) : fromLevelOrder;
      const idempotencyKey = `sla_breach:${t.id}:${fromLevelOrder}->${toLevelOrder}:${t.escalationLevel + 1}`;

      try {
        const { notifId } = await withTx(async (tx) => {
          // Prevent duplicate escalation records if already processed
          const existingEsc = await tx.escalation.findUnique({ where: { idempotencyKey } });
          if (existingEsc) return { notifId: null };

          // Next SLA rule calculation
          const rule = await tx.escalationRule.findFirst({
            where: { active: true, fromLevelOrder: toLevelOrder, departmentId: t.departmentId },
          });
          const nextSlaHours = rule?.slaHours ?? 24;
          const newDeadline = new Date(Date.now() + nextSlaHours * 3600_000);

          const updated = await tx.ticket.update({
            where: { id: t.id, version: t.version },
            data: {
              status: 'ESCALATED',
              currentLevelOrder: toLevelOrder,
              escalationLevel: { increment: 1 },
              assignedOfficerId: nextOfficer ? nextOfficer.id : t.assignedOfficerId,
              slaDeadline: newDeadline,
              slaWarningSent: false, // Reset SLA warning for the new level
              version: { increment: 1 },
            },
          });

          await tx.escalation.create({
            data: {
              ticketId: t.id,
              sequence: updated.escalationLevel,
              reason: 'SLA_BREACHED',
              fromLevelOrder,
              toLevelOrder,
              fromAuthorityId: t.assignedOfficerId,
              toAuthorityId: nextOfficer ? nextOfficer.id : null,
              breachedDeadline: t.slaDeadline,
              note: isMaxLevelReached
                ? `Maximum escalation level (${MAX_ESCALATION_LEVEL}) reached. Escalated to District Administration.`
                : `Automatic SLA breach escalation from Level ${fromLevelOrder} to Level ${toLevelOrder}.`,
              idempotencyKey,
            },
          });

          await tx.ticketStatusHistory.create({
            data: {
              ticketId: t.id,
              fromStatus: t.status,
              toStatus: 'ESCALATED',
              actorType: 'SYSTEM',
              publicNote: isMaxLevelReached
                ? `SLA Breached. Escalated to District Administration (Max level reached).`
                : `SLA Breached. Escalated automatically to Level ${toLevelOrder} authority.`,
            },
          });

          const notifId = await createNotification(tx, t.id, 'COMPLAINT_ESCALATED', `esc_${updated.version}`);

          await audit(
            {
              actor: { type: 'SYSTEM' },
              action: 'ESCALATED',
              ticketId: t.id,
              metadata: { fromLevel: fromLevelOrder, toLevel: toLevelOrder, reason: 'SLA_BREACH', maxReached: isMaxLevelReached },
            },
            tx,
          );

          return { notifId };
        });

        if (notifId) dispatch([notifId]);
      } catch (err) {
        logger.error('Failed to escalate ticket SLA', { ticketId: t.id, err: err as Error });
      }
    }
  } catch (err) {
    logger.error('SLA Escalation worker iteration error', { err: err as Error });
  }
}

/**
 * Manual Escalation triggered by authorized admin/officer.
 */
export async function manualEscalateTicket(params: {
  ticketId: string;
  actor: AuthUser;
  reason: string;
  targetOfficerId?: string;
  ip?: string;
}) {
  const { ticketId, actor, reason, targetOfficerId, ip } = params;

  const { ticket, notifId } = await withTx(async (tx) => {
    const t = await tx.ticket.findUniqueOrThrow({
      where: { id: ticketId },
      include: { department: true },
    });

    if (['RESOLVED', 'CLOSED'].includes(t.status)) {
      throw Errors.badRequest('Cannot escalate a resolved or closed complaint.');
    }

    let targetOfficer = null;
    if (targetOfficerId) {
      targetOfficer = await tx.authorityUser.findUnique({
        where: { id: targetOfficerId },
        include: { role: { include: { level: true } } },
      });
      if (!targetOfficer || targetOfficer.status !== 'ACTIVE') {
        throw Errors.badRequest('Selected target officer is invalid or inactive.');
      }
    } else {
      const nextLevel = Math.min(t.currentLevelOrder + 1, MAX_ESCALATION_LEVEL);
      targetOfficer = await tx.authorityUser.findFirst({
        where: {
          departmentId: t.departmentId,
          role: { level: { levelOrder: nextLevel } },
          status: 'ACTIVE',
        },
        include: { role: { include: { level: true } } },
      });
    }

    const toLevelOrder = targetOfficer?.role?.level?.levelOrder ?? Math.min(t.currentLevelOrder + 1, MAX_ESCALATION_LEVEL);
    const newSeq = t.escalationLevel + 1;
    const idempotencyKey = `manual_esc:${t.id}:${newSeq}:${Date.now()}`;

    // Calculate new SLA deadline
    const rule = await tx.escalationRule.findFirst({
      where: { active: true, fromLevelOrder: toLevelOrder, departmentId: t.departmentId },
    });
    const nextSlaHours = rule?.slaHours ?? 24;
    const newDeadline = new Date(Date.now() + nextSlaHours * 3600_000);

    const updated = await tx.ticket.update({
      where: { id: t.id, version: t.version },
      data: {
        status: 'ESCALATED',
        currentLevelOrder: toLevelOrder,
        escalationLevel: { increment: 1 },
        assignedOfficerId: targetOfficer ? targetOfficer.id : t.assignedOfficerId,
        slaDeadline: newDeadline,
        slaWarningSent: false,
        version: { increment: 1 },
      },
    });

    await tx.escalation.create({
      data: {
        ticketId: t.id,
        sequence: updated.escalationLevel,
        reason: 'MANUAL',
        fromLevelOrder: t.currentLevelOrder,
        toLevelOrder,
        fromAuthorityId: t.assignedOfficerId,
        toAuthorityId: targetOfficer ? targetOfficer.id : null,
        triggeredById: actor.id,
        note: reason,
        idempotencyKey,
      },
    });

    await tx.ticketStatusHistory.create({
      data: {
        ticketId: t.id,
        fromStatus: t.status,
        toStatus: 'ESCALATED',
        actorType: 'AUTHORITY',
        actorId: actor.id,
        actorLabel: `${actor.name} (${actor.roleName})`,
        publicNote: `Manually escalated by authority: ${reason}`,
      },
    });

    const notifId = await createNotification(tx, t.id, 'COMPLAINT_ESCALATED', `manual_${updated.version}`);

    await audit(
      {
        actor: { type: 'AUTHORITY', id: actor.id, role: actor.roleCode },
        action: 'MANUAL_ESCALATION',
        ticketId: t.id,
        metadata: { reason, targetOfficerId, fromLevel: t.currentLevelOrder, toLevel: toLevelOrder },
        ip,
      },
      tx,
    );

    return { ticket: updated, notifId };
  });

  if (notifId) dispatch([notifId]);
  return ticket;
}

export async function registerEscalationWorkers() {
  await queue.register(ESCALATION_JOB, checkSlaEscalations);
  await queue.register(WARNING_JOB, checkSlaWarnings);
  await queue.repeat(ESCALATION_JOB, 60_000); // Check SLA breach every 60 seconds
  await queue.repeat(WARNING_JOB, 60_000); // Check SLA warnings every 60 seconds
}
