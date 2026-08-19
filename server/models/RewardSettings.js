import mongoose from 'mongoose';

const rewardSettingsSchema = new mongoose.Schema({
  key: {
    type: String,
    default: 'default',
    unique: true,
    immutable: true,
  },
  referralPercentage: {
    type: Number,
    default: 20,
    min: 0,
    max: 100,
  },
  cashbackPercentage: {
    type: Number,
    default: 2,
    min: 0,
    max: 100,
  },
  welcomeBonusAmount: {
    type: Number,
    default: 5,
    min: 0,
  },
  signupBonusAmount: {
    type: Number,
    default: 10,
    min: 0,
  },
  minimumDepositAmount: {
    type: Number,
    default: 50,
    min: 0,
  },
  minimumDepositForWithdrawal: {
    type: Number,
    default: 20,
    min: 0,
  },
  minimumMatchEntryForWithdrawal: {
    type: Number,
    default: 20,
    min: 0,
  },
  referralEnabled: {
    type: Boolean,
    default: false,
  },
  cashbackEnabled: {
    type: Boolean,
    default: false,
  },
  signupBonusEnabled: {
    type: Boolean,
    default: true,
  },
  welcomeBonusEnabled: {
    type: Boolean,
    default: true,
  },
  referralCodeSuffix: {
    type: String,
    default: 'CZ',
    trim: true,
    uppercase: true,
  },
  autoGenerateReferralCodes: {
    type: Boolean,
    default: true,
  },
  maxReferralsPerUser: {
    type: Number,
    default: 0,
    min: 0,
    description: '0 means unlimited',
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

rewardSettingsSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export default mongoose.model('RewardSettings', rewardSettingsSchema);
