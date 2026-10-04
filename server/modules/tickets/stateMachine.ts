import type { ActorType, TicketStatus } from '@prisma/client';

/**
 * Deterministic ticket state machine.
 * Every status change in the system MUST go through `assertTransition`.
 */
export interface TransitionRule {
  to: TicketStatus;
  /** who may trigger it */
  actors: ActorType[];
  /** permission required when actor is AUTHORITY */
  permission?: string;
  /** must the acting officer be the assignee (or senior in scope)? */
  assigneeOnly?: boolean;
  /** shown to the citizen on the public timeline */
  publicLabel: string;
}

const ACTIVE: TicketStatus[] = ['SUBMITTED', 'ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS', 'REOPENED'];

const escalateRule: TransitionRule = {
  to: 'ESCALATED',
  actors: ['SYSTEM', 'AUTHORITY', 'CITIZEN'],
  permission: 'ticket.escalate',
  publicLabel: 'Escalated to a senior authority',
};

export const TRANSITIONS: Record<TicketStatus, TransitionRule[]> = {
  SUBMITTED: [
    { to: 'ASSIGNED', actors: ['SYSTEM', 'AUTHORITY'], permission: 'ticket.assign', publicLabel: 'Assigned to department' },
    escalateRule,
  ],
  ASSIGNED: [
    { to: 'ACCEPTED', actors: ['AUTHORITY'], permission: 'ticket.accept', assigneeOnly: true, publicLabel: 'Officer accepted the complaint' },
    { to: 'ASSIGNED', actors: ['AUTHORITY', 'SYSTEM'], permission: 'ticket.assign', publicLabel: 'Officer assigned' },
    escalateRule,
  ],
  ACCEPTED: [
    { to: 'INSPECTION', actors: ['AUTHORITY'], permission: 'ticket.update_status', assigneeOnly: true, publicLabel: 'Site inspection' },
    { to: 'IN_PROGRESS', actors: ['AUTHORITY'], permission: 'ticket.update_status', assigneeOnly: true, publicLabel: 'Work in progress' },
    escalateRule,
  ],
  INSPECTION: [
    { to: 'IN_PROGRESS', actors: ['AUTHORITY'], permission: 'ticket.update_status', assigneeOnly: true, publicLabel: 'Work in progress' },
    escalateRule,
  ],
  IN_PROGRESS: [
    { to: 'WORK_COMPLETED', actors: ['AUTHORITY'], permission: 'ticket.complete', assigneeOnly: true, publicLabel: 'Work completed' },
    escalateRule,
  ],
  WORK_COMPLETED: [
    { to: 'AWAITING_CITIZEN_VERIFICATION', actors: ['SYSTEM'], publicLabel: 'Awaiting your verification' },
  ],
  AWAITING_CITIZEN_VERIFICATION: [
    { to: 'RESOLVED', actors: ['CITIZEN', 'SYSTEM'], publicLabel: 'Confirmed resolved' },
    { to: 'REOPENED', actors: ['CITIZEN'], publicLabel: 'Reported as not resolved — reopened' },
  ],
  RESOLVED: [{ to: 'CLOSED', actors: ['SYSTEM', 'AUTHORITY'], permission: 'ticket.close', publicLabel: 'Closed' }],
  REOPENED: [
    { to: 'ASSIGNED', actors: ['AUTHORITY', 'SYSTEM'], permission: 'ticket.assign', publicLabel: 'Officer assigned' },
    { to: 'IN_PROGRESS', actors: ['AUTHORITY'], permission: 'ticket.update_status', assigneeOnly: true, publicLabel: 'Work restarted' },
    escalateRule,
  ],
  ESCALATED: [
    { to: 'ASSIGNED', actors: ['AUTHORITY', 'SYSTEM'], permission: 'ticket.assign', publicLabel: 'Officer assigned' },
    { to: 'ACCEPTED', actors: ['AUTHORITY'], permission: 'ticket.accept', assigneeOnly: true, publicLabel: 'Officer accepted the complaint' },
    { to: 'IN_PROGRESS', actors: ['AUTHORITY'], permission: 'ticket.update_status', assigneeOnly: true, publicLabel: 'Work in progress' },
    escalateRule,
  ],
  // Terminal: only a senior authority holding ticket.reopen_closed may reopen.
  CLOSED: [{ to: 'REOPENED', actors: ['AUTHORITY'], permission: 'ticket.reopen_closed', publicLabel: 'Reopened by authority' }],
};

export function findTransition(from: TicketStatus, to: TicketStatus, actor: ActorType) {
  return TRANSITIONS[from]?.find((r) => r.to === to && r.actors.includes(actor)) ?? null;
}

/** Statuses an officer may manually select from the CRM (excludes system-only moves). */
export function manualTransitions(from: TicketStatus) {
  return (TRANSITIONS[from] ?? []).filter(
    (r) => r.actors.includes('AUTHORITY') && r.to !== 'ESCALATED' && r.to !== 'ASSIGNED' && r.to !== 'WORK_COMPLETED',
  );
}

export const isActive = (s: TicketStatus) => ACTIVE.includes(s) || s === 'ESCALATED';

/** SLA clock runs only while the authority side owes action. */
export const slaApplies = (s: TicketStatus) => isActive(s);

export const TERMINAL: TicketStatus[] = ['RESOLVED', 'CLOSED'];
