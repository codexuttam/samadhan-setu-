import { PrismaClient, Prisma } from '@prisma/client';

export const prisma = new PrismaClient({ log: ['warn', 'error'] });

export type Tx = Prisma.TransactionClient;

/** Run an interactive transaction with sane defaults. */
export function withTx<T>(fn: (tx: Tx) => Promise<T>) {
  return prisma.$transaction(fn, { timeout: 20_000, maxWait: 10_000 });
}

export function isUniqueViolation(err: unknown) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}
