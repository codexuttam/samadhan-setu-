import assert from 'node:assert/strict';
import { pickBestSlaRule } from '../modules/escalation/sla';
import { triageComplaint, verifyResolutionEvidence, chatCivicConcierge } from '../modules/ai/ai.service';
import { inScope, ticketScopeWhere, canWorkOn, type AuthUser } from '../modules/authority/rbac';
import { findTransition, manualTransitions } from '../modules/tickets/stateMachine';
import { passwordPolicy } from '../modules/authority/auth.service';
import { isDbConnectivityError, createDbWorkerGuard } from '../lib/dbGuard';
import { haversineMeters, evaluateGeofence } from '../lib/geo';

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

  // 7. DB outage worker backoff guard
  console.log('Test 7: DB outage worker backoff guard...');
  const connErr = Object.assign(new Error("Can't reach database server at `host:6543`"), {
    name: 'PrismaClientInitializationError',
  });
  assert.equal(isDbConnectivityError(connErr), true);
  assert.equal(isDbConnectivityError(new Error('Validation error')), false);

  let fakeNow = 10_000;
  let calls = 0;
  const guard = createDbWorkerGuard('test-worker', {
    baseBackoffMs: 1000,
    maxBackoffMs: 4000,
    now: () => fakeNow,
  });

  await guard.run(async () => {
    calls += 1;
    throw connErr;
  });
  assert.equal(calls, 1);
  assert.equal(guard.getState().consecutiveFailures, 1);
  assert.equal(guard.getState().nextAttemptAt, 11_000);

  // Within backoff window: should skip without invoking fn
  fakeNow = 10_500;
  await guard.run(async () => {
    calls += 1;
  });
  assert.equal(calls, 1);

  // After backoff expires, fail again -> 2x backoff (2000ms)
  fakeNow = 11_000;
  await guard.run(async () => {
    calls += 1;
    throw connErr;
  });
  assert.equal(calls, 2);
  assert.equal(guard.getState().consecutiveFailures, 2);
  assert.equal(guard.getState().nextAttemptAt, 13_000);

  // Recover cleanly on success after backoff
  fakeNow = 13_000;
  const recovered = await guard.run(async () => {
    calls += 1;
    return 'ok';
  });
  assert.equal(recovered, 'ok');
  assert.equal(guard.getState().consecutiveFailures, 0);

  // Non-connectivity error must still propagate
  await assert.rejects(
    guard.run(async () => {
      throw new Error('Unexpected bug');
    }),
    /Unexpected bug/,
  );
  console.log('✓ Test 7 Passed: DB backoff guard skips during outages, recovers cleanly, and re-throws logic bugs.\n');

  // 8. Server-side geofence Haversine distance & audit threshold check
  console.log('Test 8: Server-side geofence evaluation...');
  assert.equal(haversineMeters(28.5912, 77.0423, 28.5912, 77.0423), 0);
  const hundredMeterShift = haversineMeters(28.5912, 77.0423, 28.5921, 77.0423);
  assert.ok(hundredMeterShift > 90 && hundredMeterShift < 120, `Expected ~100m, got ${hundredMeterShift}`);

  const inside = evaluateGeofence(28.5912, 77.0423, 28.5921, 77.0423, 250);
  assert.ok(inside && inside.withinGeofence === true && inside.maxMeters === 250);

  const outside = evaluateGeofence(28.5912, 77.0423, 28.6012, 77.0423, 250);
  assert.ok(outside && outside.withinGeofence === false && outside.distanceMeters > 1000);

  assert.equal(evaluateGeofence(null, 77.0423, 28.5912, 77.0423), null);
  assert.equal(evaluateGeofence(28.5912, 77.0423, undefined, 77.0423), null);
  console.log('✓ Test 8 Passed: Haversine geofence verification computes meter distances accurately.\n');

  // 9. Hindi & English Concierge fallback classification
  console.log('Test 9: Bilingual Civic Concierge fallback...');
  const prevConciergeKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  const hiWaterChat = await chatCivicConcierge({
    message: 'हमारे वार्ड में खुला मेनहोल और गंदा पानी है',
    language: 'hi',
  });
  assert.ok(/[\u0900-\u097F]/.test(hiWaterChat.reply), 'Expected Hindi reply');
  assert.equal(hiWaterChat.prefill?.categoryId, 'water_drainage');
  assert.equal(hiWaterChat.prefill?.priority, 'critical');

  const hiRoadChat = await chatCivicConcierge({
    message: 'सड़क पर बड़ा गड्ढा है',
    language: 'hi',
  });
  assert.ok(/[\u0900-\u097F]/.test(hiRoadChat.reply), 'Expected Hindi reply for road query');
  assert.equal(hiRoadChat.prefill?.categoryId, 'roads_potholes');

  const enLightChat = await chatCivicConcierge({
    message: 'Sparking electric wire near park pole',
    language: 'en',
  });
  assert.equal(enLightChat.prefill?.categoryId, 'street_lights');
  assert.equal(enLightChat.prefill?.priority, 'critical');

  if (prevConciergeKey) process.env.GEMINI_API_KEY = prevConciergeKey;
  console.log('✓ Test 9 Passed: Bilingual Concierge fallback produces localized Hindi & English guidance.\n');

  console.log('====================================================');
  console.log('CORE HARDENING SUMMARY: 9/9 TESTS PASSED CLEANLY.');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Core hardening tests failed:', err);
  process.exit(1);
});
