import mongoose from 'mongoose';

const paymentDepositSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: String,
    required: true,
    unique: true,
  },
  paymentSessionId: {
    type: String,
    default: null,
  },
  cfPaymentId: {
    type: String,
    default: null,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  currency: {
    type: String,
    default: 'INR',
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    default: 'cashfree',
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

paymentDepositSchema.pre('save', function () {
  this.updatedAt = new Date();
});

export default mongoose.model('PaymentDeposit', paymentDepositSchema);
