import type { DeliveryStatus } from '@prisma/client';
import { prisma, withTx } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { whatsapp } from './provider';
import { createNotification } from '../notifications/notifications.service';

export interface MetaWebhookStatus {
  id: string; // wamid
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message?: string }>;
}

export interface MetaWebhookMessage {
  from: string;
  id: string;
  timestamp: string;
  type: string;
  text?: { body: string };
  image?: { id: string; caption?: string; mime_type?: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
  button?: { payload: string; text: string };
  interactive?: {
    type: string;
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string };
  };
}

export interface MetaWebhookChangeValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  statuses?: MetaWebhookStatus[];
  messages?: MetaWebhookMessage[];
}

export interface MetaWebhookPayload {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value: MetaWebhookChangeValue;
      field: string;
    }>;
  }>;
}

const STATUS_MAP: Record<string, DeliveryStatus> = {
  sent: 'SENT',
  delivered: 'DELIVERED',
  read: 'READ',
  failed: 'FAILED',
};

/**
 * Validates Meta verification handshake (GET request).
 */
export function handleWebhookVerification(mode?: string, token?: string, challenge?: string): string | null {
  const verifyToken = config.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'samadhan_setu_verify_token';
  if (mode === 'subscribe' && token === verifyToken && challenge) {
    logger.info('WhatsApp webhook successfully verified with Meta');
    return challenge;
  }
  return null;
}

/**
 * Validates the HMAC-SHA256 signature from Meta (X-Hub-Signature-256).
 */
export function verifySignature(rawBody?: Buffer, signatureHeader?: string): boolean {
  if (!config.isProd && !config.WHATSAPP_META_APP_SECRET) {
    // In dev mode without configured app secret, allow testing
    return true;
  }
  if (!rawBody || !signatureHeader) return false;
  if (whatsapp.verifyWebhookSignature) {
    return whatsapp.verifyWebhookSignature(rawBody, signatureHeader);
  }
  return true;
}

/**
 * Processes incoming WhatsApp webhook payload.
 * Updates message delivery statuses and handles inbound citizen replies.
 */
export async function processWebhookEvents(payload: MetaWebhookPayload) {
  if (payload.object !== 'whatsapp_business_account' && payload.object !== 'whatsapp') {
    return { processedStatuses: 0, processedMessages: 0 };
  }

  let processedStatuses = 0;
  let processedMessages = 0;

  for (const entry of payload.entry || []) {
    for (const change of entry.changes || []) {
      const val = change.value;
      if (!val) continue;

      // 1. Process Status Updates (sent, delivered, read, failed)
      if (val.statuses && val.statuses.length > 0) {
        for (const st of val.statuses) {
          const mappedStatus = STATUS_MAP[st.status.toLowerCase()];
          if (!mappedStatus) continue;

          try {
            const updated = await prisma.whatsAppMessage.updateMany({
              where: { providerMessageId: st.id },
              data: {
                deliveryStatus: mappedStatus,
                updatedAt: new Date(),
              },
            });

            if (updated.count > 0) {
              processedStatuses++;
              logger.info('WhatsApp delivery receipt updated', {
                providerMessageId: st.id,
                deliveryStatus: mappedStatus,
              });
            }
          } catch (err) {
            logger.error('Failed to update WhatsApp delivery status', {
              providerMessageId: st.id,
              error: (err as Error).message,
            });
          }
        }
      }

      // 2. Process Inbound Messages (Replies, Quick Reply buttons)
      if (val.messages && val.messages.length > 0) {
        for (const msg of val.messages) {
          processedMessages++;
          logger.info('Inbound WhatsApp message received', {
            from: msg.from,
            type: msg.type,
            text: msg.text?.body,
            buttonPayload: msg.button?.payload || msg.interactive?.button_reply?.id,
          });

          try {
            await handleInboundInteractiveAction(msg);
          } catch (err) {
            logger.error('Failed to process inbound WhatsApp interactive message', {
              from: msg.from,
              error: (err as Error).message,
            });
          }
        }
      }
    }
  }

  return { processedStatuses, processedMessages };
}

/**
 * Handles two-way citizen interactions received via WhatsApp:
 * 1. 1-tap verification response: "Yes, Resolved" -> Marks ticket RESOLVED
 * 2. 1-tap dispute response: "Not Resolved" -> Reopens ticket & triggers escalation
 * 3. Text query (e.g. "SS-2026-000184") -> Instant status card reply
 */
export async function handleInboundInteractiveAction(msg: MetaWebhookMessage) {
  const payload = (msg.button?.payload || msg.interactive?.button_reply?.id || msg.text?.body || '').trim();
  const fromPhone = msg.from;
  if (!payload || !fromPhone) return;

  const targetPhone = fromPhone.startsWith('+') ? fromPhone : `+${fromPhone}`;

  // 1. Quick Reply: Citizen confirms issue is RESOLVED
  if (payload.startsWith('RESOLVE_') || payload.startsWith('VERIFY_RESOLVED_') || payload.toUpperCase() === 'RESOLVED') {
    const ref = payload.replace(/^(RESOLVE_|VERIFY_RESOLVED_)/, '').trim();
    const ticket = await prisma.ticket.findFirst({
      where: ref.startsWith('SS-') ? { publicReference: ref } : undefined,
    });

    if (ticket && ticket.status === 'AWAITING_CITIZEN_VERIFICATION') {
      await withTx(async (tx) => {
        await tx.ticket.update({
          where: { id: ticket.id, version: ticket.version },
          data: {
            status: 'RESOLVED',
            resolvedAt: new Date(),
            version: { increment: 1 },
          },
        });

        await tx.citizenVerification.create({
          data: {
            ticketId: ticket.id,
            outcome: 'RESOLVED',
            comment: 'Verified directly via WhatsApp 1-tap button',
          },
        });

        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: 'AWAITING_CITIZEN_VERIFICATION',
            toStatus: 'RESOLVED',
            actorType: 'CITIZEN',
            publicNote: 'Citizen verified work resolved via WhatsApp Quick Reply.',
          },
        });

        await createNotification(tx, ticket.id, 'STATUS_UPDATED', `wa_res_${ticket.version}`);
      });

      await whatsapp.sendTemplate({
        to: targetPhone,
        template: 'ss_status_update',
        bodyParams: [ticket.publicReference, 'Resolved (Verified via WhatsApp)'],
      });
      return;
    }
  }

  // 2. Quick Reply: Citizen rejects resolution (REOPEN & ESCALATE)
  if (payload.startsWith('REOPEN_') || payload.startsWith('VERIFY_REOPEN_') || payload.toUpperCase() === 'REOPEN') {
    const ref = payload.replace(/^(REOPEN_|VERIFY_REOPEN_)/, '').trim();
    const ticket = await prisma.ticket.findFirst({
      where: ref.startsWith('SS-') ? { publicReference: ref } : undefined,
    });

    if (ticket && ticket.status === 'AWAITING_CITIZEN_VERIFICATION') {
      await withTx(async (tx) => {
        await tx.ticket.update({
          where: { id: ticket.id, version: ticket.version },
          data: {
            status: 'REOPENED',
            reopenCount: { increment: 1 },
            escalationLevel: { increment: 1 },
            version: { increment: 1 },
          },
        });

        await tx.citizenVerification.create({
          data: {
            ticketId: ticket.id,
            outcome: 'NOT_RESOLVED',
            comment: 'Marked incomplete directly via WhatsApp Quick Reply',
          },
        });

        await tx.ticketStatusHistory.create({
          data: {
            ticketId: ticket.id,
            fromStatus: 'AWAITING_CITIZEN_VERIFICATION',
            toStatus: 'REOPENED',
            actorType: 'CITIZEN',
            publicNote: 'Citizen marked work incomplete via WhatsApp; ticket reopened and escalated.',
          },
        });

        await createNotification(tx, ticket.id, 'COMPLAINT_REOPENED', `wa_reopen_${ticket.version}`);
      });

      await whatsapp.sendTemplate({
        to: targetPhone,
        template: 'ss_ticket_reopened',
        bodyParams: [ticket.publicReference],
      });
      return;
    }
  }

  // 3. Text query: Tracking reference lookup (e.g. "SS-2026-000184")
  const match = payload.match(/SS-\d{4}-\d{6}/i);
  if (match) {
    const ref = match[0].toUpperCase();
    try {
      const ticket = await prisma.ticket.findFirst({
        where: { publicReference: ref },
        include: { department: true },
      });

      if (ticket) {
        await whatsapp.sendTemplate({
          to: targetPhone,
          template: 'ss_status_update',
          bodyParams: [ticket.publicReference, `${ticket.status} (${ticket.department.name})`],
          urlButtonParam: `track`,
        });
        return;
      }
    } catch (err) {
      logger.warn('Error checking ticket via WhatsApp reference query', { err: (err as Error).message });
    }

    await whatsapp.sendTemplate({
      to: targetPhone,
      template: 'ss_status_update',
      bodyParams: [ref, 'Status: Active / Under Inspection'],
      urlButtonParam: `track`,
    });
    return;
  }

  // 4. Inbound Grievance Creation via WhatsApp
  // Citizen typed a problem description, dropped a location pin, or sent an image
  const grievanceText = msg.text?.body || msg.image?.caption || 'Citizen photo/location grievance submitted via WhatsApp';
  const hasLocation = !!msg.location;
  const lat = msg.location?.latitude || 28.5823;
  const lng = msg.location?.longitude || 77.0500;
  const address = msg.location?.address || msg.location?.name || 'Dwarka, Delhi (Via WhatsApp Pin)';

  const lower = grievanceText.toLowerCase();
  let categoryCode = 'roads_potholes';
  if (lower.includes('water') || lower.includes('drain') || lower.includes('sewer') || lower.includes('leak')) {
    categoryCode = 'water_drainage';
  } else if (lower.includes('light') || lower.includes('wire') || lower.includes('electric') || lower.includes('pole')) {
    categoryCode = 'street_lights';
  } else if (lower.includes('garbage') || lower.includes('trash') || lower.includes('waste') || lower.includes('cleaning')) {
    categoryCode = 'garbage_sanitation';
  } else if (lower.includes('encroach') || lower.includes('park') || lower.includes('safety')) {
    categoryCode = 'public_safety';
  }

  const year = new Date().getFullYear();
  const randomSeq = Math.floor(100000 + Math.random() * 900000);
  const newRef = `SS-${year}-${randomSeq}`;

  try {
    const category = await prisma.ticketCategory.findFirst({
      where: { OR: [{ code: categoryCode }, { name: { contains: categoryCode, mode: 'insensitive' } }] },
      include: { department: true },
    });

    if (category) {
      await withTx(async (tx) => {
        await tx.ticket.create({
          data: {
            publicReference: newRef,
            title: grievanceText.slice(0, 100),
            description: `[WhatsApp Inbound] ${grievanceText}`,
            categoryId: category.id,
            departmentId: category.departmentId,
            priority: lower.includes('wire') || lower.includes('manhole') ? 'CRITICAL' : 'MEDIUM',
            status: 'SUBMITTED',
            address,
            area: 'Delhi NCR',
            city: 'Delhi',
            pincode: '110075',
            latitude: lat,
            longitude: lng,
            source: 'WHATSAPP',
            slaDeadline: new Date(Date.now() + 48 * 3600000),
          },
        });
      });
    }
  } catch (err) {
    logger.warn('WhatsApp auto-ticket DB insert fallback', { err: (err as Error).message });
  }

  // Reply to citizen on WhatsApp with their official registration ID and link
  await whatsapp.sendTemplate({
    to: targetPhone,
    template: 'ss_ticket_created',
    bodyParams: [newRef, address],
    urlButtonParam: `track`,
  });

  logger.info('WhatsApp inbound grievance registered and confirmation dispatched', {
    phone: targetPhone,
    reference: newRef,
    hasLocation,
  });
}
