import mongoose from 'mongoose';

const tournamentMatchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  round: { type: Number, default: 1, min: 1 },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant' }],
  teamA: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', default: null },
  teamB: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', default: null },
  status: { type: String, enum: ['pending', 'active', 'result_pending', 'disputed', 'completed'], default: 'pending' },
  winnerParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', default: null },
  advancesToMatchId: { type: mongoose.Schema.Types.ObjectId, default: null },
  advancesToSlot: { type: Number, enum: [0, 1], default: null },
  teamAWins: { type: Number, default: 0, min: 0, max: 2 },
  teamBWins: { type: Number, default: 0, min: 0, max: 2 },
  currentGame: { type: Number, default: 1, min: 1, max: 3 },
  gameResults: [{
    gameNumber: { type: Number, required: true, min: 1, max: 3 },
    status: { type: String, enum: ['pending', 'result_pending', 'disputed', 'completed'], default: 'pending' },
    winnerParticipantId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', default: null },
    claims: [{
      participantId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', required: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      outcome: { type: String, enum: ['win', 'lose'], required: true },
      claimedWinnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'TournamentParticipant', required: true },
      screenshotUrl: { type: String, default: '' },
      screenshotHash: { type: String, default: '' },
      submittedAt: { type: Date, default: Date.now },
    }],
  }],
}, { _id: true });

const tournamentStageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  key: { type: String, required: true, trim: true },
  order: { type: Number, required: true },
  time: { type: String, default: '', trim: true },
  groups: { type: Number, default: 0, min: 0 },
  matchesPerGroup: { type: Number, default: 0, min: 0 },
  matchCount: { type: Number, default: 0, min: 0 },
  matches: { type: [tournamentMatchSchema], default: [] },
  status: { type: String, enum: ['pending', 'active', 'completed'], default: 'pending' },
}, { _id: false });

const tournamentSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  game: { type: String, enum: ['Free Fire', 'BGMI', 'PUBG Mobile', 'Brawl Stars', 'Honor of Kings', 'Pokémon Unite', 'Valorant', 'Counter-Strike 2', 'Dota 2', 'League of Legends', 'Rocket League', 'Fortnite', 'Apex Legends', 'PUBG: Battlegrounds', 'Call of Duty: Warzone', 'Overwatch 2', 'Rainbow Six Siege', 'Marvel Rivals', 'Trackmania', 'Minecraft', 'Chess', 'Age of Empires II', 'Age of Empires IV', 'COD Mobile', 'Mobile Legends: Bang Bang', 'Clash Royale', 'Clash of Clans', 'EA Sports FC Mobile', 'eFootball', 'Tekken 8', 'Street Fighter 6', 'EA Sports FC 26', 'Teamfight Tactics'], default: 'Free Fire' },
  format: { type: String, enum: ['single-match', 'custom', 'br-per-kill', 'br-custom', 'cs-custom', 'team-vs-team'], required: true },
  entryFee: { type: Number, required: true, min: 0 },
  maxTeams: { type: Number, required: true, min: 1 },
  teamSize: { type: Number, default: 1, min: 1, max: 6 },
  teamTournamentMode: { type: String, enum: ['knockout', 'bo3', ''], default: '' },
  successfulEntries: { type: Number, default: 0, min: 0 },
  perKillReward: { type: Number, default: 0, min: 0 },
  prizePool: { type: Number, required: true, min: 0 },
  totalCollection: { type: Number, default: 0, min: 0 },
  retainedAmount: { type: Number, default: 0, min: 0 },
  clutchZoneFee: { type: Number, default: 0, min: 0 },
  hostShare: { type: Number, default: 0, min: 0 },
  payoutsDistributed: { type: Boolean, default: false },
  payoutsDistributedAt: { type: Date, default: null },
  estimatedDate: { type: Date, default: null },
  estimatedTime: { type: String, default: '', trim: true },
  hostMessage: { type: String, default: '', trim: true, maxlength: 300 },
  roomId: { type: String, default: '', trim: true },
  roomPassword: { type: String, default: '', trim: true },
  status: { type: String, enum: ['draft', 'open', 'upcoming', 'active', 'completed', 'cancelled'], default: 'open' },
  stages: { type: [tournamentStageSchema], default: [] },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

tournamentSchema.index({ createdBy: 1, createdAt: -1 });
tournamentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Tournament', tournamentSchema);