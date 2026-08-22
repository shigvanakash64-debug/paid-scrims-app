import test from 'node:test';
import assert from 'node:assert/strict';
import { shouldRequirePhoneVerification } from '../middleware/authMiddleware.js';

test('users without a phone number are not forced through phone verification', () => {
  assert.equal(shouldRequirePhoneVerification({ phone: null, phoneVerified: false }), false);
  assert.equal(shouldRequirePhoneVerification({ phone: '', phoneVerified: false }), false);
  assert.equal(shouldRequirePhoneVerification({ phone: '+919999999999', phoneVerified: false }), true);
  assert.equal(shouldRequirePhoneVerification({ phone: '+919999999999', phoneVerified: true }), false);
});
