import mongoose from 'mongoose';

export const TOURNAMENT_ISSUE_CATEGORIES = [
  'Cheating / Hacking',
  'Abusive Behaviour',
  'Teaming / Unfair Play',
  'Wrong Result / Score Manipulation',
  'Fake Screenshot / Evidence',
  'Host Misconduct',
  'Room ID / Password Issue',
  'Other Tournament Issue',
];

const tournamentIssueReportSchema = new mongoose.Schema({
  tournamentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tournament', required: true },
  reportingUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  issueCategory: { type: String, enum: TOURNAMENT_ISSUE_CATEGORIES, required: true },
  description: { type: String, required: true, trim: true, maxlength: 2000 },
  hostContactConfirmedAt: { type: Date, default: null },
}, { timestamps: true });

tournamentIssueReportSchema.index({ tournamentId: 1, reportingUserId: 1 }, { unique: true });

export default mongoose.model('TournamentIssueReport', tournamentIssueReportSchema);
