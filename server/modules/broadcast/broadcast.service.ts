import { prisma } from '../../lib/prisma';
import { decrypt } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { queue } from '../queue/queue';
import { whatsapp, type TemplateMessage } from '../whatsapp/provider';
import { audit } from '../audit/audit.service';
import type { AuthUser } from '../authority/rbac';
import { Errors } from '../../lib/errors';

export interface BroadcastTargetInput {
  title: string;
  message: string;
  wardId?: string;
  zoneId?: string;
  departmentId?: string;
  categoryId?: string;
  includeResolved?: boolean;
}

export interface PreviewRecipientsInput {
  wardId?: string;
  zoneId?: string;
  departmentId?: string;
  categoryId?: string;
  includeResolved?: boolean;
}

const BROADCAST_JOB = 'whatsapp-broadcast-batch';

/**
 * Builds where filter for targeted broadcast recipients honoring officer scope.
 */
function buildTargetFilter(target: PreviewRecipientsInput, actor: AuthUser) {
  const where: any = {
    contact: {
      phoneEncrypted: { not: null },
    },
  };

  if (!target.includeResolved) {
    where.status = { notIn: ['CLOSED', 'RESOLVED'] };
  }

  // Scope enforcement
  if (actor.wardId) {
    where.wardId = actor.wardId;
  } else if (target.wardId) {
    where.wardId = target.wardId;
  }

  if (actor.zoneId && !actor.wardId) {
    where.zoneId = actor.zoneId;
  } else if (target.zoneId) {
    where.zoneId = target.zoneId;
  }

  if (actor.departmentId) {
    where.departmentId = actor.departmentId;
  } else if (target.departmentId) {
    where.departmentId = target.departmentId;
  }

  if (target.categoryId) {
    where.categoryId = target.categoryId;
  }

  return where;
}

/**
 * Previews the count of tickets and unique citizen phone numbers for a broadcast.
 */
export async function previewBroadcastRecipients(target: PreviewRecipientsInput, actor: AuthUser) {
  const where = buildTargetFilter(target, actor);

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      id: true,
      contact: {
        select: {
          phoneHash: true,
        },
      },
    },
  });

  const uniqueHashes = new Set(tickets.map((t) => t.contact?.phoneHash).filter(Boolean));

  return {
    matchingTickets: tickets.length,
    uniqueRecipients: uniqueHashes.size,
  };
}

/**
 * Executes a mass civic announcement broadcast via WhatsApp.
 */
export async function createWardBroadcast(input: BroadcastTargetInput, actor: AuthUser, ip?: string) {
  if (!input.title?.trim() || !input.message?.trim()) {
    throw Errors.badRequest('Broadcast title and message are required.');
  }

  const where = buildTargetFilter(input, actor);

  const tickets = await prisma.ticket.findMany({
    where,
    select: {
      id: true,
      publicReference: true,
      area: true,
      city: true,
      contact: {
        select: {
          phoneEncrypted: true,
          phoneHash: true,
        },
      },
    },
  });

  if (tickets.length === 0) {
    throw Errors.badRequest('No active citizen complaints match the selected ward or category filter.');
  }

  // Deduplicate by recipient phoneHash so a citizen with 3 tickets gets 1 broadcast
  const uniqueRecipientMap = new Map<string, { phoneEncrypted: string; ticketId: string; area: string }>();
  for (const t of tickets) {
    if (t.contact?.phoneEncrypted && t.contact.phoneHash) {
      if (!uniqueRecipientMap.has(t.contact.phoneHash)) {
        uniqueRecipientMap.set(t.contact.phoneHash, {
          phoneEncrypted: t.contact.phoneEncrypted,
          ticketId: t.id,
          area: t.area,
        });
      }
    }
  }

  const broadcastId = `bcast_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const recipients = Array.from(uniqueRecipientMap.entries());

  logger.info('Initiating WhatsApp Civic Broadcast', {
    broadcastId,
    title: input.title,
    actorId: actor.id,
    uniqueRecipients: recipients.length,
  });

  // Process in batches of 25 to obey Meta rate-limits
  const BATCH_SIZE = 25;
  let dispatchedBatches = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const chunk = recipients.slice(i, i + BATCH_SIZE).map(([hash, item]) => ({
      recipientHash: hash,
      phoneEncrypted: item.phoneEncrypted,
      ticketId: item.ticketId,
      area: item.area,
    }));

    await queue.enqueue(
      BROADCAST_JOB,
      {
        broadcastId,
        title: input.title.trim(),
        message: input.message.trim(),
        chunk,
      },
      { delayMs: dispatchedBatches * 1000 }, // 1 sec spacing between batches
    );
    dispatchedBatches++;
  }

  await audit({
    actor: { type: 'AUTHORITY', id: actor.id, role: actor.roleCode },
    action: 'CIVIC_BROADCAST_SENT',
    metadata: {
      broadcastId,
      title: input.title,
      recipientCount: recipients.length,
      matchingTickets: tickets.length,
      filter: { wardId: input.wardId, categoryId: input.categoryId },
    },
    ip,
  });

  return {
    broadcastId,
    totalTickets: tickets.length,
    uniqueRecipients: recipients.length,
    batchesScheduled: dispatchedBatches,
  };
}

/**
 * Worker processor for broadcast chunks.
 */
async function processBroadcastBatch(data: {
  broadcastId: string;
  title: string;
  message: string;
  chunk: Array<{ recipientHash: string; phoneEncrypted: string; ticketId: string; area: string }>;
}) {
  const { title, message, chunk } = data;

  for (const item of chunk) {
    try {
      const to = decrypt(item.phoneEncrypted);
      const templateMsg: TemplateMessage = {
        to,
        template: 'ss_civic_broadcast',
        bodyParams: [title, message.slice(0, 140), item.area || 'Your Ward', 'Samadhan Setu Administration'],
        urlButtonParam: `track`,
      };

      const { providerMessageId } = await whatsapp.sendTemplate(templateMsg);

      await prisma.whatsAppMessage.create({
        data: {
          ticketId: item.ticketId,
          providerMessageId,
          templateName: 'ss_civic_broadcast',
          recipientHash: item.recipientHash,
          deliveryStatus: 'ACCEPTED',
        },
      });
    } catch (err) {
      logger.error('Failed delivering broadcast to recipient', {
        recipientHash: item.recipientHash,
        error: (err as Error).message,
      });
    }
  }
}

export async function registerBroadcastWorkers() {
  await queue.register(BROADCAST_JOB, processBroadcastBatch);
}
