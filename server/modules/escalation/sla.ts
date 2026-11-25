import type { TicketPriority } from '@prisma/client';
import type { Tx } from '../../lib/prisma';
import { getSettings } from '../../lib/settings';

/**
 * Deterministic specificity rank for EscalationRule matching.
 * Postgres `ORDER BY col DESC` sorts NULLs first, which lets global rules override
 * department/priority-specific rules; ranking in code avoids that pitfall.
 */
export function pickBestSlaRule<T extends { departmentId: string | null; priority: TicketPriority | null }>(
  rules: T[],
  departmentId: string,
  priority: TicketPriority,
): T | undefined {
  let best: T | undefined;
  let bestScore = -1;

  for (const r of rules) {
    const deptMatch = r.departmentId === departmentId;
    const priorityMatch = r.priority === priority;
    if (r.departmentId !== null && !deptMatch) continue;
    if (r.priority !== null && !priorityMatch) continue;

    const score = (deptMatch ? 2 : 0) + (priorityMatch ? 1 : 0);
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  return best;
}

export async function resolveSlaHours(
  tx: Tx,
  departmentId: string,
  priority: TicketPriority,
  fromLevelOrder = 1,
): Promise<number> {
  const rules = await tx.escalationRule.findMany({
    where: {
      active: true,
      fromLevelOrder,
      OR: [
        { departmentId, priority },
        { departmentId, priority: null },
        { departmentId: null, priority },
        { departmentId: null, priority: null },
      ],
    },
  });

  const best = pickBestSlaRule(rules, departmentId, priority);
  if (best) return best.slaHours;

  return (await getSettings()).sla.defaultHours;
}
