import crypto from 'node:crypto';
import { config } from '../../config';
import { logger, maskPhone } from '../../lib/logger';

/**
 * Provider-agnostic WhatsApp interface. Swap providers by implementing this.
 * All citizen messages are sent as pre-approved templates (Meta Business policy).
 */
export interface TemplateMessage {
  to: string; // E.164
  template: string;
  language?: string;
  bodyParams: string[];
  /** URL button suffix (dynamic part of an approved URL button) */
  urlButtonParam?: string;
  /** For authentication templates (OTP copy-code button) */
  otpCode?: string;
}

export interface WhatsAppProvider {
  readonly name: string;
  sendTemplate(msg: TemplateMessage): Promise<{ providerMessageId: string }>;
  verifyWebhookSignature?(rawBody: Buffer, signatureHeader: string | undefined): boolean;
}

// ── Development provider ─────────────────────────────────────
// Keeps an in-memory outbox (NOT a log) so developers can read messages at /api/dev/outbox.
// Disabled in production by config validation.
export interface DevOutboxItem {
  id: string;
  at: string;
  toMasked: string;
  template: string;
  bodyParams: string[];
  link?: string;
  otpCode?: string;
}
export const devOutbox: DevOutboxItem[] = [];

class ConsoleWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'console';
  async sendTemplate(msg: TemplateMessage) {
    const id = `dev_${crypto.randomUUID()}`;
    devOutbox.unshift({
      id,
      at: new Date().toISOString(),
      toMasked: maskPhone(msg.to),
      template: msg.template,
      bodyParams: msg.bodyParams,
      link: msg.urlButtonParam ? `${config.APP_BASE_URL}/${msg.urlButtonParam}` : undefined,
      otpCode: msg.otpCode,
    });
    devOutbox.splice(50);
    logger.info('WhatsApp (dev) message queued in outbox', { template: msg.template, to: maskPhone(msg.to) });
    return { providerMessageId: id };
  }
}

// ── Meta WhatsApp Cloud API ───────────────────────────────────
class MetaCloudWhatsAppProvider implements WhatsAppProvider {
  readonly name = 'meta';

  async sendTemplate(msg: TemplateMessage) {
    const components: any[] = [];
    const params = msg.otpCode ? [msg.otpCode] : msg.bodyParams;
    if (params.length) components.push({ type: 'body', parameters: params.map((text) => ({ type: 'text', text })) });
    if (msg.otpCode) {
      components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: msg.otpCode }] });
    } else if (msg.urlButtonParam) {
      components.push({ type: 'button', sub_type: 'url', index: '0', parameters: [{ type: 'text', text: msg.urlButtonParam }] });
    }
    const res = await fetch(`https://graph.facebook.com/v20.0/${config.WHATSAPP_META_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.WHATSAPP_META_TOKEN}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: msg.to.replace('+', ''),
        type: 'template',
        template: { name: msg.template, language: { code: msg.language ?? config.WHATSAPP_TEMPLATE_LANG }, components },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      // Do not include response body (may echo the recipient)
      throw new Error(`WhatsApp provider responded ${res.status}`);
    }
    const json = (await res.json()) as { messages?: { id: string }[] };
    const id = json.messages?.[0]?.id;
    if (!id) throw new Error('WhatsApp provider returned no message id');
    return { providerMessageId: id };
  }

  verifyWebhookSignature(rawBody: Buffer, header: string | undefined) {
    if (!header || !config.WHATSAPP_META_APP_SECRET) return false;
    const expected = 'sha256=' + crypto.createHmac('sha256', config.WHATSAPP_META_APP_SECRET).update(rawBody).digest('hex');
    const a = Buffer.from(header);
    const b = Buffer.from(expected);
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  }
}

export const whatsapp: WhatsAppProvider =
  config.WHATSAPP_PROVIDER === 'meta' ? new MetaCloudWhatsAppProvider() : new ConsoleWhatsAppProvider();
