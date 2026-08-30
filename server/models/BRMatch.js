import mongoose from 'mongoose';

const BRMatchSchema = new mongoose.Schema(
  {
    matchName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    scrimType: {
      type: String,
      required: true,
      enum: ['Only Fist', 'Bolt Action', 'AR Only', 'SMG Only', 'Sniper Only', 'No Healing', 'Custom'],
      default: 'Only Fist',
    },
    perKillReward: {
      type: Number,
      required: true,
      min: 0,
    },
    // Timer duration in minutes (informational only, does NOT auto-close match)
    timerDuration: {
      type: Number,
      required: true,
      min: 1,
      max: 120,
    },
    roomId: {
      type: String,
      required: true,
      trim: true,
    },
    roomPassword: {
      type: String,
      required: true,
      trim: true,
    },
    maxPlayers: {
      type: Number,
      default: 50,
      immutable: true, // Fixed at 50, cannot be changed
    },
    currentPlayers: {
      type: Number,
      default: 0,
      min: 0,
      max: 50,
    },
    status: {
      type: String,
      enum: ['OPEN', 'FULL', 'CLOSED', 'COMPLETED'],
      default: 'OPEN',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
BRMatchSchema.index({ status: 1 });
BRMatchSchema.index({ createdAt: -1 });

const BRMatch = mongoose.model('BRMatch', BRMatchSchema);

export default BRMatch;
