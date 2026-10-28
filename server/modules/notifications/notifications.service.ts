import type { NotificationEvent } from '@prisma/client';
import { prisma, type Tx } from '../../lib/prisma';
import { decrypt, signPayload } from '../../lib/crypto';
import { logger } from '../../lib/logger';
import { getSettings } from '../../lib/settings';
import { queue } from '../queue/queue';
import { whatsapp, type TemplateMessage } from '../whatsapp/provider';
import { issueAccessToken } from '../tracking/accessTokens';
import { STATUS_LABEL } from '../tickets/labels';

/**
 * Transactional outbox:
 *   business tx → Notification row (QUEUED) → commit → queue job → provider
 * WhatsApp failures never affect ticket validity; rows are retried with backoff.
 */
const JOB = 'notification-send';

export async function createNotification(
  tx: Tx,
  ticketId: string,
  event: NotificationEvent,
  dedupeSuffix: string,
  channel: string = 'WHATSAPP',
) {
  const n = await tx.notification.create({
    data: { ticketId, event, channel, idempotencyKey: `${ticketId}:${event}:${channel}:${dedupeSuffix}` },
    select: { id: true },
  });
  return n.id;
}

/**
 * Multi-stakeholder broadcaster:
 * Dispatches WhatsApp updates to both the Citizen and relevant Authorities (Assigned Field Officer, Supervisor).
 */
export async function broadcastTicketNotification(
  tx: Tx,
  ticketId: string,
  event: NotificationEvent,
  version: number | string,
  options?: { notifyOfficer?: boolean },
): Promise<string[]> {
  const ids: string[] = [];

  // 1. Citizen Complainant Notification
  const citizenNotifId = await createNotification(tx, ticketId, event, `${version}`, 'WHATSAPP_CITIZEN');
  ids.push(citizenNotifId);

  // 2. Stakeholder / Officer Alert Broadcast
  if (options?.notifyOfficer) {
    const officerEvent: NotificationEvent =
      event === 'SLA_WARNING' ? 'SLA_WARNING' : event === 'COMPLAINT_ESCALATED' ? 'COMPLAINT_ESCALATED' : 'OFFICER_ASSIGNED';
    const officerNotifId = await createNotification(tx, ticketId, officerEvent, `${version}`, 'WHATSAPP_OFFICER');
    ids.push(officerNotifId);
  }

  return ids;
}

/** Call AFTER the transaction commits. */
export function dispatch(ids: (string | null | undefined)[]) {
  for (const id of ids) if (id) void queue.enqueue(JOB, { id }, { jobId: id });
}

function short(s: string | null | undefined, n: number) {
  if (!s) return '-';
  const clean = s.replace(/\s+/g, ' ').trim();
  return clean.length > n ? clean.slice(0, n - 1) + '…' : clean;
}

const fmtDate = (d: Date) =>
  d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

async function trackLink(ticketId: string) {
  const existing = await prisma.ticketAccessToken.findFirst({
    where: { ticketId, scope: 'TRACK', revokedAt: null, expiresAt: { gt: new Date(Date.now() + 24 * 3600_000) } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) {
    return `track/secure/${signPayload({ j: existing.id, s: 'T', exp: Math.floor(existing.expiresAt.getTime() / 1000) })}`;
  }
  return `track/secure/${await issueAccessToken(ticketId, 'TRACK')}`;
}

async function buildMessage(n: { event: NotificationEvent; ticketId: string; channel: string }, to: string): Promise<TemplateMessage> {
  const t = await prisma.ticket.findUniqueOrThrow({
    where: { id: n.ticketId },
    include: { department: true, category: true, assignedOfficer: true },
  });
  const ref = t.publicReference;

  // Officer-specific templates
  if (n.channel === 'WHATSAPP_OFFICER') {
    switch (n.event) {
      case 'OFFICER_ASSIGNED':
      case 'TICKET_ASSIGNED':
        return {
          to,
          template: 'ss_officer_assignment',
          bodyParams: [ref, short(t.title, 60), t.priority, short(`${t.area}, ${t.city}`, 60), t.slaDeadline ? fmtDate(t.slaDeadline) : 'Normal'],
          urlButtonParam: `authority`,
        };
      case 'SLA_WARNING':
        return {
          to,
          template: 'ss_officer_sla_warning',
          bodyParams: [ref, short(t.title, 60), t.slaDeadline ? fmtDate(t.slaDeadline) : 'Expiring Soon'],
          urlButtonParam: `authority`,
        };
      case 'COMPLAINT_ESCALATED':
        return {
          to,
          template: 'ss_officer_escalated',
          bodyParams: [ref, short(t.title, 60), `Level ${t.currentLevelOrder}`],
          urlButtonParam: `authority`,
        };
      default:
        return {
          to,
          template: 'ss_status_update',
          bodyParams: [ref, STATUS_LABEL[t.status]],
          urlButtonParam: `authority`,
        };
    }
  }

  // Citizen-specific templates
  switch (n.event) {
    case 'TICKET_CREATED':
      return {
        to,
        template: 'ss_ticket_created',
        bodyParams: [ref, short(t.title, 60), short(`${t.area}, ${t.city}`, 60), 'Submitted'],
        urlButtonParam: await trackLink(t.id),
      };
    case 'TICKET_ASSIGNED':
    case 'OFFICER_ASSIGNED':
      return { to, template: 'ss_ticket_assigned', bodyParams: [ref, t.department.name], urlButtonParam: await trackLink(t.id) };
    case 'VERIFICATION_REQUIRED':
    case 'WORK_COMPLETED':
      return {
        to,
        template: 'ss_verification_required',
        bodyParams: [ref, short(t.title, 60), t.completedAt ? fmtDate(t.completedAt) : fmtDate(new Date()), short(t.resolutionNote, 120)],
        urlButtonParam: `verify/${await issueAccessToken(t.id, 'VERIFY')}`,
      };
    case 'COMPLAINT_REOPENED':
      return { to, template: 'ss_ticket_reopened', bodyParams: [ref], urlButtonParam: await trackLink(t.id) };
    case 'COMPLAINT_ESCALATED':
      return { to, template: 'ss_ticket_escalated', bodyParams: [ref], urlButtonParam: await trackLink(t.id) };
    case 'SLA_WARNING':
      return {
        to,
        template: 'ss_sla_warning',
        bodyParams: [ref, short(t.title, 60), t.slaDeadline ? fmtDate(t.slaDeadline) : 'Soon'],
        urlButtonParam: await trackLink(t.id),
      };
    case 'SLA_BREACHED':
      return {
        to,
        template: 'ss_sla_breached',
        bodyParams: [ref, short(t.title, 60)],
        urlButtonParam: await trackLink(t.id),
      };
    case 'COMPLAINT_CLOSED':
      return { to, template: 'ss_ticket_closed', bodyParams: [ref] };
    case 'WORK_STARTED':
    case 'STATUS_UPDATED':
    default:
      return { to, template: 'ss_status_update', bodyParams: [ref, STATUS_LABEL[t.status]], urlButtonParam: await trackLink(t.id) };
  }
}

async function send({ id }: { id: string }) {
  // Atomic claim — prevents double sends across workers
  const claimed = await prisma.notification.updateMany({
    where: { id, status: { in: ['QUEUED', 'FAILED'] }, nextAttemptAt: { lte: new Date() } },
    data: { status: 'SENDING', attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return;

  const n = await prisma.notification.findUniqueOrThrow({
    where: { id },
    include: { ticket: { include: { contact: true, assignedOfficer: true } } },
  });

  const contact = n.ticket.contact;
  let to: string | null = null;
  let recipientHash = contact?.phoneHash || 'authority_hash';

  if (n.channel === 'WHATSAPP_OFFICER') {
    // Determine officer alert phone (or fall back to system desk / complainant for sandbox testing)
    const officerPhone = process.env.OFFICER_DISPATCH_PHONE || (contact?.phoneEncrypted ? decrypt(contact.phoneEncrypted) : null);
    if (!officerPhone) {
      await prisma.notification.update({ where: { id }, data: { status: 'DEAD', lastError: 'No officer dispatch contact available' } });
      return;
    }
    to = officerPhone;
    recipientHash = `officer_${n.ticket.assignedOfficerId || 'desk'}`;
  } else {
    if (!contact?.phoneEncrypted) {
      await prisma.notification.update({ where: { id }, data: { status: 'DEAD', lastError: 'No deliverable contact' } });
      return;
    }
    to = decrypt(contact.phoneEncrypted);
    recipientHash = contact.phoneHash;
  }

  const settings = await getSettings();
  try {
    const msg = await buildMessage(n, to);
    const { providerMessageId } = await whatsapp.sendTemplate(msg);
    await prisma.$transaction([
      prisma.notification.update({ where: { id }, data: { status: 'SENT', lastError: null } }),
      prisma.whatsAppMessage.create({
        data: {
          notificationId: id,
          ticketId: n.ticketId,
          providerMessageId,
          templateName: msg.template,
          recipientHash,
        },
      }),
    ]);
  } catch (err) {
    const dead = n.attempts >= settings.notifications.maxAttempts;
    const delayMs = settings.notifications.baseBackoffSeconds * 1000 * 2 ** Math.max(0, n.attempts - 1);
    await prisma.notification.update({
      where: { id },
      data: {
        status: dead ? 'DEAD' : 'FAILED',
        lastError: (err as Error).message.slice(0, 200),
        nextAttemptAt: new Date(Date.now() + delayMs),
      },
    });
    logger.warn('Notification delivery failed', { notificationId: id, attempt: n.attempts, dead, channel: n.channel });
    if (!dead) void queue.enqueue(JOB, { id }, { delayMs, jobId: `${id}-r${n.attempts}` });
  }
}

/** Recovers anything missed (process crash, Redis outage). */
async function sweep() {
  await prisma.notification.updateMany({
    where: { status: 'SENDING', updatedAt: { lt: new Date(Date.now() - 5 * 60_000) } },
    data: { status: 'FAILED' },
  });
  const due = await prisma.notification.findMany({
    where: { status: { in: ['QUEUED', 'FAILED'] }, nextAttemptAt: { lte: new Date() }, updatedAt: { lt: new Date(Date.now() - 30_000) } },
    select: { id: true },
    take: 100,
  });
  for (const d of due) await queue.enqueue(JOB, { id: d.id }, { jobId: `${d.id}-s${Date.now()}` });
}

export async function registerNotificationWorkers() {
  await queue.register(JOB, send);
  await queue.register('notification-sweep', sweep);
  await queue.repeat('notification-sweep', 60_000);
}
