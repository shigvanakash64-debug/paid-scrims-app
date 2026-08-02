import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReferralCommissionAmount } from './rewardService.js';

test('calculates referral commission from the full platform profit', () => {
  assert.equal(calculateReferralCommissionAmount(20, 20), 4);
  assert.equal(calculateReferralCommissionAmount(30, 20), 6);
});
