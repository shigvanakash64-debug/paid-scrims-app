import test from 'node:test';
import assert from 'node:assert/strict';

import { calculateMatchPlatformFee } from './utils/payout.js';

test('calculateMatchPlatformFee takes 10% of total entry fees', () => {
  assert.equal(calculateMatchPlatformFee(100, 2), 20);
  assert.equal(calculateMatchPlatformFee(50, 2), 10);
});

test('calculateMatchPlatformFee rounds to currency precision', () => {
  assert.equal(calculateMatchPlatformFee(5, 3), 1.5);
  assert.equal(calculateMatchPlatformFee(0.33, 3), 0.1);
});
