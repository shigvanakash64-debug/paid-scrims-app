import mongoose from 'mongoose';

const BRParticipantSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brMatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BRMatch',
      required: true,
    },
    inGameName: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 50,
    },
    entryFee: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['registered', 'cancelled'],
      default: 'registered',
    },
    slotNumber: {
      type: Number,
      required: true,
      min: 1,
      max: 50,
    },
    registrationTimestamp: {
      type: Date,
      default: Date.now,
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

// Composite index to prevent duplicate registrations (user + match)
BRParticipantSchema.index({ userId: 1, brMatchId: 1 }, { unique: true });

// Index for efficient listing
BRParticipantSchema.index({ brMatchId: 1, slotNumber: 1 });

const BRParticipant = mongoose.model('BRParticipant', BRParticipantSchema);

export default BRParticipant;
