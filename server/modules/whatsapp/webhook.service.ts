import type { DeliveryStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { config } from '../../config';
import { whatsapp } from './provider';

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
          // Handled in Step 4 for interactive verification/tracking replies
        }
      }
    }
  }

  return { processedStatuses, processedMessages };
}
