import mongoose from 'mongoose';

const referralSchema = new mongoose.Schema({
  referrer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  referredUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
    index: true,
  },
  referralCodeUsed: {
    type: String,
    required: true,
    trim: true,
    uppercase: true,
  },
  status: {
    type: String,
    enum: ['registered', 'deposited', 'active', 'inactive'],
    default: 'registered',
  },
  registrationDate: {
    type: Date,
    default: Date.now,
  },
  firstDepositDate: Date,
  firstMatchDate: Date,
  lifetimePlatformFeesGenerated: {
    type: Number,
    default: 0,
  },
  totalReferralCommissionEarned: {
    type: Number,
    default: 0,
  },
  qualifyingMatchSpend: {
    type: Number,
    default: 0,
    min: 0,
  },
  rewardAmount: {
    type: Number,
    default: 5,
    min: 0,
  },
  rewardThreshold: {
    type: Number,
    default: 30,
    min: 0,
  },
  rewardedAt: Date,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

referralSchema.pre('save', function() {
  this.updatedAt = new Date();
});

export default mongoose.model('Referral', referralSchema);
