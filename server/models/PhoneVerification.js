import mongoose from 'mongoose';

const phoneVerificationSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  otpHash: String,
  expiresAt: Date,
  attempts: {
    type: Number,
    default: 0
  },
  lastSentAt: Date,
  verified: {
    type: Boolean,
    default: false
  },
  verifiedAt: Date,
}, { timestamps: true });

export default mongoose.model('PhoneVerification', phoneVerificationSchema);
