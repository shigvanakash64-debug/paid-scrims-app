import mongoose from 'mongoose';

const tournamentStageGroupSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  stageKey: { type: String, required: true, trim: true },
  groupKey: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  capacity: { type: Number, required: true, min: 1 },
  registeredCount: { type: Number, default: 0, min: 0 },
  entryFee: { type: Number, default: 0, min: 0 },
  registrationOpen: { type: Boolean, default: false },
}, { timestamps: true });

tournamentStageGroupSchema.index({ tournamentId: 1, stageKey: 1, groupKey: 1 }, { unique: true });
tournamentStageGroupSchema.index({ tournamentId: 1, registrationOpen: 1 });

export default mongoose.model('TournamentStageGroup', tournamentStageGroupSchema);
