import mongoose from 'mongoose';

const tournamentStageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  groups: { type: Number, default: 0, min: 0 },
  matchesPerGroup: { type: Number, default: 0, min: 0 },
  matchCount: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  game: { type: String, enum: ['Free Fire', 'BGMI'], default: 'Free Fire' },
  format: { type: String, enum: ['multi-stage', 'single-match', 'custom'], required: true },
  entryFee: { type: Number, required: true, min: 0 },
  maxTeams: { type: Number, required: true, min: 1 },
  successfulEntries: { type: Number, default: 0, min: 0 },
  prizePool: { type: Number, required: true, min: 0 },
  totalCollection: { type: Number, default: 0, min: 0 },
  retainedAmount: { type: Number, default: 0, min: 0 },
  clutchZoneFee: { type: Number, default: 0, min: 0 },
  hostShare: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ['draft', 'upcoming', 'active', 'completed', 'cancelled'], default: 'upcoming' },
  stages: { type: [tournamentStageSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

tournamentSchema.index({ createdBy: 1, createdAt: -1 });
tournamentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Tournament', tournamentSchema);