import mongoose from 'mongoose';

const tournamentStageRegistrationSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  stageKey: { type: String, required: true, trim: true },
  groupKey: { type: String, required: true, trim: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  displayName: { type: String, trim: true, default: '' },
  entryFee: { type: Number, required: true, min: 0 },
  feeCz: { type: Number, required: true, min: 0 },
  hostUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  hostShareCz: { type: Number, required: true, min: 0 },
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  adminShareCz: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['registered', 'refunded'], default: 'registered' },
  sharesReleasedAt: { type: Date, default: null },
  refundedAt: { type: Date, default: null },
}, { timestamps: true });

tournamentStageRegistrationSchema.index(
  { tournamentId: 1, stageKey: 1, groupKey: 1, userId: 1 },
  { unique: true },
);
tournamentStageRegistrationSchema.index({ tournamentId: 1, status: 1 });

export default mongoose.model('TournamentStageRegistration', tournamentStageRegistrationSchema);
