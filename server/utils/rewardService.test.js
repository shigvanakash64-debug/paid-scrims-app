import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateReferralCommissionAmount,
  computeWithdrawalEligibility,
  getRewardFeatureState,
} from './rewardService.js';

test('calculates referral commission from the full platform profit', () => {
  assert.equal(calculateReferralCommissionAmount(20, 20), 4);
  assert.equal(calculateReferralCommissionAmount(30, 20), 6);
});

test('withdrawal rules require a ₹20 deposit and a ₹20+ paid match', () => {
  const eligible = computeWithdrawalEligibility({
    successfulDepositAmount: 20,
    qualifyingPaidMatchCount: 1,
  });

  const missingDeposit = computeWithdrawalEligibility({
    successfulDepositAmount: 19,
    qualifyingPaidMatchCount: 1,
  });

  const missingMatch = computeWithdrawalEligibility({
    successfulDepositAmount: 20,
    qualifyingPaidMatchCount: 0,
  });

  assert.equal(eligible.canWithdraw, true);
  assert.equal(missingDeposit.canWithdraw, false);
  assert.equal(missingMatch.canWithdraw, false);
  assert.equal(eligible.message, 'Eligible to redeem');
});

test('reward defaults disable referral and cashback while enabling the ₹10 signup bonus', () => {
  const features = getRewardFeatureState();

  assert.equal(features.referralEnabled, false);
  assert.equal(features.cashbackEnabled, false);
  assert.equal(features.signupBonusEnabled, true);
  assert.equal(features.signupBonusAmount, 10);
  assert.equal(features.minimumDepositForWithdrawal, 20);
  assert.equal(features.minimumMatchEntryForWithdrawal, 20);
});
