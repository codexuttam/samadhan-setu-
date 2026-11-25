import assert from 'node:assert/strict';
import { pickBestSlaRule } from '../modules/escalation/sla';
import { triageComplaint, verifyResolutionEvidence } from '../modules/ai/ai.service';
import { inScope, ticketScopeWhere, canWorkOn, type AuthUser } from '../modules/authority/rbac';
import { findTransition, manualTransitions } from '../modules/tickets/stateMachine';
import { passwordPolicy } from '../modules/authority/auth.service';

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: 'user-1',
    name: 'Officer A',
    email: 'officer@samadhan.gov.in',
    roleCode: 'WARD_OFFICER',
    roleName: 'Ward Officer',
    scope: 'WARD',
    levelOrder: 1,
    levelName: 'Level 1',
    permissions: new Set(['ticket.view', 'ticket.accept']),
    departmentId: 'dept-roads',
    zoneId: 'zone-1',
    wardId: 'ward-12',
    sessionId: 'sess-1',
    totpEnabled: false,
    ...overrides,
  };
}

async function runTests() {
  console.log('====================================================');
  console.log('SAMADHAN SETU — CORE HARDENING UNIT TEST SUITE');
  console.log('====================================================\n');

  // 1. SLA rule specificity precedence (even when global NULL rule appears first)
  console.log('Test 1: SLA rule specificity precedence...');
  const globalRule = { id: 'global', departmentId: null, priority: null, slaHours: 72 };
  const priorityRule = { id: 'prio', departmentId: null, priority: 'CRITICAL' as const, slaHours: 12 };
  const deptRule = { id: 'dept', departmentId: 'dept-roads', priority: null, slaHours: 48 };
  const exactRule = { id: 'exact', departmentId: 'dept-roads', priority: 'CRITICAL' as const, slaHours: 6 };
  const unrelatedRule = { id: 'other', departmentId: 'dept-water', priority: 'CRITICAL' as const, slaHours: 2 };

  assert.equal(pickBestSlaRule([globalRule, unrelatedRule, priorityRule, deptRule, exactRule], 'dept-roads', 'CRITICAL')?.id, 'exact');
  assert.equal(pickBestSlaRule([globalRule, unrelatedRule, priorityRule, deptRule], 'dept-roads', 'CRITICAL')?.id, 'dept');
  assert.equal(pickBestSlaRule([globalRule, unrelatedRule, priorityRule], 'dept-roads', 'CRITICAL')?.id, 'prio');
  assert.equal(pickBestSlaRule([globalRule, unrelatedRule], 'dept-roads', 'CRITICAL')?.id, 'global');
  assert.equal(pickBestSlaRule([unrelatedRule], 'dept-roads', 'CRITICAL'), undefined);
  console.log('✓ Test 1 Passed: Specific SLA rules always outrank global defaults.\n');

  // 2. Multilingual triage (English + Hindi)
  console.log('Test 2: Multilingual triage classification...');
  const prevKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const enCritical = await triageComplaint('There is a sparking live wire near the school gate');
  assert.equal(enCritical.priority, 'CRITICAL');

  const hiManhole = await triageComplaint('सड़क के बीच में खुला मेनहोल है, दुर्घटना हो सकती है');
  assert.equal(hiManhole.priority, 'CRITICAL');

  const hiWire = await triageComplaint('बिजली का तार टूटकर लटक रहा है, करंट आ रहा है');
  assert.equal(hiWire.priority, 'CRITICAL');

  const hiWater = await triageComplaint('नल में गंदा पानी आ रहा है');
  assert.equal(hiWater.priority, 'HIGH');
  assert.equal(hiWater.suggestedCategory, 'Water Supply & Drainage');

  const hiGarbage = await triageComplaint('कॉलोनी के बाहर कूड़ा और कचरा जमा है');
  assert.equal(hiGarbage.priority, 'MEDIUM');
  assert.equal(hiGarbage.suggestedCategory, 'Garbage & Sanitation');

  if (prevKey) process.env.GEMINI_API_KEY = prevKey;
  console.log('✓ Test 2 Passed: English and Hindi hazard triage works deterministically.\n');

  // 3. Honest fallback on verifyResolutionEvidence without real image bytes
  console.log('Test 3: Resolution verification honest fallback...');
  const fallbackVerify = await verifyResolutionEvidence({ issueDescription: 'Pothole repair on Main Road' });
  assert.equal(fallbackVerify.verifiedByAi, false);
  assert.equal(fallbackVerify.isAuthentic, false);
  assert.equal(fallbackVerify.confidenceScore, 0);
  assert.ok(fallbackVerify.flags.includes('MANUAL_REVIEW_REQUIRED'));
  console.log('✓ Test 3 Passed: Missing image/API key returns explicit manual review fallback.\n');

  // 4. RBAC scope isolation & work ownership
  console.log('Test 4: RBAC scope isolation and assignee checks...');
  const wardUser = makeUser({ scope: 'WARD', wardId: 'ward-12', departmentId: 'dept-roads' });
  assert.equal(inScope(wardUser, { departmentId: 'dept-roads', zoneId: 'zone-1', wardId: 'ward-12' }), true);
  assert.equal(inScope(wardUser, { departmentId: 'dept-roads', zoneId: 'zone-1', wardId: 'ward-99' }), false);
  assert.equal(inScope(wardUser, { departmentId: 'dept-water', zoneId: 'zone-1', wardId: 'ward-12' }), false);

  const zoneUser = makeUser({ scope: 'ZONE', zoneId: 'zone-1', wardId: null, departmentId: null });
  assert.equal(inScope(zoneUser, { departmentId: 'dept-water', zoneId: 'zone-1', wardId: 'ward-99' }), true);
  assert.equal(inScope(zoneUser, { departmentId: 'dept-water', zoneId: 'zone-2', wardId: 'ward-99' }), false);

  const deptUser = makeUser({ scope: 'DEPARTMENT', departmentId: 'dept-water', zoneId: null, wardId: null });
  assert.deepEqual(ticketScopeWhere(deptUser), { departmentId: 'dept-water' });

  const districtUser = makeUser({ scope: 'DISTRICT', departmentId: null, zoneId: null, wardId: null });
  assert.deepEqual(ticketScopeWhere(districtUser), {});

  assert.equal(canWorkOn(wardUser, { assignedOfficerId: 'user-1', currentLevelOrder: 1 }), true);
  assert.equal(canWorkOn(wardUser, { assignedOfficerId: 'user-2', currentLevelOrder: 1 }), false);
  assert.equal(canWorkOn(wardUser, { assignedOfficerId: null, currentLevelOrder: 2 }), false);
  assert.equal(canWorkOn(makeUser({ levelOrder: 2 }), { assignedOfficerId: null, currentLevelOrder: 2 }), true);
  console.log('✓ Test 4 Passed: RBAC ward/zone/department/district scoping & ownership enforced.\n');

  // 5. State machine transition rules
  console.log('Test 5: Ticket state machine transition guards...');
  assert.ok(findTransition('ASSIGNED', 'ACCEPTED', 'AUTHORITY'));
  assert.equal(findTransition('CLOSED', 'IN_PROGRESS', 'AUTHORITY'), null);
  assert.equal(findTransition('SUBMITTED', 'CLOSED', 'AUTHORITY'), null);
  assert.ok(findTransition('AWAITING_CITIZEN_VERIFICATION', 'REOPENED', 'CITIZEN'));
  assert.ok(manualTransitions('ACCEPTED').some((r) => r.to === 'IN_PROGRESS'));
  assert.equal(manualTransitions('IN_PROGRESS').some((r) => r.to === 'WORK_COMPLETED'), false);
  console.log('✓ Test 5 Passed: Illegal transitions rejected and manual transitions filtered.\n');

  // 6. Password policy enforcement
  console.log('Test 6: Authority password policy...');
  assert.throws(() => passwordPolicy('short123'));
  assert.throws(() => passwordPolicy('onlyletterslongpassword'));
  assert.throws(() => passwordPolicy('12345678901234'));
  assert.doesNotThrow(() => passwordPolicy('SamadhanSetu2026'));
  console.log('✓ Test 6 Passed: Weak passwords rejected and compliant passwords accepted.\n');

  console.log('====================================================');
  console.log('CORE HARDENING SUMMARY: 6/6 TESTS PASSED CLEANLY.');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Core hardening tests failed:', err);
  process.exit(1);
});
