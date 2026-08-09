import mongoose from 'mongoose';

const wallpaperPurchaseSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wallpaperId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallpaper',
    required: true,
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
  paymentSessionId: {
    type: String,
    default: null,
    trim: true,
  },
  cfOrderId: {
    type: String,
    default: null,
    trim: true,
  },
  cfPaymentId: {
    type: String,
    default: null,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'],
    default: 'PENDING',
  },
  paymentMethod: {
    type: String,
    default: 'cashfree',
  },
  provider: {
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
  paidAt: {
    type: Date,
    default: null,
  },
});

wallpaperPurchaseSchema.pre('save', function handleUpdatedAt() {
  this.updatedAt = Date.now();
});

export default mongoose.model('WallpaperPurchase', wallpaperPurchaseSchema);
