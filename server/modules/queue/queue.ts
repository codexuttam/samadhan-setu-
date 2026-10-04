import { config } from '../../config';
import { logger } from '../../lib/logger';

/**
 * Job queue abstraction.
 *  - REDIS_URL set  → BullMQ (durable, multi-instance)
 *  - otherwise      → in-process queue (development only)
 * Durability does not depend on the queue: notifications live in the DB outbox
 * and a periodic sweeper re-enqueues anything left QUEUED/FAILED.
 */
export type JobHandler = (data: any) => Promise<void>;

interface QueueBackend {
  register(name: string, handler: JobHandler): Promise<void>;
  enqueue(name: string, data: unknown, opts?: { delayMs?: number; jobId?: string }): Promise<void>;
  repeat(name: string, everyMs: number): Promise<void>;
}

class InProcessQueue implements QueueBackend {
  private handlers = new Map<string, JobHandler>();
  private pending = new Set<string>();

  async register(name: string, handler: JobHandler) {
    this.handlers.set(name, handler);
  }

  async enqueue(name: string, data: unknown, opts?: { delayMs?: number; jobId?: string }) {
    const key = opts?.jobId ? `${name}:${opts.jobId}` : null;
    if (key && this.pending.has(key)) return;
    if (key) this.pending.add(key);
    setTimeout(async () => {
      if (key) this.pending.delete(key);
      const h = this.handlers.get(name);
      if (!h) return;
      try {
        await h(data);
      } catch (err) {
        logger.error('Job failed', { job: name, err: err as Error });
      }
    }, opts?.delayMs ?? 0);
  }

  async repeat(name: string, everyMs: number) {
    setInterval(() => void this.enqueue(name, {}, { jobId: 'repeat' }), everyMs).unref();
    void this.enqueue(name, {}, { delayMs: 5_000, jobId: 'repeat' });
  }
}

class BullQueue implements QueueBackend {
  private queues = new Map<string, any>();
  private connection: any;
  private bull: any;

  async init() {
    this.bull = await import('bullmq');
    const { default: IORedis } = await import('ioredis');
    this.connection = new IORedis(config.REDIS_URL!, { maxRetriesPerRequest: null });
  }

  private q(name: string) {
    if (!this.queues.has(name)) this.queues.set(name, new this.bull.Queue(name, { connection: this.connection }));
    return this.queues.get(name);
  }

  async register(name: string, handler: JobHandler) {
    new this.bull.Worker(name, async (job: any) => handler(job.data), { connection: this.connection, concurrency: 5 });
  }

  async enqueue(name: string, data: unknown, opts?: { delayMs?: number; jobId?: string }) {
    await this.q(name).add(name, data, {
      delay: opts?.delayMs,
      jobId: opts?.jobId,
      removeOnComplete: 1000,
      removeOnFail: 5000,
    });
  }

  async repeat(name: string, everyMs: number) {
    await this.q(name).add(name, {}, { repeat: { every: everyMs }, jobId: `${name}-repeat`, removeOnComplete: 100 });
  }
}

let backend: QueueBackend;

export async function initQueue() {
  if (config.REDIS_URL) {
    const b = new BullQueue();
    await b.init();
    backend = b;
    logger.info('Queue: BullMQ/Redis');
  } else {
    if (config.isProd) logger.warn('Queue: REDIS_URL not set — using in-process queue (not recommended in production)');
    backend = new InProcessQueue();
  }
}

export const queue = {
  register: (name: string, h: JobHandler) => backend.register(name, h),
  enqueue: (name: string, data: unknown, opts?: { delayMs?: number; jobId?: string }) => backend.enqueue(name, data, opts),
  repeat: (name: string, everyMs: number) => backend.repeat(name, everyMs),
};
