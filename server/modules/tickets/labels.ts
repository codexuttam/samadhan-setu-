import type { TicketStatus } from '@prisma/client';

export const STATUS_LABEL: Record<TicketStatus, string> = {
  SUBMITTED: 'Submitted',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  INSPECTION: 'Inspection',
  IN_PROGRESS: 'In Progress',
  WORK_COMPLETED: 'Work Completed',
  AWAITING_CITIZEN_VERIFICATION: 'Awaiting Verification',
  RESOLVED: 'Resolved',
  REOPENED: 'Reopened',
  ESCALATED: 'Escalated',
  CLOSED: 'Closed',
};
