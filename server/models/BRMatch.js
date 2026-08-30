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
      enum: [
        'Normal Headshot',
        'Bodyshot',
        'Only One Tap',
        'Only Punch',
        'Only Desert',
        'Only Melee Weapon',
        'Only Knife Throw',
        'Only SMG Headshot',
        'Only AR Headshot',
        'Only AWM Bodyshot',
        'Only Grenade',
        'Rank Clash Squad',
        'Only Fist',
      ],
      default: 'Only Fist',
    },
    perKillReward: {
      type: Number,
      required: true,
      min: 0,
    },
    // Scheduled date and time for the match
    scheduledDateTime: {
      type: Date,
      required: true,
    },
    roomId: {
      type: String,
      trim: true,
      default: '',
    },
    roomPassword: {
      type: String,
      trim: true,
      default: '',
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
