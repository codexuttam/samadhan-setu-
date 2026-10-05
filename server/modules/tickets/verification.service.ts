import { prisma, withTx } from '../../lib/prisma';
import { Errors } from '../../lib/errors';
import { getSettings } from '../../lib/settings';
import { audit } from '../audit/audit.service';
import { createNotification, dispatch } from '../notifications/notifications.service';
import { slaApplies } from './stateMachine';
import { recordAttachments, storeFiles, type ValidatedFile } from '../files/files.service';
import { revokeAccessToken } from '../tracking/accessTokens';

export async function processCitizenVerification(input: {
  ticketAccessTokenId: string;
  ticketId: string;
  outcome: 'RESOLVED' | 'NOT_RESOLVED';
  comment?: string;
  reviewDescription?: string;
  evidence?: ValidatedFile[];
  rating?: number;
  ip?: string;
}) {
  const storedReviewFiles = input.evidence?.length ? await storeFiles(input.evidence) : [];

  const { ticket, notifId } = await withTx(async (tx) => {
    const t = await tx.ticket.findUniqueOrThrow({
      where: { id: input.ticketId },
      include: { department: true },
    });

    if (t.status !== 'AWAITING_CITIZEN_VERIFICATION') {
      throw Errors.badRequest('This complaint is not currently awaiting citizen verification.');
    }

    await tx.citizenVerification.create({
      data: {
        ticketId: t.id,
        outcome: input.outcome,
        comment: input.comment || input.reviewDescription,
      },
    });

    if (input.outcome === 'RESOLVED') {
      // Advance to RESOLVED
      const updated = await tx.ticket.update({
        where: { id: t.id, version: t.version },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          version: { increment: 1 },
        },
      });

      if (input.rating && input.rating >= 1 && input.rating <= 5) {
        await tx.feedback.create({
          data: {
            ticketId: t.id,
            rating: input.rating,
            comment: input.comment,
          },
        });
        await audit({ actor: { type: 'CITIZEN' }, action: 'FEEDBACK_SUBMITTED', ticketId: t.id, metadata: { rating: input.rating } }, tx);
      }

      await tx.ticketStatusHistory.create({
        data: {
          ticketId: t.id,
          fromStatus: 'AWAITING_CITIZEN_VERIFICATION',
          toStatus: 'RESOLVED',
          actorType: 'CITIZEN',
          publicNote: 'Citizen verified work as resolved.',
        },
      });

      // Auto-close if configured or keep RESOLVED until final closure
      const notifId = await createNotification(tx, t.id, 'STATUS_UPDATED', `res_${t.version}`);

      await audit({ actor: { type: 'CITIZEN' }, action: 'CITIZEN_VERIFIED', ticketId: t.id, metadata: { outcome: 'RESOLVED' }, ip: input.ip }, tx);
      await revokeAccessToken(input.ticketAccessTokenId, tx);

      return { ticket: updated, notifId };
    } else {
      // Citizen clicked NOT RESOLVED -> Reopen complaint & trigger escalation event
      if (storedReviewFiles.length) {
        await recordAttachments(tx, t.id, storedReviewFiles, 'REVIEW_EVIDENCE', { type: 'CITIZEN' });
      }

      const nextLevelOrder = Math.min(t.currentLevelOrder + 1, 4);
      let nextOfficer = await tx.authorityUser.findFirst({
        where: {
          departmentId: t.departmentId,
          role: { level: { levelOrder: nextLevelOrder } },
          status: 'ACTIVE',
        },
      });

      if (!nextOfficer) {
        nextOfficer = await tx.authorityUser.findFirst({
          where: { role: { code: 'SUPER_ADMIN' }, status: 'ACTIVE' },
        });
      }

      const rule = await tx.escalationRule.findFirst({
        where: { active: true, fromLevelOrder: nextLevelOrder, departmentId: t.departmentId },
      });
      const nextSlaHours = rule?.slaHours ?? 24;
      const newDeadline = new Date(Date.now() + nextSlaHours * 3600_000);

      const updated = await tx.ticket.update({
        where: { id: t.id, version: t.version },
        data: {
          status: 'REOPENED',
          reopenCount: { increment: 1 },
          escalationLevel: { increment: 1 },
          currentLevelOrder: nextOfficer ? nextLevelOrder : t.currentLevelOrder,
          assignedOfficerId: nextOfficer ? nextOfficer.id : t.assignedOfficerId,
          slaDeadline: newDeadline,
          slaWarningSent: false,
          version: { increment: 1 },
        },
      });

      // Log dispute review note
      if (input.reviewDescription) {
        await tx.ticketStatusHistory.create({
          data: {
            ticketId: t.id,
            fromStatus: 'AWAITING_CITIZEN_VERIFICATION',
            toStatus: 'REOPENED',
            actorType: 'CITIZEN',
            publicNote: `Citizen disputed resolution: "${input.reviewDescription.slice(0, 150)}"`,
          },
        });
      }

      // Create Escalation event idempotently
      const escIdempotency = `reopen:${t.id}:${t.reopenCount + 1}`;
      await tx.escalation.create({
        data: {
          ticketId: t.id,
          sequence: t.reopenCount + 1,
          reason: 'CITIZEN_REOPENED',
          fromLevelOrder: t.currentLevelOrder,
          toLevelOrder: updated.currentLevelOrder,
          fromAuthorityId: t.assignedOfficerId,
          toAuthorityId: updated.assignedOfficerId,
          note: input.reviewDescription || 'Citizen disputed work completion.',
          idempotencyKey: escIdempotency,
        },
      });

      const notifId = await createNotification(tx, t.id, 'COMPLAINT_REOPENED', `reopen_${t.version}`);

      await audit({ actor: { type: 'CITIZEN' }, action: 'COMPLAINT_REOPENED', ticketId: t.id, metadata: { outcome: 'NOT_RESOLVED' }, ip: input.ip }, tx);
      await revokeAccessToken(input.ticketAccessTokenId, tx);

      return { ticket: updated, notifId };
    }
  });

  dispatch([notifId]);
  return ticket;
}
