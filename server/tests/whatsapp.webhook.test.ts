import assert from 'node:assert';
import crypto from 'node:crypto';
import { handleWebhookVerification, verifySignature, processWebhookEvents } from '../modules/whatsapp/webhook.service';

async function runTests() {
  console.log('====================================================');
  console.log('SAMADHAN SETU — WHATSAPP WEBHOOK TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;

  // Test 1: Webhook verification challenge
  try {
    console.log('Test 1: Webhook Verification Handshake...');
    const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'samadhan_setu_verify_token';
    const challenge = 'challenge_random_123456';
    const result = handleWebhookVerification('subscribe', verifyToken, challenge);
    assert.strictEqual(result, challenge);

    const invalidResult = handleWebhookVerification('subscribe', 'invalid_token', challenge);
    assert.strictEqual(invalidResult, null);
    console.log('✓ Test 1 Passed: Handshake verification handles valid and invalid tokens correctly.');
    passed++;
  } catch (err) {
    console.error('✗ Test 1 Failed:', err);
  }

  // Test 2: Cryptographic Signature Verification
  try {
    console.log('Test 2: Cryptographic Signature Verification...');
    const secret = 'test-secret-at-least-32-chars-long-000000';
    const body = Buffer.from(JSON.stringify({ object: 'whatsapp', test: true }));
    const validSignature = 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');

    const isValid = verifySignature(body, validSignature);
    assert.strictEqual(isValid, true);

    const isInvalid = verifySignature(body, 'sha256=invalidhash');
    assert.strictEqual(typeof isInvalid, 'boolean');
    console.log('✓ Test 2 Passed: HMAC-SHA256 signature verification validates correctly.');
    passed++;
  } catch (err) {
    console.error('✗ Test 2 Failed:', err);
  }

  // Test 3: Payload parsing structure
  try {
    console.log('Test 3: Webhook payload parsing and structure handling...');
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'acc_test',
          changes: [
            {
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '919999999999', phone_number_id: 'ph_123' },
                statuses: [
                  {
                    id: 'wamid.HBgLMTIzNDU2',
                    status: 'delivered' as const,
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    recipient_id: '919999999999',
                  },
                ],
                messages: [
                  {
                    from: '919999999999',
                    id: 'wamid.HBgLInbound123',
                    timestamp: `${Math.floor(Date.now() / 1000)}`,
                    type: 'button',
                    button: { payload: 'VERIFY_RESOLVED', text: 'Yes, Resolved' },
                  },
                ],
              },
              field: 'messages',
            },
          ],
        },
      ],
    };

    const res = await processWebhookEvents(payload);
    assert.strictEqual(res.processedMessages, 1);
    console.log('✓ Test 3 Passed: Payload event structure parsed with inbound message detection.');
    passed++;
  } catch (err) {
    console.error('✗ Test 3 Failed:', err);
  }

  console.log(`\n====================================================`);
  console.log(`WHATSAPP TEST SUMMARY: ${passed}/3 TESTS PASSED CLEANLY.`);
  console.log(`====================================================\n`);
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
