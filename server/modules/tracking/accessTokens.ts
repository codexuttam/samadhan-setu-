import type { AccessTokenScope } from '@prisma/client';
import { prisma, type Tx } from '../../lib/prisma';
import { signPayload, verifyPayload } from '../../lib/crypto';
import { Errors } from '../../lib/errors';
import { getSettings } from '../../lib/settings';

/**
 * Secure citizen links: /track/secure/<token>, /verify/<token>, /review/<token>
 *  - HMAC-signed (tamper-proof), with expiry
 *  - backed by a TicketAccessToken row → revocable, scoped to exactly one ticket
 *  - payload contains only a random jti + scope + exp: no phone, no ticket/DB ids
 */
interface LinkPayload {
  j: string; // jti (TicketAccessToken.id)
  s: 'T' | 'V';
  exp: number;
}

export async function issueAccessToken(ticketId: string, scope: AccessTokenScope, tx?: Tx) {
  const settings = await getSettings();
  const hours = scope === 'TRACK' ? settings.links.trackTtlHours : settings.links.verifyTtlHours;
  const expiresAt = new Date(Date.now() + hours * 3600_000);
  const client = tx ?? prisma;
  if (scope === 'VERIFY') {
    // only one live verification link per ticket
    await client.ticketAccessToken.updateMany({
      where: { ticketId, scope: 'VERIFY', revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  const row = await client.ticketAccessToken.create({ data: { ticketId, scope, expiresAt } });
  return signPayload({ j: row.id, s: scope === 'TRACK' ? 'T' : 'V', exp: Math.floor(expiresAt.getTime() / 1000) } satisfies LinkPayload);
}

/**
 * Resolve a link to its ticket id. VERIFY tokens also grant read access (a citizen
 * arriving from the "work completed" message must see the complaint).
 */
export async function resolveAccessToken(token: string, required: AccessTokenScope | 'ANY', tx?: Tx) {
  const p = verifyPayload<LinkPayload>(token);
  if (!p || !p.j || !/^[0-9a-f-]{36}$/.test(p.j)) throw Errors.linkInvalid();
  const client = tx ?? prisma;
  const row = await client.ticketAccessToken.findUnique({ where: { id: p.j } });
  if (!row || row.revokedAt || row.expiresAt < new Date()) throw Errors.linkInvalid();
  if (required !== 'ANY' && row.scope !== required) throw Errors.linkInvalid();
  return row;
}

export async function revokeAccessToken(id: string, tx?: Tx) {
  await (tx ?? prisma).ticketAccessToken.update({ where: { id }, data: { revokedAt: new Date(), usedAt: new Date() } });
}
