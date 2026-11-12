import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { czToRupees, rupeesToCz } from './currency.js';

describe('CZ currency conversion', () => {
  it('converts rupees to CZ at ten CZ per rupee', () => {
    assert.equal(rupeesToCz(100), 1000);
    assert.equal(rupeesToCz(0.5), 5);
  });

  it('converts CZ to rupees and rounds to paise', () => {
    assert.equal(czToRupees(1000), 100);
    assert.equal(czToRupees(5), 0.5);
  });
});
