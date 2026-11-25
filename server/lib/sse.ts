import type { Request, Response } from 'express';

const sseClients = new Set<Response>();

// 25s heartbeat keeps idle connections alive across reverse proxies
const heartbeat = setInterval(() => {
  for (const client of sseClients) {
    try {
      client.write(': ping\n\n');
    } catch {
      sseClients.delete(client);
    }
  }
}, 25_000);
heartbeat.unref();

export function sseHandler(req: Request, res: Response) {
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
}

export function broadcastSse(event: { type: string; payload?: Record<string, unknown> }) {
  const data = `data: ${JSON.stringify({ ...event, timestamp: new Date().toISOString() })}\n\n`;
  for (const client of sseClients) {
    try {
      client.write(data);
    } catch {
      sseClients.delete(client);
    }
  }
}

export function closeSseClients() {
  clearInterval(heartbeat);
  for (const client of sseClients) {
    try {
      client.end();
    } catch {
      // ignore close errors
    }
  }
  sseClients.clear();
}
