export const getConfiguredMinimumAge = () => {
  const configured = Number(process.env.CLUCHZONE_MINIMUM_AGE || 18);
  return Number.isInteger(configured) && configured >= 18 ? configured : 18;
};

export const hasEligibleAgeDeclaration = (user) => {
  const minimumAge = getConfiguredMinimumAge();
  return Boolean(
    user?.ageDeclaration?.isAdult === true
    && user.ageDeclaration?.minimumAge === minimumAge
    && user.ageDeclaration?.declaredAt
  );
};

export const assertPaidActivityEligibility = (user) => {
  if (user?.eligibilityRestricted) {
    const error = new Error('Your account is restricted from paid activities');
    error.code = 'ELIGIBILITY_RESTRICTED';
    throw error;
  }
  if (!hasEligibleAgeDeclaration(user)) {
    const error = new Error('Complete the minimum-age declaration before entering paid activities');
    error.code = 'AGE_DECLARATION_REQUIRED';
    throw error;
  }
};
