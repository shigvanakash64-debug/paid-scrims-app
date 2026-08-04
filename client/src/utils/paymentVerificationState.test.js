import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getPaymentVerificationStorageKey,
  readPaymentVerificationState,
  writePaymentVerificationState,
} from './paymentVerificationState.js';

test('stores and reads payment verification state for an order', () => {
  const storage = new Map();
  const orderId = 'CZ-123';

  const written = writePaymentVerificationState(orderId, { status: 'success' }, storage);
  assert.equal(written.status, 'success');

  const read = readPaymentVerificationState(orderId, storage);
  assert.deepEqual(read, { status: 'success' });
});

test('uses a scoped storage key for each order', () => {
  const storage = new Map();
  const orderId = 'CZ-456';

  writePaymentVerificationState(orderId, { status: 'failed' }, storage);

  assert.equal(getPaymentVerificationStorageKey(orderId), 'clutchzone_payment_verification:CZ-456');
  assert.equal(storage.get('clutchzone_payment_verification:CZ-456').status, 'failed');
});
