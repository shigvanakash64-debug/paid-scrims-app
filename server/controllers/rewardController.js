import User from '../models/User.js';
import Referral from '../models/Referral.js';
import RewardSettings from '../models/RewardSettings.js';
import { applyReferralCode, getRewardDashboard } from '../utils/rewardService.js';

const getDefaultSettings = async () => {
  let settings = await RewardSettings.findOne({ key: 'default' });
  if (!settings) {
    settings = await RewardSettings.create({ key: 'default' });
  }
  return settings;
};

export const getMyReferralDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('wallet');
    if (!user) return res.status(404).json({ error: 'User not found' });

    const referrals = await Referral.find({ referrer: userId }).sort({ createdAt: -1 });
    const totalReferrals = referrals.length;
    const activeReferrals = referrals.filter((entry) => entry.status === 'active').length;
    const pendingReferrals = referrals.filter((entry) => ['registered', 'deposited'].includes(entry.status)).length;
    const lifetimePlatformFees = referrals.reduce((sum, entry) => sum + Number(entry.lifetimePlatformFeesGenerated || 0), 0);
    const totalReferralEarnings = referrals.reduce((sum, entry) => sum + Number(entry.totalReferralCommissionEarned || 0), 0);

    res.status(200).json({
      success: true,
      referralCode: user.wallet?.referralCode || null,
      stats: {
        totalReferrals,
        activeReferrals,
        pendingReferrals,
        lifetimePlatformFeesGenerated: lifetimePlatformFees,
        totalReferralEarnings,
        withdrawableReferralEarnings: user.wallet?.referralEarningsBalance || 0,
      },
      referrals,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const submitReferralCode = async (req, res) => {
  try {
    const userId = req.userId;
    const { referralCode } = req.body;
    const result = await applyReferralCode({ userId, referralCode });
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRewardSettings = async (req, res) => {
  try {
    const settings = await getDefaultSettings();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateRewardSettings = async (req, res) => {
  try {
    const settings = await getDefaultSettings();
    const updates = req.body || {};
    Object.keys(updates).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(settings.toObject ? settings.toObject() : settings, key)) {
        settings[key] = updates[key];
      }
    });
    await settings.save();
    res.status(200).json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getRewardAnalytics = async (req, res) => {
  try {
    const analytics = await getRewardDashboard();
    res.status(200).json({ success: true, analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
