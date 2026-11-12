export const CZ_PER_RUPEE = 10;

export const rupeesToCz = (amount) => Number((Number(amount || 0) * CZ_PER_RUPEE).toFixed(2));
export const czToRupees = (amount) => Number((Number(amount || 0) / CZ_PER_RUPEE).toFixed(2));
