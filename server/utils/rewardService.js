import User from '../models/User.js';
import Referral from '../models/Referral.js';
import RewardSettings from '../models/RewardSettings.js';
import mongoose from 'mongoose';

const getSettings = async () => {
  let settings = await RewardSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await RewardSettings.create({ key: 'default' });
  }
  return settings;
};

const addWalletTransaction = async (userId, { type, amount, description, matchId }) => {
  if (!amount || amount === 0) return;
  const user = await User.findById(userId);
  if (!user) return;
  user.wallet.transactions.push({
    type,
    amount,
    description,
    timestamp: new Date(),
    matchId,
  });
  await user.save();
};

export const generateReferralCode = async (username) => {
  const base = String(username || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
  const prefix = base || 'PLAYER';
  const candidate = `${prefix}CZ`;

  const existing = await User.findOne({ 'wallet.referralCode': candidate });
  if (!existing) return candidate;

  let counter = 1;
  let nextCode = `${candidate}${counter}`;
  while (await User.findOne({ 'wallet.referralCode': nextCode })) {
    counter += 1;
    nextCode = `${candidate}${counter}`;
  }
  return nextCode;
};

export const ensureReferralCodeForUser = async (userId, username) => {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.wallet?.referralCode) return user.wallet.referralCode;
  const settings = await getSettings();
  if (!settings.autoGenerateReferralCodes) {
    return null;
  }
  const code = await generateReferralCode(username || user.username);
  user.wallet.referralCode = code;
  await user.save();
  return code;
};

export const applyReferralCode = async ({ userId, referralCode }) => {
  if (!referralCode) return { success: false, message: 'Referral code is required' };
  const normalized = String(referralCode).trim().toUpperCase();
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };
  if (user.wallet?.referralCode && user.wallet.referralCode === normalized) {
    return { success: false, message: 'You cannot use your own referral code' };
  }
  if (user.wallet?.usedReferralCode) {
    return { success: false, message: 'Referral code already used' };
  }
  const referrer = await User.findOne({ 'wallet.referralCode': normalized });
  if (!referrer) return { success: false, message: 'Referral code not found' };
  if (referrer._id.toString() === userId.toString()) {
    return { success: false, message: 'You cannot use your own referral code' };
  }

  user.wallet.usedReferralCode = normalized;
  user.wallet.referralAppliedAt = new Date();
  await user.save();

  await Referral.create({
    referrer: referrer._id,
    referredUser: user._id,
    referralCodeUsed: normalized,
    status: 'registered',
  });

  return { success: true, referrerId: referrer._id.toString(), message: 'Referral code applied' };
};

export const updateReferralStatus = async ({ referredUserId, status, matchId }) => {
  const referral = await Referral.findOne({ referredUser: referredUserId });
  if (!referral) return null;

  referral.status = status;
  if (status === 'deposited' && !referral.firstDepositDate) {
    referral.firstDepositDate = new Date();
  }
  if (status === 'active' && !referral.firstMatchDate) {
    referral.firstMatchDate = new Date();
  }
  await referral.save();

  if (matchId) {
    await Referral.updateOne({ _id: referral._id }, { $set: { updatedAt: new Date() } });
  }
  return referral;
};

export const creditWelcomeBonus = async ({ userId, matchId }) => {
  const settings = await getSettings();
  if (!settings.welcomeBonusEnabled) return { success: false, message: 'Welcome bonus disabled' };
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };
  if (user.wallet?.welcomeBonusClaimed) return { success: false, message: 'Welcome bonus already claimed' };

  const depositAmount = user.wallet?.firstDepositAmount || 0;
  const completedPaidMatches = user.wallet?.completedPaidMatches || 0;
  if (depositAmount < settings.minimumDepositAmount || completedPaidMatches < 1) {
    return { success: false, message: 'Welcome bonus conditions not met' };
  }

  const bonusAmount = Number(settings.welcomeBonusAmount || 0);
  if (bonusAmount <= 0) return { success: false, message: 'Welcome bonus amount is zero' };

  user.wallet.bonusBalance += bonusAmount;
  user.wallet.welcomeBonusClaimed = true;
  user.wallet.totalBonusEarned = (user.wallet.totalBonusEarned || 0) + bonusAmount;
  user.wallet.totalWelcomeBonusEarned = (user.wallet.totalWelcomeBonusEarned || 0) + bonusAmount;
  user.wallet.transactions.push({
    type: 'bonus',
    amount: bonusAmount,
    description: 'Welcome bonus credited',
    timestamp: new Date(),
    matchId,
  });
  await user.save();

  return { success: true, amount: bonusAmount, balance: user.wallet.bonusBalance };
};

export const creditCashback = async ({ userId, matchEntryFee, matchId }) => {
  const settings = await getSettings();
  if (!settings.cashbackEnabled) return { success: false, message: 'Cashback disabled' };
  const user = await User.findById(userId);
  if (!user) return { success: false, message: 'User not found' };
  const cashbackAmount = Number(matchEntryFee || 0) * (Number(settings.cashbackPercentage || 0) / 100);
  if (cashbackAmount <= 0) return { success: false, message: 'No cashback to credit' };

  user.wallet.bonusBalance += cashbackAmount;
  user.wallet.totalBonusEarned = (user.wallet.totalBonusEarned || 0) + cashbackAmount;
  user.wallet.transactions.push({
    type: 'bonus',
    amount: cashbackAmount,
    description: `Cashback on match entry`,
    timestamp: new Date(),
    matchId,
  });
  await user.save();
  return { success: true, amount: cashbackAmount, balance: user.wallet.bonusBalance };
};

export const creditReferralCommission = async ({ referredUserId, platformFee, matchId }) => {
  const settings = await getSettings();
  if (!settings.referralEnabled) return { success: false, message: 'Referral rewards disabled' };
  const referral = await Referral.findOne({ referredUser: referredUserId });
  if (!referral) return { success: false, message: 'No referral found' };
  const commissionAmount = Number(platformFee || 0) * (Number(settings.referralPercentage || 0) / 100);
  if (commissionAmount <= 0) return { success: false, message: 'No referral commission to credit' };

  const referrer = await User.findById(referral.referrer);
  if (!referrer) return { success: false, message: 'Referrer not found' };
  referrer.wallet.referralEarningsBalance += commissionAmount;
  referral.lifetimePlatformFeesGenerated += Number(platformFee || 0);
  referral.totalReferralCommissionEarned += commissionAmount;
  referral.status = 'active';
  referral.firstMatchDate = referral.firstMatchDate || new Date();
  await referral.save();

  referrer.wallet.transactions.push({
    type: 'referral',
    amount: commissionAmount,
    description: `Referral commission for ${referredUserId}`,
    timestamp: new Date(),
    matchId,
  });
  await referrer.save();
  return { success: true, amount: commissionAmount, balance: referrer.wallet.referralEarningsBalance };
};

export const markFirstDeposit = async (userId, amount) => {
  const user = await User.findById(userId);
  if (!user) return null;
  if (user.wallet?.firstDepositAmount == null) {
    user.wallet.firstDepositAmount = Number(amount || 0);
  }
  await user.save();
  return user.wallet.firstDepositAmount;
};

export const markCompletedPaidMatch = async (userId) => {
  const user = await User.findById(userId);
  if (!user) return null;
  const completedMatches = (user.wallet?.completedPaidMatches || 0) + 1;
  user.wallet.completedPaidMatches = completedMatches;
  await user.save();
  return completedMatches;
};

export const getRewardDashboard = async () => {
  const [referrals, commissions, cashback, welcomeBonuses, platformRevenue] = await Promise.all([
    Referral.countDocuments(),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$wallet.referralEarningsBalance' } } }]),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$wallet.totalBonusEarned' } } }]),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$wallet.totalWelcomeBonusEarned' } } }]),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$wallet.totalPlatformFeesCollected' } } }]),
  ]);

  return {
    totalReferrals: referrals,
    totalReferralCommissionsPaid: (commissions[0]?.total || 0),
    totalCashbackDistributed: (cashback[0]?.total || 0),
    totalWelcomeBonusesDistributed: (welcomeBonuses[0]?.total || 0),
    platformRevenue: (platformRevenue[0]?.total || 0),
    netRevenueAfterRewards: (platformRevenue[0]?.total || 0) - (commissions[0]?.total || 0) - (cashback[0]?.total || 0) - (welcomeBonuses[0]?.total || 0),
  };
};
