import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { createServer as createViteServer } from 'vite';

import { config } from './server/config';
import { errorHandler } from './server/lib/errors';
import { logger } from './server/lib/logger';
import { prisma } from './server/lib/prisma';
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
    contentSecurityPolicy: false, // Managed by Vite dev server
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

// Global Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests from this IP. Please try again later.' } },
});
app.use('/api', limiter);

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

app.post('/api/ai/verify-resolution', async (req, res, next) => {
  try {
    const { issueDescription, beforeImageUrl, afterImageUrl } = req.body;
    const result = await verifyResolutionEvidence({
      issueDescription: issueDescription || 'Civic infrastructure repair',
      beforeImageUrl,
      afterImageUrl,
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
    res.setHeader('Cache-Control', 'private, max-age=3600');
    res.send(buf);
  } catch (err) {
    next(err);
  }
});

// Real-Time Server-Sent Events (SSE) Live Feed
const sseClients = new Set<express.Response>();

app.get('/api/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  (res as any).flushHeaders?.();

  res.write(
    `data: ${JSON.stringify({ type: 'CONNECTED', message: 'Live Civic Event Stream Active', timestamp: new Date().toISOString() })}\n\n`,
  );
  sseClients.add(res);

  req.on('close', () => {
    sseClients.delete(res);
  });
});

export function broadcastSse(event: { type: string; payload?: any }) {
  const data = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

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
