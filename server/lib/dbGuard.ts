import { logger } from './logger';

const CONNECTIVITY_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017']);

export function isDbConnectivityError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { name?: string; code?: string; message?: string };
  if (e.name === 'PrismaClientInitializationError') return true;
  if (e.code && CONNECTIVITY_CODES.has(e.code)) return true;
  const msg = (e.message || '').toLowerCase();
  return (
    msg.includes("can't reach database server") ||
    msg.includes('connection refused') ||
    msg.includes('econnrefused') ||
    msg.includes('etimedout') ||
    msg.includes('connection timed out') ||
    msg.includes('server closed the connection unexpectedly')
  );
}

export interface DbWorkerGuardOptions {
  baseBackoffMs?: number;
  maxBackoffMs?: number;
  now?: () => number;
}

export function createDbWorkerGuard(workerName: string, opts: DbWorkerGuardOptions = {}) {
  const baseBackoffMs = opts.baseBackoffMs ?? 60_000;
  const maxBackoffMs = opts.maxBackoffMs ?? 300_000;
  const now = opts.now ?? (() => Date.now());

  let consecutiveFailures = 0;
  let nextAttemptAt = 0;

  return {
    async run<T>(fn: () => Promise<T>): Promise<T | undefined> {
      const current = now();
      if (current < nextAttemptAt) {
        return undefined;
      }

      try {
        const result = await fn();
        if (consecutiveFailures > 0) {
          logger.info(`${workerName}: database connectivity restored`, {
            previousFailures: consecutiveFailures,
          });
          consecutiveFailures = 0;
          nextAttemptAt = 0;
        }
        return result;
      } catch (err) {
        if (!isDbConnectivityError(err)) {
          throw err;
        }

        consecutiveFailures += 1;
        const backoffMs = Math.min(maxBackoffMs, baseBackoffMs * 2 ** (consecutiveFailures - 1));
        nextAttemptAt = current + backoffMs;

        if (consecutiveFailures === 1 || consecutiveFailures % 5 === 0) {
          logger.warn(`${workerName}: database unreachable; backing off worker`, {
            consecutiveFailures,
            nextRetryInSeconds: Math.round(backoffMs / 1000),
          });
        }
        return undefined;
      }
    },

    reset() {
      consecutiveFailures = 0;
      nextAttemptAt = 0;
    },

    getState() {
      return { consecutiveFailures, nextAttemptAt };
    },
  };
}
