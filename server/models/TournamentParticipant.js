import mongoose from 'mongoose';

const tournamentParticipantSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  entryFee: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['registered', 'cancelled'], default: 'registered' },
  registeredAt: { type: Date, default: Date.now },
  displayName: { type: String, trim: true, default: '' },
}, { timestamps: true });

tournamentParticipantSchema.index({ tournamentId: 1, userId: 1 }, { unique: true });
tournamentParticipantSchema.index({ tournamentId: 1, status: 1 });

export default mongoose.model('TournamentParticipant', tournamentParticipantSchema);