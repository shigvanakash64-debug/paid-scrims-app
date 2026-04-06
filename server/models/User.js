import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  passwordSalt: {
    type: String,
    required: true
  },
  wallet: {
    balance: {
      type: Number,
      default: 0,
      min: 0
    },
    transactions: [{
      type: {
        type: String,
        enum: ['deposit', 'withdrawal', 'match_win', 'match_loss', 'refund', 'fee'],
        required: true
      },
      amount: {
        type: Number,
        required: true
      },
      description: String,
      timestamp: {
        type: Date,
        default: Date.now
      },
      matchId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match'
      }
    }]
  },

  // Trust Score System
  trustScore: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  reports: {
    type: Number,
    default: 0
  },
  matchesPlayed: {
    type: Number,
    default: 0
  },
  matchesWon: {
    type: Number,
    default: 0
  },
  matchesLost: {
    type: Number,
    default: 0
  },
  disputesRaised: {
    type: Number,
    default: 0
  },
  disputesLost: {
    type: Number,
    default: 0
  },
  isBanned: {
    type: Boolean,
    default: false
  },
  banReason: String,
  banExpiresAt: Date,

  // Anti-cheat tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  suspiciousFlags: [{
    type: String,
    enum: ['fake_screenshot', 'repeated_disputes', 'match_dodging', 'conflict_submission'],
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],

  // Device tracking for anti-cheat
  deviceFingerprint: String,
  ipAddress: String,

  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Virtual for trust score category
userSchema.virtual('trustCategory').get(function() {
  if (this.trustScore >= 80) return 'high';
  if (this.trustScore >= 40) return 'medium';
  return 'low';
  // Force redeploy
});

// Method to check if user can join high-entry matches
userSchema.methods.canJoinHighEntryMatch = function(entryFee) {
  if (this.isBanned) return false;
  if (this.trustScore < 30 && entryFee > 100) return false;
  return true;
};

// Method to check if user is temporarily banned
userSchema.methods.isTemporarilyBanned = function() {
  if (!this.banExpiresAt) return false;
  return new Date() < this.banExpiresAt;
};

// Method to update trust score
userSchema.methods.updateTrustScore = function(points, reason) {
  const oldScore = this.trustScore;
  this.trustScore = Math.max(0, Math.min(100, this.trustScore + points));

  // Log the change
  console.log(`[TRUST-SCORE] User ${this.username}: ${oldScore} → ${this.trustScore} (${points > 0 ? '+' : ''}${points}) - ${reason}`);

  // Auto-actions based on trust score
  if (this.trustScore < 10 && !this.isBanned) {
    this.isBanned = true;
    this.banReason = 'Trust score below 10';
    console.log(`[AUTO-BAN] User ${this.username} permanently banned due to low trust score`);
  } else if (this.trustScore < 20 && !this.isTemporarilyBanned()) {
    this.banExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    console.log(`[AUTO-BAN] User ${this.username} temporarily banned for 24 hours due to low trust score`);
  }

  return this.save();
};

export default mongoose.model('User', userSchema);