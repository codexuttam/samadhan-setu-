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
