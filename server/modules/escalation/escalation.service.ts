import { prisma, withTx } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { createNotification, dispatch } from '../notifications/notifications.service';
import { audit } from '../audit/audit.service';
import { queue } from '../queue/queue';
import { slaApplies } from '../tickets/stateMachine';

const ESCALATION_JOB = 'escalation-sla-check';

/**
 * Idempotent SLA Escalation Processor.
 * Automatically checks for overdue tickets and escalates them to the next hierarchy level.
 */
export async function checkSlaEscalations() {
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
    const toLevelOrder = fromLevelOrder + 1;

    // Find next authority officer or higher role level
    const nextOfficer = await prisma.authorityUser.findFirst({
      where: {
        departmentId: t.departmentId,
        role: { level: { levelOrder: toLevelOrder } },
        status: 'ACTIVE',
      },
    });

    const idempotencyKey = `sla_breach:${t.id}:${fromLevelOrder}->${toLevelOrder}`;

    try {
      const { notifId } = await withTx(async (tx) => {
        // Prevent duplicate escalation records if already processed
        const existingEsc = await tx.escalation.findUnique({ where: { idempotencyKey } });
        if (existingEsc) return { notifId: null };

        // Next SLA rule calculate
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
            note: `Automatic escalation due to SLA breach at Level ${fromLevelOrder}.`,
            idempotencyKey,
          },
        });

        await tx.ticketStatusHistory.create({
          data: {
            ticketId: t.id,
            fromStatus: t.status,
            toStatus: 'ESCALATED',
            actorType: 'SYSTEM',
            publicNote: `Escalated automatically to Level ${toLevelOrder} officer due to SLA breach.`,
          },
        });

        const notifId = await createNotification(tx, t.id, 'COMPLAINT_ESCALATED', `esc_${updated.version}`);

        await audit(
          {
            actor: { type: 'SYSTEM' },
            action: 'ESCALATED',
            ticketId: t.id,
            metadata: { fromLevel: fromLevelOrder, toLevel: toLevelOrder, reason: 'SLA_BREACH' },
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
}

export async function registerEscalationWorkers() {
  await queue.register(ESCALATION_JOB, checkSlaEscalations);
  await queue.repeat(ESCALATION_JOB, 60_000); // Check every 60 seconds
}
