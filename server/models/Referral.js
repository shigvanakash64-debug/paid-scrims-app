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
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

referralSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Referral', referralSchema);
