import { Router, type Request, type Response } from 'express';
import { asyncHandler, Errors } from '../lib/errors';
import { handleWebhookVerification, verifySignature, processWebhookEvents } from '../modules/whatsapp/webhook.service';
import { logger } from '../lib/logger';

export const whatsappRouter = Router();

/**
 * GET /api/whatsapp/webhook
 * Handshake verification endpoint for Meta Cloud API.
 */
whatsappRouter.get('/webhook', (req: Request, res: Response) => {
  const mode = req.query['hub.mode'] as string | undefined;
  const token = req.query['hub.verify_token'] as string | undefined;
  const challenge = req.query['hub.challenge'] as string | undefined;

  const verifiedChallenge = handleWebhookVerification(mode, token, challenge);
  if (verifiedChallenge) {
    return res.status(200).send(verifiedChallenge);
  }

  logger.warn('WhatsApp webhook handshake verification failed', { mode, tokenProvided: !!token });
  return res.status(403).json({ error: 'Verification failed' });
});

/**
 * POST /api/whatsapp/webhook
 * Receives delivery receipts (sent, delivered, read, failed) & inbound messages from Meta.
 */
whatsappRouter.post(
  '/webhook',
  asyncHandler(async (req: Request, res: Response) => {
    const rawBody = (req as any).rawBody as Buffer | undefined;
    const signature = req.headers['x-hub-signature-256'] as string | undefined;

    // Validate Meta cryptographic signature
    if (!verifySignature(rawBody, signature)) {
      logger.warn('WhatsApp webhook signature verification failed');
      throw Errors.forbidden('Invalid webhook signature');
    }

    const payload = req.body;
    const result = await processWebhookEvents(payload);

    // Meta expects an immediate 200 OK
    res.status(200).json({ success: true, ...result });
  }),
);

/**
 * POST /api/whatsapp/simulate
 * Developer endpoint to simulate an inbound message from a citizen
 */
whatsappRouter.post(
  '/simulate',
  asyncHandler(async (req: Request, res: Response) => {
    const { from, text, latitude, longitude, address, action } = req.body;
    const fromPhone = from || '+919876543210';

    const simulatedMessage = {
      from: fromPhone,
      id: `wamid_sim_${Date.now()}`,
      timestamp: Math.floor(Date.now() / 1000).toString(),
      type: latitude && longitude ? 'location' : 'text',
      text: text ? { body: text } : undefined,
      location:
        latitude && longitude
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
              name: address || 'Dwarka Landmark',
              address: address || 'Dwarka, Delhi',
            }
          : undefined,
      button: action ? { payload: action, text: action } : undefined,
    };

    const simulatedPayload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'sim_biz_1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '+911145678900',
                  phone_number_id: '1234567890',
                },
                messages: [simulatedMessage],
              },
            },
          ],
        },
      ],
    };

    const result = await processWebhookEvents(simulatedPayload);
    res.json({ success: true, simulatedMessage, result });
  }),
);
