import mongoose from 'mongoose';

const resultEntrySchema = new mongoose.Schema({
  participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', required: true },
  participantName: { type: String, required: true, trim: true },
  points: { type: Number, required: true, min: 0 },
}, { _id: false });

const tournamentMatchResultSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  stageKey: { type: String, required: true },
  matchId: { type: mongoose.Schema.Types.ObjectId, required: true },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  entries: { type: [resultEntrySchema], default: [] },
  publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  publishedAt: { type: Date, default: null },
}, { timestamps: true });

tournamentMatchResultSchema.index({ tournamentId: 1, matchId: 1 }, { unique: true });

export default mongoose.model('TournamentMatchResult', tournamentMatchResultSchema);