import type { ActorType, Prisma } from '@prisma/client';
import { prisma, type Tx } from '../../lib/prisma';
import { logger } from '../../lib/logger';

export type AuditAction =
  | 'LOGIN'
  | 'LOGIN_FAILED'
  | 'LOGOUT'
  | 'MFA_ENABLED'
  | 'ACCOUNT_ACTIVATED'
  | 'COMPLAINT_CREATED'
  | 'COMPLAINT_VIEWED'
  | 'COMPLAINT_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'NOTE_ADDED'
  | 'EVIDENCE_UPLOADED'
  | 'ESCALATED'
  | 'WORK_COMPLETED'
  | 'CITIZEN_VERIFIED'
  | 'COMPLAINT_REOPENED'
  | 'COMPLAINT_CLOSED'
  | 'FEEDBACK_SUBMITTED'
  | 'AUTHORITY_USER_CREATED'
  | 'AUTHORITY_USER_UPDATED'
  | 'ORG_UPDATED'
  | 'RULES_UPDATED'
  | 'SETTINGS_UPDATED'
  | 'SLA_WARNING_TRIGGERED'
  | 'MANUAL_ESCALATION'
  | 'CONTACT_PURGED';

export interface AuditActor {
  type: ActorType;
  id?: string | null;
  role?: string | null;
}

export interface AuditEntry {
  actor: AuditActor;
  action: AuditAction;
  ticketId?: string | null;
  entity?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ip?: string | null;
}

export const SYSTEM_ACTOR: AuditActor = { type: 'SYSTEM', id: null, role: 'SYSTEM' };
export const CITIZEN_ACTOR: AuditActor = { type: 'CITIZEN', id: null, role: 'CITIZEN' };

/** Append an immutable audit record. Pass `tx` to make it part of the business transaction. */
export async function audit(entry: AuditEntry, tx?: Tx) {
  const client = tx ?? prisma;
  try {
    await client.auditLog.create({
      data: {
        actorType: entry.actor.type,
        actorId: entry.actor.id ?? null,
        actorRole: entry.actor.role ?? null,
        action: entry.action,
        ticketId: entry.ticketId ?? null,
        entity: entry.entity,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ipAddress: entry.ip ?? null,
      },
    });
  } catch (err) {
    if (tx) throw err; // never silently lose an audit record inside a business transaction
    logger.error('Audit write failed', { action: entry.action, err: err as Error });
  }
}
