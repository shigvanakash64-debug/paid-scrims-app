import mongoose from 'mongoose';

const challengeSchema = new mongoose.Schema({
  challenger: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  challengedPlayer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game: { type: String, enum: ['Free Fire', 'BGMI'], default: 'Free Fire' },
  mode: { type: String, enum: ['1v1', '2v2', '3v3', '4v4'], required: true },
  type: { type: String, required: true, trim: true },
  entry: { type: Number, required: true, min: 1 },
  skillSetting: { type: String, enum: ['Skill On', 'Skill Off'], default: 'Skill On' },
  status: { type: String, enum: ['pending', 'accepted', 'declined', 'expired'], default: 'pending' },
  match: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', default: null },
  expiresAt: { type: Date, required: true },
  acceptedAt: Date,
  declinedAt: Date,
}, { timestamps: true });

challengeSchema.index({ challengedPlayer: 1, status: 1, expiresAt: 1 });
challengeSchema.index({ challenger: 1, challengedPlayer: 1, status: 1 });

export default mongoose.model('Challenge', challengeSchema);
