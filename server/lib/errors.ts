import type { NextFunction, Request, Response, RequestHandler } from 'express';
import { ZodError, ZodSchema } from 'zod';
import { logger } from './logger';

/** Errors safe to show to clients. Anything else becomes a generic message. */
export class AppError extends Error {
  constructor(public status: number, public code: string, message: string, public details?: unknown) {
    super(message);
  }
}

export const Errors = {
  badRequest: (msg = 'Please check the details and try again.', details?: unknown) => new AppError(400, 'BAD_REQUEST', msg, details),
  unauthorized: (msg = 'Please sign in to continue.') => new AppError(401, 'UNAUTHORIZED', msg),
  forbidden: (msg = 'You do not have permission to perform this action.') => new AppError(403, 'FORBIDDEN', msg),
  notFound: (msg = 'The requested item could not be found.') => new AppError(404, 'NOT_FOUND', msg),
  conflict: (msg = 'This item was updated by someone else. Please refresh and try again.') => new AppError(409, 'CONFLICT', msg),
  tooMany: (msg = 'Too many attempts. Please wait a few minutes and try again.') => new AppError(429, 'RATE_LIMITED', msg),
  linkInvalid: () => new AppError(410, 'LINK_INVALID', 'This link is invalid or has expired. Please request a new one.'),
  invalidTransition: (from: string, to: string) =>
    new AppError(422, 'INVALID_TRANSITION', `A complaint cannot move from ${from.replace(/_/g, ' ')} to ${to.replace(/_/g, ' ')}.`),
  delivery: () => new AppError(502, 'DELIVERY_FAILED', 'We could not deliver the WhatsApp message right now. Please try again shortly.'),
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

export function parse<T>(schema: ZodSchema<T>, data: unknown): T {
  const r = schema.safeParse(data);
  if (!r.success) {
    throw Errors.badRequest('Some fields are missing or invalid.', r.error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })));
  }
  return r.data;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
  }
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'Some fields are missing or invalid.' } });
  }
  const e = err as { code?: string; type?: string; message?: string };
  if (e?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: { code: 'FILE_TOO_LARGE', message: 'One of the files is too large.' } });
  }
  if (e?.type === 'entity.too.large') {
    return res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request is too large.' } });
  }
  logger.error('Unhandled error', { path: req.path, err: err as Error });
  // Never leak internal/DB errors
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Something went wrong. Please try again.' } });
}
