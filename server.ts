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

import { publicRouter } from './server/routes/public.routes';
import { authorityRouter } from './server/routes/authority.routes';
import { adminRouter } from './server/routes/admin.routes';
import { devOutbox } from './server/modules/whatsapp/provider';

const app = express();
app.set('trust proxy', config.TRUST_PROXY);

// Security Headers & Middlewares
app.use(
  helmet({
    contentSecurityPolicy: false, // Managed by Vite dev server
  }),
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));

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

// Dev Outbox Endpoint (Development Mode Only)
if (!config.isProd) {
  app.get('/api/dev/outbox', (_req, res) => {
    res.json(devOutbox);
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
