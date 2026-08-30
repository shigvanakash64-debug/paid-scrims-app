import mongoose from 'mongoose';

const BRMatchResultSchema = new mongoose.Schema(
  {
    matchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BRMatch',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    username: {
      type: String,
      required: true,
    },
    kills: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Index for efficient querying
BRMatchResultSchema.index({ matchId: 1, userId: 1 }, { unique: true });
BRMatchResultSchema.index({ matchId: 1 });
BRMatchResultSchema.index({ userId: 1 });

const BRMatchResult = mongoose.model('BRMatchResult', BRMatchResultSchema);

export default BRMatchResult;
