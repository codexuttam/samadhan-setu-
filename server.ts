import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';

import { config } from './server/config';
import { errorHandler, parse } from './server/lib/errors';
import { logger } from './server/lib/logger';
import { prisma } from './server/lib/prisma';
import { sseHandler } from './server/lib/sse';
import { authenticate } from './server/modules/authority/auth.service';
import { initQueue } from './server/modules/queue/queue';
import { registerNotificationWorkers } from './server/modules/notifications/notifications.service';
import { registerFileWorkers, localStorage } from './server/modules/files/files.service';
import { registerEscalationWorkers } from './server/modules/escalation/escalation.service';
import { registerBroadcastWorkers } from './server/modules/broadcast/broadcast.service';
import { transcribeAudio, triageComplaint, verifyResolutionEvidence, chatCivicConcierge } from './server/modules/ai/ai.service';

import { publicRouter } from './server/routes/public.routes';
import { authorityRouter } from './server/routes/authority.routes';
import { adminRouter } from './server/routes/admin.routes';
import { whatsappRouter } from './server/routes/whatsapp.routes';
import { devOutbox } from './server/modules/whatsapp/provider';
import { processWebhookEvents } from './server/modules/whatsapp/webhook.service';

const app = express();
app.set('trust proxy', config.TRUST_PROXY);

// Security Headers & Middlewares
app.use(
  helmet({
    contentSecurityPolicy: config.isProd ? undefined : false,
  }),
);
app.use(cookieParser());
app.use(
  express.json({
    limit: '10mb',
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// CORS origin enforcement on /api
app.use('/api', (req, res, next) => {
  const origin = req.headers.origin;
  if (!origin) return next();

  if (config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    return next();
  }

  if (config.isProd) {
    return res.status(403).json({ error: { code: 'CORS_FORBIDDEN', message: 'Origin not allowed.' } });
  }
  return next();
});

// Global & AI Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP. Please try again later.' } },
});
app.use('/api', limiter);

const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'AI rate limit exceeded. Please try again later.' } },
});
app.use('/api/transcribe', aiLimiter);
app.use('/api/ai', aiLimiter);

// API Routes
app.use('/api/public', publicRouter);
app.use('/api/authority', authorityRouter);
app.use('/api/admin', adminRouter);
app.use('/api/whatsapp', whatsappRouter);

// AI Voice-to-Text Transcription & Triage API
app.post('/api/transcribe', async (req, res, next) => {
  try {
    const { audioData, mimeType } = req.body;
    if (!audioData) {
      return res.status(400).json({ error: 'audioData base64 string is required' });
    }
    const result = await transcribeAudio(audioData, mimeType);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

app.post('/api/ai/triage', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: 'text is required' });
    }
    const result = await triageComplaint(text);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

const inlineImageSchema = z
  .object({
    data: z.string().min(1),
    mimeType: z.string().regex(/^image\//, 'mimeType must be an image/* type'),
  })
  .optional();

app.post('/api/ai/verify-resolution', authenticate, async (req, res, next) => {
  try {
    const body = parse(
      z.object({
        ticketId: z.string().uuid().optional(),
        issueDescription: z.string().min(3).max(2000).optional(),
        beforeImageUrl: z.string().max(1000).optional(),
        afterImageUrl: z.string().max(1000).optional(),
        beforeImageBase64: inlineImageSchema,
        afterImageBase64: inlineImageSchema,
      }),
      req.body,
    );
    const result = await verifyResolutionEvidence({
      ticketId: body.ticketId,
      issueDescription: body.issueDescription || 'Civic infrastructure repair',
      beforeImageUrl: body.beforeImageUrl,
      afterImageUrl: body.afterImageUrl,
      beforeImageBase64: body.beforeImageBase64,
      afterImageBase64: body.afterImageBase64,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// AI Civic Concierge Chat API ("Samadhan Sahayak")
app.post('/api/ai/chat', async (req, res, next) => {
  try {
    const { messages, message, language } = req.body;
    if (!message && (!messages || messages.length === 0)) {
      return res.status(400).json({ error: 'message or messages required' });
    }
    const currentMessage = message || messages[messages.length - 1]?.content || '';
    const result = await chatCivicConcierge({
      messages: messages || [],
      message: currentMessage,
      language,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// Secure File Server (Signed local file links)
app.get('/api/files/:token', async (req, res, next) => {
  try {
    const verified = localStorage.verify(req.params.token);
    if (!verified || !verified.k) return res.status(403).send('Invalid or expired file link');
    const buf = await localStorage.get(verified.k);
    const sniffed = await fileTypeFromBuffer(buf);
    const mime = sniffed?.mime || 'application/octet-stream';
    const isSafeInline = mime.startsWith('image/') || mime === 'application/pdf';
    res.setHeader('Content-Type', mime);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Disposition', isSafeInline ? 'inline' : 'attachment');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

// Real-Time Server-Sent Events (SSE) Live Feed
app.get('/api/events', sseHandler);
export { broadcastSse } from './server/lib/sse';

// Dev Outbox Endpoint (Development Mode Only)
if (!config.isProd) {
  app.get('/api/dev/outbox', (_req, res) => {
    res.json(devOutbox);
  });

  app.post('/api/dev/whatsapp/simulate-status', async (req, res) => {
    const { providerMessageId, status } = req.body;
    if (!providerMessageId || !status) {
      return res.status(400).json({ error: 'providerMessageId and status are required' });
    }
    const result = await processWebhookEvents({
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'dev_account',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '1234567890', phone_number_id: 'dev_phone' },
                statuses: [
                  {
                    id: providerMessageId,
                    status: status.toLowerCase(),
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    recipient_id: '919999999999',
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    });
    res.json({ success: true, result });
  });
}

// Global Express Error Handler
app.use(errorHandler);

// Vite / Production Static File Server
async function startServer() {
  await initQueue();
  await registerNotificationWorkers();
  await registerFileWorkers();
  await registerEscalationWorkers();
  await registerBroadcastWorkers();

  if (!config.isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist/index.html'));
    });
  }

  const PORT = config.PORT;
  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Samadhan Setu Grievance Engine listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});
