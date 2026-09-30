import mongoose from 'mongoose';

const globalMatchRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  game: { type: String, enum: ['Free Fire', 'BGMI', 'PUBG Mobile', 'Brawl Stars', 'Honor of Kings', 'Pokémon Unite', 'Valorant', 'Counter-Strike 2', 'Dota 2', 'League of Legends', 'Rocket League', 'Fortnite', 'Apex Legends', 'PUBG: Battlegrounds', 'Overwatch 2', 'Rainbow Six Siege', 'Marvel Rivals', 'Trackmania', 'Minecraft', 'Chess', 'Age of Empires II', 'Age of Empires IV', 'COD Mobile', 'Mobile Legends: Bang Bang', 'Clash Royale', 'Clash of Clans', 'EA Sports FC Mobile', 'eFootball', 'Tekken 8', 'Street Fighter 6', 'EA Sports FC 26', 'Teamfight Tactics'], required: true },
  mode: { type: String, enum: ['1v1', '2v2', '3v3', '4v4'], required: true },
  type: { type: String, required: true, trim: true },
  skillSetting: { type: String, enum: ['Skill On', 'Skill Off'], required: true },
  entryFee: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' },
  respondedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  respondedAt: { type: Date, default: null },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) },
}, { timestamps: true });

globalMatchRequestSchema.index({ status: 1, createdAt: -1 });
globalMatchRequestSchema.index({ userId: 1, createdAt: -1 });
globalMatchRequestSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('GlobalMatchRequest', globalMatchRequestSchema);
