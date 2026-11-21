import test from 'node:test';
import assert from 'node:assert/strict';
import { assertPaidActivityEligibility, hasEligibleAgeDeclaration } from './utils/ageEligibility.js';

test('existing account without age declaration is ineligible', () => {
  assert.equal(hasEligibleAgeDeclaration({ ageDeclaration: null }), false);
  assert.throws(() => assertPaidActivityEligibility({ ageDeclaration: null }), (error) =>
    error.code === 'AGE_DECLARATION_REQUIRED'
  );
});

test('adult declaration for configured minimum age is eligible', () => {
  const user = {
    ageDeclaration: {
      isAdult: true,
      minimumAge: 18,
      declaredAt: new Date(),
    },
  };
  assert.equal(hasEligibleAgeDeclaration(user), true);
  assert.doesNotThrow(() => assertPaidActivityEligibility(user));
});

test('administratively restricted account remains ineligible', () => {
  const user = {
    eligibilityRestricted: true,
    ageDeclaration: { isAdult: true, minimumAge: 18, declaredAt: new Date() },
  };
  assert.throws(() => assertPaidActivityEligibility(user), (error) =>
    error.code === 'ELIGIBILITY_RESTRICTED'
  );
});
