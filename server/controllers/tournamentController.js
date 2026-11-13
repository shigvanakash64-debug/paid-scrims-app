import mongoose from 'mongoose';
import Tournament from '../models/Tournament.js';
import TournamentParticipant from '../models/TournamentParticipant.js';
import { rupeesToCz } from '../utils/currency.js';
import User from '../models/User.js';
import TournamentMatchResult from '../models/TournamentMatchResult.js';
import TournamentIssueReport, { TOURNAMENT_ISSUE_CATEGORIES } from '../models/TournamentIssueReport.js';
import { sendNotification } from '../services/notificationService.js';
import { verifyToken } from '../utils/authUtils.js';
import { uploadToCloudinary } from '../utils/uploadToCloudinary.js';

export const COMPLETED_TOURNAMENT_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000;
export const TOURNAMENT_REPORT_ESCALATION_MS = 6 * 60 * 60 * 1000;

export const normalizeInstagramUsername = (value) => {
  if (typeof value !== 'string') throw new Error('Host Instagram username is required');
  const username = value.trim().replace(/\s+/g, '').replace(/^@/, '').toLowerCase();
  if (!username) throw new Error('Host Instagram username is required');
  if (!/^(?!\.)(?!.*\.\.)[a-z0-9._]{1,30}$/.test(username) || username.endsWith('.')) {
    throw new Error('Enter a valid Instagram username (letters, numbers, periods and underscores only)');
  }
  return username;
};

export const buildTournamentIssueReportStatus = (report, now = Date.now()) => {
  if (!report) return null;
  const confirmedAt = report.hostContactConfirmedAt ? new Date(report.hostContactConfirmedAt) : null;
  const escalationAvailableAt = confirmedAt
    ? new Date(confirmedAt.getTime() + TOURNAMENT_REPORT_ESCALATION_MS)
    : null;
  const remainingMs = escalationAvailableAt
    ? Math.max(0, escalationAvailableAt.getTime() - now)
    : null;
  return {
    _id: report._id,
    issueCategory: report.issueCategory,
    description: report.description,
    createdAt: report.createdAt,
    hostContactConfirmedAt: confirmedAt,
    escalationAvailableAt,
    escalationAvailable: Boolean(escalationAvailableAt && remainingMs === 0),
    remainingMs,
  };
};

export const buildTournamentRegistrationWindowQuery = (now = Date.now()) => {
  const currentTime = new Date(now);
  const legacyCutoff = new Date(currentTime.getTime() - COMPLETED_TOURNAMENT_EXPIRY_MS);
  return {
    $or: [
      { registrationDeadline: { $gt: currentTime } },
      { registrationDeadline: { $exists: false }, createdAt: { $gte: legacyCutoff } },
      { registrationDeadline: null, createdAt: { $gte: legacyCutoff } },
    ],
  };
};

export const isCompletedTournamentExpired = (tournament) => {
  if (!tournament || tournament.status !== 'completed') return false;
  const lastUpdated = tournament.updatedAt || tournament.payoutsDistributedAt || tournament.createdAt;
  if (!lastUpdated) return false;
  return Date.now() - new Date(lastUpdated).getTime() > COMPLETED_TOURNAMENT_EXPIRY_MS;
};

export const cleanupExpiredCompletedTournaments = async () => {
  const cutoff = new Date(Date.now() - COMPLETED_TOURNAMENT_EXPIRY_MS);
  const expiredTournaments = await Tournament.find({
    status: 'completed',
    updatedAt: { $lt: cutoff },
  }).select('_id').lean();

  if (!expiredTournaments.length) {
    return { deletedCount: 0 };
  }

  const tournamentIds = expiredTournaments.map((tournament) => tournament._id);
  await Promise.all([
    Tournament.deleteMany({ _id: { $in: tournamentIds } }),
    TournamentParticipant.deleteMany({ tournamentId: { $in: tournamentIds } }),
    TournamentMatchResult.deleteMany({ tournamentId: { $in: tournamentIds } }),
    TournamentIssueReport.deleteMany({ tournamentId: { $in: tournamentIds } }),
  ]);

  return { deletedCount: tournamentIds.length };
};

export const calculateFinancials = (entryFee, successfulEntries) => {
  const roundCurrency = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;
  const totalCollection = roundCurrency(Number(entryFee || 0) * Number(successfulEntries || 0));
  const prizePool = roundCurrency(totalCollection * 0.7);
  const retainedAmount = roundCurrency(totalCollection - prizePool);
  const hostShare = roundCurrency(retainedAmount * (2 / 3));
  return {
    totalCollection,
    prizePool,
    retainedAmount,
    hostShare,
    clutchZoneFee: roundCurrency(retainedAmount - hostShare),
  };
};

const PER_KILL_FORMATS = new Set(['single-match', 'br-per-kill']);
const CUSTOM_FORMATS = new Set(['custom', 'br-custom', 'cs-custom', 'team-vs-team']);
const PER_GROUP_FORMATS = new Set(['single-match', 'br-per-kill', 'custom', 'br-custom', 'cs-custom']);
const SINGLE_STAGE_FORMATS = new Set(['single-match', 'br-per-kill']);
const TEAM_SIZE_FORMATS = new Set(['br-custom', 'cs-custom', 'team-vs-team']);
export const CUSTOM_TOURNAMENT_GAMES = new Set([
  'Free Fire', 'Mini Militia', 'BGMI', 'PUBG Mobile', 'Fortnite', 'Apex Legends', 'PUBG: Battlegrounds',
  'Call of Duty: Warzone', 'Minecraft', 'Trackmania', 'Teamfight Tactics',
]);
export const TEAM_VS_TEAM_GAMES = new Set([
  'Clash Royale', 'EA Sports FC Mobile', 'eFootball', 'Tekken 8', 'Street Fighter 6',
  'EA Sports FC 26', 'Chess', 'COD Mobile', 'Mobile Legends: Bang Bang', 'Honor of Kings',
  'Pokémon Unite', 'Valorant', 'Counter-Strike 2', 'Dota 2', 'League of Legends',
  'Rainbow Six Siege', 'Overwatch 2', 'Marvel Rivals', 'Rocket League', 'Brawl Stars',
  'Clash of Clans', 'Age of Empires II', 'Age of Empires IV',
]);
export const ALL_TOURNAMENT_GAMES = new Set([...CUSTOM_TOURNAMENT_GAMES, ...TEAM_VS_TEAM_GAMES]);

const isPerKillFormat = (format) => PER_KILL_FORMATS.has(format);
const isCustomFormat = (format) => CUSTOM_FORMATS.has(format);
const requiresSingleStageSchedule = (format) => SINGLE_STAGE_FORMATS.has(format);

export const normalizeTournamentRegistration = ({ format, teamSize = 1, inGameName, teamName, teamMembers }) => {
  if (!TEAM_SIZE_FORMATS.has(format)) {
    if (typeof inGameName !== 'string' || !inGameName.trim() || inGameName.trim().length > 50) {
      throw new Error('In-game name must be between 1 and 50 characters');
    }
    return { displayName: inGameName.trim(), teamName: '', teamMembers: [] };
  }

  const normalizedTeamName = typeof teamName === 'string' ? teamName.trim() : '';
  const expectedTeamSize = Number(teamSize);
  if (!normalizedTeamName || normalizedTeamName.length > 50) {
    throw new Error('Team name must be between 1 and 50 characters');
  }
  if (!Number.isInteger(expectedTeamSize) || expectedTeamSize < 1 || expectedTeamSize > 6) {
    throw new Error('Tournament team size is invalid');
  }
  if (!Array.isArray(teamMembers) || teamMembers.length !== expectedTeamSize) {
    throw new Error(`Enter exactly ${expectedTeamSize} team member names`);
  }

  const normalizedMembers = teamMembers.map((name) => typeof name === 'string' ? name.trim() : '');
  if (normalizedMembers.some((name) => !name || name.length > 50)) {
    throw new Error('Each team member name must be between 1 and 50 characters');
  }

  return {
    displayName: normalizedMembers[0],
    teamName: normalizedTeamName,
    teamMembers: normalizedMembers,
  };
};

const buildStages = (format, customStages = []) => {
  if (format === 'single-match' || format === 'br-per-kill') {
    return [{ name: 'Per Kill', key: format, order: 1, time: '', matchCount: 1 }];
  }

  return customStages
    .filter((stage) => stage?.name?.trim())
    .map((stage, index) => ({
      name: stage.name.trim(),
      key: `custom-${index + 1}`,
      order: index + 1,
      time: String(stage?.time || '').trim(),
      matchCount: Math.max(1, Number(stage.matches) || 1),
    }));
};

export const normalizeResultEntry = ({ entry, participantMap, isPerKill, perKillReward }) => {
  const participantId = entry.participantId;
  const participant = participantMap.get(String(participantId));
  const participantName = participant?.teamName || participant?.displayName || participant?.userName || participant?.username || 'Participant';

  if (isPerKill) {
    const kills = Number(entry.kills || 0);
    const money = kills * Number(perKillReward || 0);
    return {
      participantId,
      participantName,
      kills,
      points: 0,
      money,
    };
  }

  const points = Number(entry.points || 0);
  const kills = Number(entry.kills || 0);
  return {
    participantId,
    participantName,
    kills,
    points,
    money: Number(entry.money || 0),
  };
};

export const assignTournamentGroups = (participants = [], rng = Math.random, groupSize = 12) => {
  const groupedParticipants = [...participants].sort(() => {
    const value = typeof rng === 'function' ? rng() : 0.5;
    return value - 0.5;
  });

  const assignments = new Map();
  groupedParticipants.forEach((participant, index) => {
    const participantKey = String(participant?._id || participant?.participantId || participant?.userId || participant?.id || index);
    assignments.set(participantKey, Math.floor(index / Math.max(1, groupSize)) + 1);
  });

  return assignments;
};

export const validateTournamentInput = ({
  name,
  format,
  game,
  entryFee,
  maxTeams,
  perGroup,
  teamSize = 1,
  teamTournamentMode = 'knockout',
  successfulEntries = 0,
  perKillReward = 0,
  estimatedDate,
  estimatedTime,
  registrationDeadline,
  roomId,
  roomPassword,
  hostMessage,
  hostInstagramUsername,
  now = Date.now(),
}) => {
  if (!name || !format || entryFee === undefined || maxTeams === undefined) {
    throw new Error('Tournament name, format, entry fee and maximum teams are required');
  }
  if (!['single-match', 'custom', 'br-per-kill', 'br-custom', 'cs-custom', 'team-vs-team'].includes(format)) {
    throw new Error('Invalid tournament format');
  }
  if (!ALL_TOURNAMENT_GAMES.has(game)) {
    throw new Error('Invalid game');
  }
  if (['custom', 'br-custom', 'cs-custom'].includes(format) && !CUSTOM_TOURNAMENT_GAMES.has(game)) {
    throw new Error(`${game} supports Team vs Team tournaments, not Custom tournaments`);
  }
  if (format === 'team-vs-team' && !TEAM_VS_TEAM_GAMES.has(game)) {
    throw new Error(`${game} supports Custom tournaments, not Team vs Team tournaments`);
  }

  const numericEntryFee = Number(entryFee);
  const numericMaxTeams = Number(maxTeams);
  const numericPerGroup = PER_GROUP_FORMATS.has(format)
    ? (perGroup === undefined || perGroup === '' ? Math.min(12, numericMaxTeams) : Number(perGroup))
    : Math.min(12, numericMaxTeams);
  const numericSuccessfulEntries = isPerKillFormat(format) ? 0 : Number(successfulEntries);
  const numericPerKillReward = Number(perKillReward);
  const numericTeamSize = TEAM_SIZE_FORMATS.has(format) ? Number(teamSize) : 1;
  if (!Number.isFinite(numericEntryFee) || numericEntryFee < 0 || !Number.isInteger(numericMaxTeams) || numericMaxTeams < 1 || !Number.isInteger(numericSuccessfulEntries) || numericSuccessfulEntries < 0 || numericSuccessfulEntries > numericMaxTeams) {
    throw new Error('Invalid entry fee or maximum teams');
  }
  if (!Number.isInteger(numericPerGroup) || numericPerGroup < 1 || numericPerGroup > 1000 || (PER_GROUP_FORMATS.has(format) && numericPerGroup > numericMaxTeams)) {
    throw new Error(`Per group must be a whole number between 1 and ${PER_GROUP_FORMATS.has(format) ? 'the maximum teams' : '1000'}`);
  }
  if (!estimatedDate || !estimatedTime) {
    throw new Error('Estimated match date and time are required');
  }

  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(estimatedTime)) {
    throw new Error('Estimated match time is invalid');
  }

  const parsedDate = new Date(`${estimatedDate}T${estimatedTime}`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Estimated match date and time are invalid');
  }

  if (!registrationDeadline) {
    throw new Error('Last registration date and time are required');
  }
  const parsedRegistrationDeadline = new Date(registrationDeadline);
  if (Number.isNaN(parsedRegistrationDeadline.getTime())) {
    throw new Error('Last registration date and time are invalid');
  }
  if (parsedRegistrationDeadline.getTime() <= now) {
    throw new Error('Last registration date and time must be in the future');
  }

  if (hostMessage !== undefined && typeof hostMessage !== 'string') {
    throw new Error('Tournament message must be text');
  }
  if (typeof hostMessage === 'string' && hostMessage.length > 300) {
    throw new Error('Tournament message cannot exceed 300 characters');
  }
  const normalizedHostInstagramUsername = normalizeInstagramUsername(hostInstagramUsername);

  if (TEAM_SIZE_FORMATS.has(format) && (!Number.isInteger(numericTeamSize) || numericTeamSize < 1 || numericTeamSize > 6)) {
    throw new Error('Team size must be a whole number from 1 to 6');
  }
  if (format === 'team-vs-team' && !['knockout', 'bo3'].includes(teamTournamentMode)) {
    throw new Error('Team tournament mode must be Knockout or BO3');
  }

  if (isPerKillFormat(format)) {
    if (!Number.isFinite(numericPerKillReward) || numericPerKillReward < 0) {
      throw new Error('Per kill reward is required for single match tournaments');
    }
    if (numericEntryFee <= numericPerKillReward) {
      throw new Error('For per-kill tournaments, entry fee must be greater than the per-kill reward. Example: entry fee 5 and per kill 3 is valid.');
    }
  }

  return {
    numericEntryFee,
    numericMaxTeams,
    numericPerGroup,
    numericTeamSize,
    teamTournamentMode: format === 'team-vs-team' ? teamTournamentMode : '',
    numericSuccessfulEntries,
    numericPerKillReward,
    estimatedDate: parsedDate,
    registrationDeadline: parsedRegistrationDeadline,
    roomId: roomId ? String(roomId).trim() : '',
    roomPassword: roomPassword ? String(roomPassword).trim() : '',
    estimatedTime: String(estimatedTime).trim(),
    hostMessage: hostMessage ? String(hostMessage).trim() : '',
    hostInstagramUsername: normalizedHostInstagramUsername,
  };
};

export const createTournament = async (req, res) => {
  try {
    const { name, game = 'Free Fire', format, entryFee, maxTeams, perGroup, teamSize = 1, teamTournamentMode = 'knockout', successfulEntries = 0, customStages = [], perKillReward = 0, estimatedDate, estimatedTime, registrationDeadline, roomId, roomPassword, hostMessage, hostInstagramUsername } = req.body;

    let normalizedValues;
    try {
      normalizedValues = validateTournamentInput({
        name,
        game,
        format,
        entryFee,
        maxTeams,
        perGroup,
        teamSize,
        teamTournamentMode,
        successfulEntries,
        perKillReward,
        estimatedDate,
        estimatedTime,
        registrationDeadline,
        roomId,
        roomPassword,
        hostMessage,
        hostInstagramUsername,
      });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const financials = isPerKillFormat(format)
      ? { totalCollection: normalizedValues.numericEntryFee * normalizedValues.numericSuccessfulEntries, prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
      : calculateFinancials(normalizedValues.numericEntryFee, normalizedValues.numericSuccessfulEntries);

    const tournament = await Tournament.create({
      name: name.trim(),
      game,
      format,
      entryFee: normalizedValues.numericEntryFee,
      maxTeams: normalizedValues.numericMaxTeams,
      perGroup: normalizedValues.numericPerGroup,
      teamSize: normalizedValues.numericTeamSize,
      teamTournamentMode: normalizedValues.teamTournamentMode || undefined,
      successfulEntries: normalizedValues.numericSuccessfulEntries,
      perKillReward: isPerKillFormat(format) ? normalizedValues.numericPerKillReward : 0,
      estimatedDate: normalizedValues.estimatedDate,
      estimatedTime: normalizedValues.estimatedTime,
      registrationDeadline: normalizedValues.registrationDeadline,
      roomId: normalizedValues.roomId,
      roomPassword: normalizedValues.roomPassword,
      hostMessage: normalizedValues.hostMessage,
      hostInstagramUsername: normalizedValues.hostInstagramUsername,
      ...financials,
      stages: format === 'team-vs-team' ? [] : buildStages(format, customStages),
      createdBy: req.userId,
    });

    return res.status(201).json({ success: true, tournament });
  } catch (error) {
    console.error('createTournament error:', error);
    return res.status(500).json({ error: 'Failed to create tournament' });
  }
};

export const listMyTournaments = async (req, res) => {
  try {
    await cleanupExpiredCompletedTournaments();
    const tournaments = await Tournament.find({ createdBy: req.userId }).sort({ createdAt: -1 }).lean();
    const normalizedTournaments = tournaments.map((tournament) => {
      const financials = isPerKillFormat(tournament.format)
        ? { totalCollection: (tournament.entryFee || 0) * (tournament.successfulEntries || 0), prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
        : calculateFinancials(tournament.entryFee, tournament.successfulEntries || 0);

      return {
        ...tournament,
        ...financials,
        successfulEntries: tournament.successfulEntries || 0,
      };
    });
    return res.json({ success: true, tournaments: normalizedTournaments });
  } catch (error) {
    console.error('listMyTournaments error:', error);
    return res.status(500).json({ error: 'Failed to load tournaments' });
  }
};

export const updateTournamentMessage = async (req, res) => {
  try {
    const { message } = req.body || {};
    if (typeof message === 'string' && message.length > 300) {
      return res.status(400).json({ error: 'Tournament message cannot exceed 300 characters' });
    }
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, createdBy: req.userId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    tournament.hostMessage = String(message || '').trim();
    await tournament.save();
    return res.json({ success: true, tournament });
  } catch (error) {
    console.error('updateTournamentMessage error:', error);
    return res.status(500).json({ error: 'Failed to update tournament message' });
  }
};

export const addTournamentStage = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, createdBy: req.userId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (!isCustomFormat(tournament.format)) return res.status(400).json({ error: 'Stages can only be added to custom tournaments' });
    if (tournament.format === 'team-vs-team') return res.status(400).json({ error: 'Team vs Team rounds are generated automatically' });

    const stageName = String(req.body?.name || '').trim();
    if (!stageName) return res.status(400).json({ error: 'Stage name is required' });

    const nextOrder = (tournament.stages?.length || 0) + 1;
    const stage = {
      name: stageName,
      key: `custom-${Date.now()}`,
      order: nextOrder,
      time: String(req.body?.time || '').trim(),
      groups: 0,
      matchesPerGroup: 0,
      matchCount: 0,
      matches: [],
      status: 'pending',
    };

    tournament.stages.push(stage);
    await tournament.save();
    return res.status(201).json({ success: true, stage, tournament });
  } catch (error) {
    console.error('addTournamentStage error:', error);
    return res.status(500).json({ error: 'Failed to add stage' });
  }
};

export const generateTeamTournamentBracket = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, createdBy: req.userId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.format !== 'team-vs-team') return res.status(400).json({ error: 'Automatic brackets are only available for Team vs Team tournaments' });
    if (tournament.stages.some((stage) => stage.key.startsWith('tvt-round-'))) {
      return res.status(409).json({ error: 'The Team vs Team bracket has already started' });
    }

    const participants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' })
      .sort({ registeredAt: 1, _id: 1 })
      .select('_id')
      .lean();
    if (participants.length < 2) return res.status(400).json({ error: 'At least two registered teams are required to start the bracket' });

    const bracket = buildTournamentBracket(participants.map((participant) => participant._id));
    const stages = bracket.map((round) => ({
      name: round.name,
      key: round.key,
      order: round.order,
      status: 'active',
      matches: round.matches.map((match) => ({
        _id: new mongoose.Types.ObjectId(),
        name: match.name,
        order: match.order,
        round: match.round,
        participants: match.participants,
        teamA: match.teamA,
        teamB: match.teamB,
        winnerParticipantId: match.winnerParticipantId,
        status: match.status,
        currentGame: 1,
      })),
    }));

    for (let stageIndex = 0; stageIndex < stages.length - 1; stageIndex += 1) {
      for (let matchIndex = 0; matchIndex < stages[stageIndex].matches.length; matchIndex += 1) {
        const matchConfig = bracket[stageIndex].matches[matchIndex];
        const match = stages[stageIndex].matches[matchIndex];
        const nextMatch = stages[stageIndex + 1].matches[matchConfig.advancesToIndex];
        match.advancesToMatchId = nextMatch._id;
        match.advancesToSlot = matchConfig.advancesToSlot;
        if (match.winnerParticipantId) {
          if (matchConfig.advancesToSlot === 0) nextMatch.teamA = match.winnerParticipantId;
          else nextMatch.teamB = match.winnerParticipantId;
          nextMatch.participants = [nextMatch.teamA, nextMatch.teamB].filter(Boolean);
          if (nextMatch.teamA && nextMatch.teamB) nextMatch.status = 'active';
        }
      }
    }

    tournament.stages = stages;
    tournament.status = 'active';
    await tournament.save();
    return res.json({ success: true, tournament });
  } catch (error) {
    console.error('generateTeamTournamentBracket error:', error);
    return res.status(500).json({ error: 'Failed to generate Team vs Team bracket' });
  }
};

const payoutTeamTournamentWinner = async (tournament, winnerParticipantId) => {
  const participant = await TournamentParticipant.findById(winnerParticipantId);
  if (!participant) throw new Error('Winning team was not found');
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('Admin wallet account not found');
  const financials = calculateFinancials(tournament.entryFee, tournament.successfulEntries);
  const prizePoolCz = rupeesToCz(financials.prizePool);
  const hostShareCz = rupeesToCz(financials.hostShare);
  const platformFeeCz = rupeesToCz(financials.clutchZoneFee);
  const payoutClaim = await Tournament.findOneAndUpdate(
    { _id: tournament._id, payoutsDistributed: { $ne: true } },
    { $set: { ...financials, payoutsDistributed: true, payoutsDistributedAt: new Date(), status: 'completed' } },
    { new: true },
  );
  if (!payoutClaim) return;

  await User.findByIdAndUpdate(participant.userId, {
    $inc: { 'wallet.balance': prizePoolCz },
    $push: { 'wallet.transactions': { type: 'match_win', amount: prizePoolCz, description: `Team tournament winner: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
  });
  if (hostShareCz > 0) {
    await User.findByIdAndUpdate(tournament.createdBy, {
      $inc: { 'wallet.balance': hostShareCz },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: hostShareCz, description: `Host share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
  if (platformFeeCz > 0) {
    await User.findByIdAndUpdate(admin._id, {
      $inc: { 'wallet.balance': platformFeeCz },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: platformFeeCz, description: `Platform share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
};

export const getMyTeamTournamentMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId)
      .populate({ path: 'stages.matches.teamA', populate: { path: 'userId', select: 'username' } })
      .populate({ path: 'stages.matches.teamB', populate: { path: 'userId', select: 'username' } })
      .populate('stages.matches.gameResults.claims.userId', 'username')
      .lean();
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.format !== 'team-vs-team') return res.status(400).json({ error: 'TVT results are only available for Team vs Team tournaments' });

    const participant = await TournamentParticipant.findOne({ tournamentId: tournament._id, userId: req.userId, status: 'registered' }).lean();
    if (!participant) return res.status(403).json({ error: 'Join this tournament to view its team results' });
    const participantId = String(participant._id);
    const matches = tournament.stages.flatMap((stage) => (stage.matches || [])
      .filter((match) => [match.teamA, match.teamB].some((team) => String(team?._id || team || '') === participantId))
      .map((match) => ({
        id: String(match._id),
        name: match.name,
        roundName: stage.name,
        roundOrder: stage.order,
        matchOrder: match.order,
        status: match.status,
        teamA: match.teamA ? { id: String(match.teamA._id || match.teamA), name: match.teamA.teamName || match.teamA.displayName || match.teamA.userId?.username || 'Team A' } : null,
        teamB: match.teamB ? { id: String(match.teamB._id || match.teamB), name: match.teamB.teamName || match.teamB.displayName || match.teamB.userId?.username || 'Team B' } : null,
        winnerParticipantId: match.winnerParticipantId ? String(match.winnerParticipantId) : null,
        currentGame: match.currentGame || 1,
        teamAWins: match.teamAWins || 0,
        teamBWins: match.teamBWins || 0,
        bestOf: tournament.teamTournamentMode === 'bo3' ? 3 : 1,
        viewerParticipantId: participantId,
        gameResults: (match.gameResults || []).map((game) => ({
          gameNumber: game.gameNumber,
          status: game.status,
          winnerParticipantId: game.winnerParticipantId ? String(game.winnerParticipantId) : null,
          claims: (game.claims || []).map((claim) => ({
            userId: String(claim.userId?._id || claim.userId),
            username: claim.userId?.username || 'Player',
            participantId: String(claim.participantId),
            outcome: claim.outcome,
            screenshotUrl: claim.screenshotUrl || '',
            submittedAt: claim.submittedAt,
          })),
        })),
      })))
      .sort((left, right) => left.roundOrder - right.roundOrder || left.matchOrder - right.matchOrder);

    return res.json({ success: true, tournament: { id: String(tournament._id), name: tournament.name, game: tournament.game, teamTournamentMode: tournament.teamTournamentMode, status: tournament.status }, participantId, matches });
  } catch (error) {
    console.error('getMyTeamTournamentMatches error:', error);
    return res.status(500).json({ error: 'Failed to load TVT matches' });
  }
};

export const submitTeamTournamentResult = async (req, res) => {
  let operation = 'validating result submission';
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.format !== 'team-vs-team') return res.status(400).json({ error: 'TVT results are only available for Team vs Team tournaments' });

    const { stage, match } = findTournamentStageMatch(tournament, req.params.matchId) || {};
    if (!match || !stage?.key.startsWith('tvt-round-')) return res.status(404).json({ error: 'Team match not found' });

    const { outcome } = req.body || {};
    const proofOnly = req.body?.proofOnly === 'true';
    if (proofOnly) {
      if (match.status !== 'disputed') return res.status(409).json({ error: 'Screenshot proof can only be added to a disputed result' });
      if (!req.file) return res.status(400).json({ error: 'Choose a screenshot to upload' });
    } else {
      if (!['active', 'result_pending'].includes(match.status)) return res.status(409).json({ error: 'This team match is not accepting results' });
      if (!['win', 'lose'].includes(outcome)) return res.status(400).json({ error: 'Choose I WON or I LOST' });
      if (outcome === 'win' && !req.file) return res.status(400).json({ error: 'A screenshot is required when you choose I WON' });
    }

    const participant = await TournamentParticipant.findOne({ tournamentId: tournament._id, userId: req.userId, status: 'registered' });
    if (!participant) return res.status(403).json({ error: 'Only registered teams can submit results' });
    const participantId = String(participant._id);
    const teamAId = String(match.teamA || '');
    const teamBId = String(match.teamB || '');
    if (![teamAId, teamBId].includes(participantId) || !teamAId || !teamBId) {
      return res.status(403).json({ error: 'Your team is not assigned to this matchup yet' });
    }
    const opponentId = participantId === teamAId ? teamBId : teamAId;
    const gameNumber = tournament.teamTournamentMode === 'bo3' ? Number(match.currentGame || 1) : 1;
    let gameResult = match.gameResults.find((game) => game.gameNumber === gameNumber);

    if (proofOnly) {
      const existingClaim = gameResult?.claims.find((claim) => String(claim.participantId) === participantId);
      if (!existingClaim) return res.status(404).json({ error: 'Your result claim was not found' });
      if (existingClaim.screenshotUrl) return res.status(409).json({ error: 'Screenshot proof has already been uploaded for your claim' });
    }

    if (!proofOnly && gameResult?.status && ['disputed', 'completed'].includes(gameResult.status)) {
      return res.status(409).json({ error: 'This game result has already been finalized or sent for review' });
    }
    if (!proofOnly && gameResult?.claims.some((claim) => String(claim.participantId) === participantId)) {
      return res.status(409).json({ error: 'Your team has already submitted this game result' });
    }

    let screenshotUrl = '';
    if (req.file) {
      operation = 'uploading screenshot to Cloudinary';
      try {
        screenshotUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      } catch (uploadError) {
        console.error('Team tournament screenshot upload failed:', uploadError);
        return res.status(502).json({ error: `Screenshot upload failed: ${uploadError.message}` });
      }
      if (!/^https?:\/\//i.test(screenshotUrl)) {
        return res.status(503).json({ error: 'Screenshot upload requires valid Cloudinary credentials. Check the server Cloudinary environment variables.' });
      }
    }

    if (proofOnly) {
      operation = 'saving screenshot proof';
      const existingClaim = gameResult.claims.find((claim) => String(claim.participantId) === participantId);
      existingClaim.screenshotUrl = screenshotUrl;
      existingClaim.submittedAt = new Date();
      await tournament.save();
      return res.json({ success: true, status: match.status, screenshotUrl, proofOnly: true });
    }

    if (!gameResult) {
      match.gameResults.push({ gameNumber, status: 'pending', claims: [] });
      gameResult = match.gameResults[match.gameResults.length - 1];
    }
    gameResult.claims.push({
      participantId,
      userId: req.userId,
      outcome,
      claimedWinnerId: outcome === 'win' ? participantId : opponentId,
      screenshotUrl,
      submittedAt: new Date(),
    });

    const resolution = resolveTeamMatchClaims(gameResult.claims);
    let tournamentComplete = false;
    if (resolution.status === 'disputed') {
      gameResult.status = 'disputed';
      match.status = 'disputed';
    } else if (resolution.status === 'completed') {
      tournamentComplete = completeTeamTournamentGame(tournament, match, gameResult, resolution.winnerParticipantId);
    } else {
      gameResult.status = 'result_pending';
      match.status = 'result_pending';
    }

    operation = 'saving tournament result';
    await tournament.save();
    operation = 'processing tournament payout';
    if (tournamentComplete) await payoutTeamTournamentWinner(tournament, resolution.winnerParticipantId);
    return res.json({ success: true, status: match.status, currentGame: match.currentGame, teamAWins: match.teamAWins, teamBWins: match.teamBWins, screenshotUrl });
  } catch (error) {
    console.error(`submitTeamTournamentResult error while ${operation}:`, error);
    const message = String(error?.message || 'Unknown server error');
    const safeMessage = [
      process.env.CLOUDINARY_API_SECRET,
      process.env.CLOUDINARY_API_KEY,
      process.env.MONGODB_URI,
    ].filter(Boolean).reduce((text, secret) => text.replaceAll(secret, '[redacted]'), message);
    return res.status(500).json({ error: `Failed while ${operation}: ${safeMessage}` });
  }
};

export const resolveTeamTournamentDispute = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (req.user?.role !== 'admin' && String(tournament.createdBy) !== String(req.userId)) {
      return res.status(403).json({ error: 'Only this tournament host can resolve TVT results' });
    }

    const { match } = findTournamentStageMatch(tournament, req.params.matchId) || {};
    if (!match || match.status !== 'disputed') return res.status(404).json({ error: 'Disputed team match not found' });
    const winnerParticipantId = String(req.body?.winnerParticipantId || '');
    if (![String(match.teamA), String(match.teamB)].includes(winnerParticipantId)) {
      return res.status(400).json({ error: 'Select one of the two teams in this matchup' });
    }

    const gameNumber = tournament.teamTournamentMode === 'bo3' ? Number(req.body?.gameNumber || match.currentGame || 1) : 1;
    const gameResult = match.gameResults.find((game) => game.gameNumber === gameNumber && game.status === 'disputed');
    if (!gameResult) return res.status(404).json({ error: 'Disputed game result not found' });
    if (gameResult.claims.length !== 2 || gameResult.claims.some((claim) => !claim.screenshotUrl)) {
      return res.status(409).json({ error: 'Both teams must upload screenshot proof before this result can be resolved' });
    }

    const tournamentComplete = completeTeamTournamentGame(tournament, match, gameResult, winnerParticipantId);
    await tournament.save();
    if (tournamentComplete) await payoutTeamTournamentWinner(tournament, winnerParticipantId);
    return res.json({ success: true, status: match.status, currentGame: match.currentGame, teamAWins: match.teamAWins, teamBWins: match.teamBWins });
  } catch (error) {
    console.error('resolveTeamTournamentDispute error:', error);
    return res.status(500).json({ error: 'Failed to resolve TVT result dispute' });
  }
};

export const deleteTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      _id: req.params.tournamentId,
      createdBy: req.userId,
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    await Promise.all([
      Tournament.deleteOne({ _id: tournament._id }),
      TournamentParticipant.deleteMany({ tournamentId: tournament._id }),
      TournamentMatchResult.deleteMany({ tournamentId: tournament._id }),
      TournamentIssueReport.deleteMany({ tournamentId: tournament._id }),
    ]);

    return res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('deleteTournament error:', error);
    return res.status(500).json({ error: 'Failed to delete tournament' });
  }
};

const findParticipantTournament = async (tournamentId, userId) => {
  if (!mongoose.isValidObjectId(tournamentId)) {
    return { error: 'Tournament not found', status: 404 };
  }

  const tournament = await Tournament.findById(tournamentId)
    .select('name hostInstagramUsername createdBy')
    .lean();
  if (!tournament) return { error: 'Tournament not found', status: 404 };

  const isRegistered = await TournamentParticipant.exists({
    tournamentId: tournament._id,
    userId,
    status: 'registered',
  });
  if (!isRegistered) return { error: 'Only registered participants can access tournament support', status: 403 };
  return { tournament };
};

const serializeTournamentIssueReport = (report) => buildTournamentIssueReportStatus(report);

export const getTournamentSupport = async (req, res) => {
  try {
    const access = await findParticipantTournament(req.params.tournamentId, req.userId);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const report = await TournamentIssueReport.findOne({
      tournamentId: access.tournament._id,
      reportingUserId: req.userId,
    }).lean();
    return res.json({
      success: true,
      tournament: {
        _id: access.tournament._id,
        name: access.tournament.name,
        hostInstagramUsername: access.tournament.hostInstagramUsername || '',
      },
      report: serializeTournamentIssueReport(report),
    });
  } catch (error) {
    console.error('getTournamentSupport error:', error);
    return res.status(500).json({ error: 'Failed to load tournament support' });
  }
};

export const createTournamentIssueReport = async (req, res) => {
  try {
    const access = await findParticipantTournament(req.params.tournamentId, req.userId);
    if (access.error) return res.status(access.status).json({ error: access.error });

    const { issueCategory, description } = req.body || {};
    if (!TOURNAMENT_ISSUE_CATEGORIES.includes(issueCategory)) {
      return res.status(400).json({ error: 'Choose a valid tournament issue category' });
    }
    if (typeof description !== 'string' || !description.trim()) {
      return res.status(400).json({ error: 'Describe the issue before submitting your report' });
    }
    if (description.trim().length > 2000) {
      return res.status(400).json({ error: 'Issue description cannot exceed 2000 characters' });
    }

    const report = await TournamentIssueReport.create({
      tournamentId: access.tournament._id,
      reportingUserId: req.userId,
      issueCategory,
      description: description.trim(),
    });

    const hostNotificationMessage = `New ${issueCategory} report from ${req.user?.username || 'a player'} for "${access.tournament.name}". Open your Host Dashboard to review it.`;
    let hostNotificationSaved = false;
    try {
      const notificationResult = await User.updateOne(
        { _id: access.tournament.createdBy },
        {
          $push: {
            notifications: {
              type: 'warning',
              message: hostNotificationMessage,
              link: `/host-dashboard?tournamentId=${access.tournament._id}`,
              read: false,
              createdAt: new Date(),
            },
          },
        },
      );
      hostNotificationSaved = notificationResult.modifiedCount === 1;
      if (!hostNotificationSaved) {
        console.error(`Host notification was not saved for tournament ${access.tournament._id}`);
      }

      const host = hostNotificationSaved
        ? await User.findById(access.tournament.createdBy).select('onesignalPlayerId notificationPreferences').lean()
        : null;
      if (host?.onesignalPlayerId && host.notificationPreferences?.systemNotifications !== false) {
        void sendNotification(
          [host.onesignalPlayerId],
          'New Tournament Issue Report',
          hostNotificationMessage,
          {
            skipInApp: true,
            url: `/host-dashboard?tournamentId=${access.tournament._id}`,
            data: { tournamentId: String(access.tournament._id), reportId: String(report._id) },
          },
        ).then((result) => {
          if (!result.success) console.warn('Host tournament report push notification was not delivered:', result.error || result.message);
        });
      }
    } catch (notificationError) {
      console.error('Failed to notify tournament host about issue report:', notificationError);
    }

    return res.status(201).json({
      success: true,
      report: serializeTournamentIssueReport(report),
      hostNotificationSaved,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'You have already submitted an issue report for this tournament' });
    }
    console.error('createTournamentIssueReport error:', error);
    return res.status(500).json({ error: 'Failed to submit tournament issue report' });
  }
};

export const listMyTournamentIssueReports = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ createdBy: req.userId }).select('_id').lean();
    const tournamentIds = tournaments.map((tournament) => tournament._id);
    const reports = tournamentIds.length
      ? await TournamentIssueReport.find({ tournamentId: { $in: tournamentIds } })
          .sort({ createdAt: -1 })
          .populate('tournamentId', 'name')
          .populate('reportingUserId', 'username')
          .lean()
      : [];
    return res.json({ success: true, reports });
  } catch (error) {
    console.error('listMyTournamentIssueReports error:', error);
    return res.status(500).json({ error: 'Failed to load tournament issue reports' });
  }
};

export const confirmTournamentHostContact = async (req, res) => {
  try {
    const access = await findParticipantTournament(req.params.tournamentId, req.userId);
    if (access.error) return res.status(access.status).json({ error: access.error });
    if (!mongoose.isValidObjectId(req.params.reportId)) {
      return res.status(404).json({ error: 'Issue report not found' });
    }

    const reportQuery = {
      _id: req.params.reportId,
      tournamentId: access.tournament._id,
      reportingUserId: req.userId,
    };
    let report = await TournamentIssueReport.findOneAndUpdate(
      { ...reportQuery, hostContactConfirmedAt: null },
      { $set: { hostContactConfirmedAt: new Date() } },
      { new: true },
    );
    if (!report) report = await TournamentIssueReport.findOne(reportQuery);
    if (!report) return res.status(404).json({ error: 'Issue report not found' });

    return res.json({ success: true, report: serializeTournamentIssueReport(report) });
  } catch (error) {
    console.error('confirmTournamentHostContact error:', error);
    return res.status(500).json({ error: 'Failed to confirm host contact' });
  }
};

export const listPublicTournaments = async (req, res) => {
  try {
    await cleanupExpiredCompletedTournaments();
    const now = new Date();
    let currentUserId = null;
    const authHeader = req.headers.authorization || '';
    if (authHeader.startsWith('Bearer ')) {
      try {
        const token = authHeader.split(' ')[1];
        const payload = verifyToken(token);
        currentUserId = payload.userId || payload.sub || payload.id || null;
      } catch (error) {
        currentUserId = null;
      }
    }

    const registrations = currentUserId
      ? await TournamentParticipant.find({ userId: currentUserId, status: 'registered' })
          .select('tournamentId groupNumber')
          .lean()
      : [];
    const registeredTournamentIds = new Set(registrations.map((item) => String(item.tournamentId)));
    const userGroupMap = new Map(registrations.filter((item) => Number(item.groupNumber) > 0).map((item) => [String(item.tournamentId), Number(item.groupNumber)]));

    const tournaments = await Tournament.find({
      status: { $in: ['open', 'upcoming', 'active'] },
      $or: [
        ...buildTournamentRegistrationWindowQuery(now).$or,
        ...(registeredTournamentIds.size ? [{ _id: { $in: [...registeredTournamentIds] } }] : []),
      ],
    })
      .select('name game format entryFee maxTeams perGroup teamSize teamTournamentMode successfulEntries prizePool perKillReward stages status createdBy createdAt estimatedDate estimatedTime registrationDeadline hostMessage roomId roomPassword')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tournaments: tournaments.map((tournament) => {
        const financials = isPerKillFormat(tournament.format)
          ? { totalCollection: (tournament.entryFee || 0) * (tournament.successfulEntries || 0), prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
          : calculateFinancials(tournament.entryFee, tournament.successfulEntries || 0);

        return {
          ...tournament,
          ...financials,
          successfulEntries: tournament.successfulEntries || 0,
          isRegistered: currentUserId ? registeredTournamentIds.has(String(tournament._id)) : false,
          userGroup: currentUserId ? userGroupMap.get(String(tournament._id)) || null : null,
        };
      }),
    });
  } catch (error) {
    console.error('listPublicTournaments error:', error);
    return res.status(500).json({ error: 'Failed to load public tournaments' });
  }
};

export const joinTournament = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const now = new Date();
    const tournamentForRegistration = await Tournament.findById(tournamentId).select('format teamSize status registrationDeadline createdAt').lean();
    if (!tournamentForRegistration) return res.status(404).json({ error: 'Tournament not found' });
    const registrationDeadline = tournamentForRegistration.registrationDeadline
      || (tournamentForRegistration.createdAt ? new Date(new Date(tournamentForRegistration.createdAt).getTime() + COMPLETED_TOURNAMENT_EXPIRY_MS) : null);
    if (registrationDeadline && registrationDeadline <= now) {
      return res.status(400).json({ error: 'Registration for this tournament has closed' });
    }

    let registration;
    try {
      registration = normalizeTournamentRegistration({
        ...(req.body || {}),
        format: tournamentForRegistration.format,
        teamSize: tournamentForRegistration.teamSize || 1,
      });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const existingParticipant = await TournamentParticipant.findOne({ tournamentId, userId: req.userId, status: 'registered' });
    if (existingParticipant) {
      return res.status(409).json({ error: 'You are already registered for this tournament' });
    }

    const acceptedStatuses = tournamentForRegistration.format === 'team-vs-team' ? ['open', 'upcoming'] : ['open', 'upcoming', 'active'];
    const tournament = await Tournament.findOneAndUpdate(
      {
        _id: tournamentId,
        status: { $in: acceptedStatuses },
        ...buildTournamentRegistrationWindowQuery(now),
        $expr: { $lt: ['$successfulEntries', '$maxTeams'] },
      },
      { $inc: { successfulEntries: 1 } },
      { new: true },
    );
    if (!tournament) {
      return res.status(400).json({ error: 'Tournament is full or no longer accepting entries' });
    }

    const entryFeeCz = rupeesToCz(tournament.entryFee);
    const user = await User.findOneAndUpdate(
      { _id: req.userId, 'wallet.balance': { $gte: entryFeeCz } },
      {
        $inc: { 'wallet.balance': -entryFeeCz },
        $push: {
          'wallet.transactions': {
            type: 'fee',
            amount: -entryFeeCz,
            description: `Tournament entry fee: ${tournament.name}`,
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );

    if (!user) {
      await Tournament.findByIdAndUpdate(tournament._id, { $inc: { successfulEntries: -1 } });
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    try {
      const participant = await TournamentParticipant.create({
        tournamentId: tournament._id,
        userId: req.userId,
        entryFee: tournament.entryFee,
        ...registration,
      });
      const allParticipants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' }).sort({ registeredAt: 1 }).lean();
      const assignments = assignTournamentGroups(allParticipants, Math.random, tournament.perGroup || 12);
      const updates = allParticipants.map((entry) => ({
        updateOne: {
          filter: { _id: entry._id },
          update: { $set: { groupNumber: Number(assignments.get(String(entry._id)) || 1) } },
        },
      }));
      if (updates.length) {
        await TournamentParticipant.bulkWrite(updates);
      }
      const financials = isPerKillFormat(tournament.format)
        ? { totalCollection: tournament.entryFee * tournament.successfulEntries, prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
        : calculateFinancials(tournament.entryFee, tournament.successfulEntries);
      const tournamentUpdate = { $set: financials };
      const hasScheduledStageMatches = tournament.stages.some((stage) => stage.matches.length > 0);
      if (hasScheduledStageMatches && tournament.format !== 'team-vs-team') {
        tournamentUpdate.$addToSet = { 'stages.$[].matches.$[].participants': participant._id };
      }
      await Tournament.updateOne({ _id: tournament._id }, tournamentUpdate);
      return res.json({ success: true, message: 'Tournament registration successful', walletBalance: user.wallet.balance, userGroup: Number(assignments.get(String(participant._id)) || 1), teamName: registration.teamName, teamMembers: registration.teamMembers });
    } catch (error) {
      await Tournament.findByIdAndUpdate(tournament._id, { $inc: { successfulEntries: -1 } });
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'wallet.balance': entryFeeCz },
        $pull: { 'wallet.transactions': { description: `Tournament entry fee: ${tournament.name}`, amount: -entryFeeCz } },
      });
      if (error.code === 11000) return res.status(409).json({ error: 'You are already registered for this tournament' });
      throw error;
    }

  } catch (error) {
    console.error('joinTournament error:', error);
    return res.status(500).json({ error: 'Failed to join tournament' });
  }
};

export const buildTeamTournamentGroups = ({ stages = [], participants = [], currentUserId = null }) => {
  const participantMap = new Map(participants.map((participant) => [String(participant._id), participant]));
  const groups = [];

  for (const stage of stages.filter((item) => item.key.startsWith('tvt-round-')).sort((left, right) => left.order - right.order)) {
    for (const match of [...stage.matches].sort((left, right) => left.order - right.order)) {
      const teamA = participantMap.get(String(match.teamA || ''));
      const teamB = participantMap.get(String(match.teamB || ''));
      if (!teamA || !teamB) continue;

      const toGroupParticipant = (participant) => ({
        _id: participant._id,
        participantId: participant._id,
        userId: participant.userId?._id || participant.userId,
        displayName: participant.displayName || participant.userId?.username || 'Participant',
        username: participant.userId?.username || participant.displayName || 'Participant',
        teamName: participant.teamName || '',
        teamMembers: participant.teamMembers || [],
      });

      groups.push({
        groupNumber: groups.length + 1,
        title: `${stage.name} · Match ${match.order}`,
        status: match.status,
        participants: [toGroupParticipant(teamA), toGroupParticipant(teamB)],
      });
    }
  }

  const userId = String(currentUserId || '');
  const userMatches = groups.filter((group) => group.participants.some((participant) => String(participant.userId) === userId));
  const currentMatch = userMatches.find((group) => ['active', 'result_pending', 'disputed'].includes(group.status));
  const userGroup = currentMatch?.groupNumber ?? userMatches.at(-1)?.groupNumber ?? null;

  return { groups, userGroup };
};

export const getTournamentGroups = async (req, res) => {
  try {
    const tournamentId = req.params.tournamentId;
    const tournament = await Tournament.findById(tournamentId).lean();
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const participants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' })
      .populate('userId', 'username')
      .sort({ registeredAt: 1 })
      .lean();

    if (!participants.length) {
      return res.json({ success: true, groups: [], userGroup: null });
    }

    if (tournament.format === 'team-vs-team') {
      const currentUserId = req.user?._id || req.user?.userId || req.userId || null;
      const { groups, userGroup } = buildTeamTournamentGroups({
        stages: tournament.stages,
        participants,
        currentUserId,
      });
      return res.json({ success: true, groups, userGroup, groupSize: 2 });
    }

    const persistedGroups = participants.every((participant) => Number(participant.groupNumber) > 0);
    const assignments = persistedGroups
      ? new Map(participants.map((participant) => [String(participant._id), Number(participant.groupNumber)]))
      : assignTournamentGroups(participants, Math.random, tournament.perGroup || 12);

    if (!persistedGroups) {
      const updates = participants.map((participant) => ({
        updateOne: {
          filter: { _id: participant._id },
          update: { $set: { groupNumber: Number(assignments.get(String(participant._id)) || 1) } },
        },
      }));
      if (updates.length) await TournamentParticipant.bulkWrite(updates);
    }
    const groupMap = new Map();
    participants.forEach((participant) => {
      const groupNumber = Number(assignments.get(String(participant._id)) || 1);
      const memberName = participant.displayName || participant.userId?.username || 'Participant';
      const bucket = groupMap.get(groupNumber) || [];
      bucket.push({
        _id: participant._id,
        participantId: participant._id,
        userId: participant.userId?._id || participant.userId,
        displayName: memberName,
        username: participant.userId?.username || memberName,
        teamName: participant.teamName || '',
        teamMembers: participant.teamMembers || [],
      });
      groupMap.set(groupNumber, bucket);
    });

    const groups = [...groupMap.entries()].sort(([left], [right]) => left - right).map(([groupNumber, members]) => ({
      groupNumber,
      participants: members,
    }));

    const currentUserId = req.user?._id || req.user?.userId || req.userId || null;
    const userGroup = currentUserId
      ? groups.find((group) => group.participants.some((participant) => String(participant.userId) === String(currentUserId)))?.groupNumber ?? null
      : null;

    return res.json({ success: true, groups, userGroup, groupSize: tournament.perGroup || 12 });
  } catch (error) {
    console.error('getTournamentGroups error:', error);
    return res.status(500).json({ error: 'Failed to load groups' });
  }
};

export const createTournamentMatchResult = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, createdBy: req.userId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (isPerKillFormat(tournament.format) && await TournamentMatchResult.exists({ tournamentId: tournament._id })) {
      return res.status(409).json({ error: 'Per-kill tournaments allow only one result.' });
    }
    const stage = tournament.stages.find((item) => item.key === req.body.stageKey);
    const matchTitle = String(req.body.matchTitle || '').trim();
    const resultType = isPerKillFormat(tournament.format) ? 'grand-finale' : (req.body.resultType === 'grand-finale' ? 'grand-finale' : 'normal');
    if (!stage) return res.status(400).json({ error: 'Stage not found' });
    if (!matchTitle) return res.status(400).json({ error: 'Match title is required' });
    const finalStageOrder = Math.max(...tournament.stages.map((item) => Number(item.order || 0)), 0);
    const isFinalStage = stage.order === finalStageOrder;
    if (resultType === 'grand-finale' && !isFinalStage && !requiresSingleStageSchedule(tournament.format)) return res.status(400).json({ error: 'Grand Finale result belongs only to the final stage' });

    const participants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' }).select('_id');
    const match = stage.matches.create({ name: matchTitle, order: stage.matches.length + 1, participants: participants.map((participant) => participant._id) });
    stage.matches.push(match);
    await tournament.save();
    const result = await TournamentMatchResult.create({ tournamentId: tournament._id, stageKey: stage.key, matchId: match._id, matchTitle, resultType });
    return res.status(201).json({ success: true, match, result });
  } catch (error) {
    console.error('createTournamentMatchResult error:', error);
    return res.status(500).json({ error: 'Failed to create result' });
  }
};

const findOwnedMatch = async (tournamentId, matchId, user) => {
  const tournament = await Tournament.findById(tournamentId).populate('stages.matches.participants');
  if (!tournament) return { error: 'Tournament not found', status: 404 };
  if (user.role !== 'admin' && tournament.createdBy.toString() !== user._id.toString()) {
    return { error: 'Tournament access required', status: 403 };
  }
  for (const stage of tournament.stages) {
    const match = stage.matches.id(matchId);
    if (match) return { tournament, stage, match };
  }
  return { error: 'Tournament match not found', status: 404 };
};

export const getTournamentManageView = async (req, res) => {
  try {
    const query = req.user.role === 'admin'
      ? { _id: req.params.tournamentId }
      : { _id: req.params.tournamentId, createdBy: req.userId };
    const tournament = await Tournament.findOne(query)
      .populate('stages.matches.participants')
      .populate({ path: 'stages.matches.teamA', populate: { path: 'userId', select: 'username' } })
      .populate({ path: 'stages.matches.teamB', populate: { path: 'userId', select: 'username' } })
      .populate('stages.matches.winnerParticipantId')
      .populate('stages.matches.gameResults.winnerParticipantId')
      .populate('stages.matches.gameResults.claims.userId', 'username');
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });

    const participants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' })
      .sort({ registeredAt: 1 })
      .lean();

    const results = await TournamentMatchResult.find({ tournamentId: tournament._id }).lean();
    return res.json({ success: true, tournament, participants, results });
  } catch (error) {
    console.error('getTournamentManageView error:', error);
    return res.status(500).json({ error: 'Failed to load tournament matches' });
  }
};

export const saveTournamentMatchDraft = async (req, res) => {
  try {
    const found = await findOwnedMatch(req.params.tournamentId, req.params.matchId, req.user);
    if (found.error) return res.status(found.status).json({ error: found.error });
    const { tournament, stage, match } = found;
    const entries = Array.isArray(req.body.entries) ? req.body.entries : [];
    const matchTitle = String(req.body.matchTitle || '').trim();
    const resultType = isPerKillFormat(tournament.format) ? 'grand-finale' : (req.body.resultType === 'grand-finale' ? 'grand-finale' : 'normal');
    const finalStageOrder = Math.max(...tournament.stages.map((item) => Number(item.order || 0)), 0);
    const isFinalStage = stage.order === finalStageOrder;
    if (matchTitle && resultType === 'grand-finale' && !isFinalStage && !requiresSingleStageSchedule(tournament.format)) return res.status(400).json({ error: 'Grand Finale result belongs only to the final stage' });
    const participantMap = new Map(match.participants.map((participant) => [participant._id.toString(), participant]));
    const seen = new Set();
    const normalizedEntries = [];
    for (const entry of entries) {
      if (!participantMap.has(String(entry.participantId))) return res.status(400).json({ error: 'Participant is not assigned to this match' });
      if (seen.has(String(entry.participantId))) return res.status(400).json({ error: 'Duplicate participant in result' });
      seen.add(String(entry.participantId));

      if (isPerKillFormat(tournament.format)) {
        const normalized = normalizeResultEntry({ entry, participantMap, isPerKill: true, perKillReward: Number(tournament.perKillReward || 0) });
        if (!Number.isFinite(normalized.kills) || normalized.kills < 0) return res.status(400).json({ error: 'Kills must be a valid non-negative number' });
        normalizedEntries.push(normalized);
        continue;
      }

      const normalized = normalizeResultEntry({ entry, participantMap, isPerKill: false, perKillReward: Number(tournament.perKillReward || 0) });
      const points = Number(normalized.points || 0);
      if (!Number.isFinite(points) || points < 0) return res.status(400).json({ error: 'Points must be a valid non-negative number' });
      normalizedEntries.push(normalized);
    }
    let result = await TournamentMatchResult.findOne({ tournamentId: tournament._id, matchId: match._id });
    if (result?.status === 'published') {
      return res.status(409).json({ error: 'Published results are locked' });
    }
    if (!result) {
      result = new TournamentMatchResult({ tournamentId: tournament._id, matchId: match._id, stageKey: stage.key, status: 'draft' });
    }
    result.stageKey = stage.key;
    if (matchTitle) result.matchTitle = matchTitle;
    result.resultType = resultType;
    if (matchTitle) match.name = matchTitle;
    await tournament.save();
    result.entries = normalizedEntries;
    await result.save();
    return res.json({ success: true, result });
  } catch (error) {
    console.error('saveTournamentMatchDraft error:', error);
    return res.status(500).json({ error: 'Failed to save result draft' });
  }
};

const distributeGrandFinalePayout = async (tournament, result) => {
  if (tournament.payoutsDistributed) return;
  const admin = await User.findOne({ role: 'admin' });
  if (!admin) throw new Error('Admin wallet account not found');
  const financials = calculateFinancials(tournament.entryFee, tournament.successfulEntries);
  const claimed = await Tournament.findOneAndUpdate(
    { _id: tournament._id, payoutsDistributed: { $ne: true } },
    { $set: { ...financials, payoutsDistributed: true, payoutsDistributedAt: new Date(), status: 'completed' } },
    { new: true },
  );
  if (!claimed) return;

  const sortedEntries = [...result.entries].sort((left, right) => Number(right.points || 0) - Number(left.points || 0));
  const prizeShares = [0.5, 0.3, 0.2];
  const activeEntries = sortedEntries.slice(0, Math.min(3, sortedEntries.length));
  const totalShare = activeEntries.reduce((sum, _, index) => sum + prizeShares[index], 0);

  for (let index = 0; index < activeEntries.length; index += 1) {
    const entry = activeEntries[index];
    const participant = await TournamentParticipant.findById(entry.participantId);
    if (!participant) continue;
    const payout = rupeesToCz(financials.prizePool * (prizeShares[index] / totalShare));
    await User.findByIdAndUpdate(participant.userId, {
      $inc: { 'wallet.balance': payout },
      $push: { 'wallet.transactions': { type: 'match_win', amount: payout, description: `Tournament ${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} place: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }

  const host = await User.findById(tournament.createdBy);
  const hostShareCz = rupeesToCz(financials.hostShare);
  const platformFeeCz = rupeesToCz(financials.clutchZoneFee);
  if (host && hostShareCz > 0) {
    await User.findByIdAndUpdate(host._id, {
      $inc: { 'wallet.balance': hostShareCz },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: hostShareCz, description: `Host share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
  if (platformFeeCz > 0) {
    await User.findByIdAndUpdate(admin._id, {
      $inc: { 'wallet.balance': platformFeeCz },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: platformFeeCz, description: `Platform share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
};

const distributePerKillPayout = async (tournament, result) => {
  const claimed = await Tournament.findOneAndUpdate(
    { _id: tournament._id, payoutsDistributed: { $ne: true } },
    { $set: { payoutsDistributed: true, payoutsDistributedAt: new Date(), status: 'completed' } },
    { new: true },
  );
  if (!claimed) return;

  for (const entry of result.entries || []) {
    const moneyCz = rupeesToCz(entry.money || 0);
    if (!moneyCz) continue;
    const participant = await TournamentParticipant.findById(entry.participantId);
    if (!participant) continue;
    await User.findByIdAndUpdate(participant.userId, {
      $inc: { 'wallet.balance': moneyCz },
      $push: { 'wallet.transactions': { type: 'match_win', amount: moneyCz, description: `Per-kill payout: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
};

export const publishTournamentMatchResult = async (req, res) => {
  try {
    const found = await findOwnedMatch(req.params.tournamentId, req.params.matchId, req.user);
    if (found.error) return res.status(found.status).json({ error: found.error });

    const submittedEntries = Array.isArray(req.body?.entries) ? req.body.entries : [];
    const matchTitle = String(req.body?.matchTitle || '').trim();
    const resultType = isPerKillFormat(found.tournament.format) ? 'grand-finale' : (req.body?.resultType === 'grand-finale' ? 'grand-finale' : 'normal');

    let result = await TournamentMatchResult.findOne({ tournamentId: req.params.tournamentId, matchId: req.params.matchId });
    if (!result) {
      result = new TournamentMatchResult({ tournamentId: req.params.tournamentId, matchId: req.params.matchId, stageKey: found.stage.key, status: 'draft' });
    }

    if (result.status === 'published') return res.status(409).json({ error: 'Published results are locked' });

    if (isPerKillFormat(found.tournament.format)) {
      const participantMap = new Map(found.match.participants.map((participant) => [participant._id.toString(), participant]));
      const seen = new Set();
      const normalizedEntries = [];

      for (const entry of submittedEntries) {
        if (!participantMap.has(String(entry.participantId))) return res.status(400).json({ error: 'Participant is not assigned to this match' });
        if (seen.has(String(entry.participantId))) return res.status(400).json({ error: 'Duplicate participant in result' });
        seen.add(String(entry.participantId));

        const normalized = normalizeResultEntry({ entry, participantMap, isPerKill: true, perKillReward: Number(found.tournament.perKillReward || 0) });
        if (!Number.isFinite(normalized.kills) || normalized.kills < 0) return res.status(400).json({ error: 'Kills must be a valid non-negative number' });
        normalizedEntries.push(normalized);
      }

      if (!normalizedEntries.length) return res.status(400).json({ error: 'Add at least one result before publishing' });
      result.entries = normalizedEntries;
      result.resultType = resultType;
      result.stageKey = found.stage.key;
      if (matchTitle) result.matchTitle = matchTitle;
      if (matchTitle) found.match.name = matchTitle;
      result.status = 'published';
      result.publishedBy = req.userId;
      result.publishedAt = new Date();
      await found.tournament.save();
      await result.save();
      await distributePerKillPayout(found.tournament, result);
      return res.json({ success: true, result });
    }

    if (!result.entries || !result.entries.length) return res.status(400).json({ error: 'Add at least one result before publishing' });
    const finalStageOrder = Math.max(...found.tournament.stages.map((item) => Number(item.order || 0)), 0);
    const isFinalStage = found.stage.order === finalStageOrder;
    if (resultType === 'grand-finale' && !isFinalStage) return res.status(400).json({ error: 'Grand Finale result belongs only to the final stage' });

    result.resultType = resultType;
    result.stageKey = found.stage.key;
    if (matchTitle) result.matchTitle = matchTitle;
    if (matchTitle) found.match.name = matchTitle;
    result.status = 'published';
    result.publishedBy = req.userId;
    result.publishedAt = new Date();
    await result.save();

    if (result.resultType === 'grand-finale') {
      await distributeGrandFinalePayout(found.tournament, result);
    }

    return res.json({ success: true, result });
  } catch (error) {
    console.error('publishTournamentMatchResult error:', error);
    return res.status(500).json({ error: 'Failed to publish result' });
  }
};

export const getPublicTournamentMatches = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, status: { $in: ['open', 'upcoming', 'active', 'completed'] } }).lean();
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    const results = await TournamentMatchResult.find({ tournamentId: tournament._id, status: 'published' }).lean();
    return res.json({ success: true, tournament, results });
  } catch (error) {
    console.error('getPublicTournamentMatches error:', error);
    return res.status(500).json({ error: 'Failed to load published results' });
  }
};

export const buildTournamentBracket = (participantIds = [], rng = Math.random) => {
  const bracketSize = 2 ** Math.ceil(Math.log2(participantIds.length));
  const normalizedParticipants = participantIds.map(String);
  for (let index = normalizedParticipants.length - 1; index > 0; index -= 1) {
    const randomValue = typeof rng === 'function' ? rng() : 0.5;
    const swapIndex = Math.max(0, Math.min(index, Math.floor(randomValue * (index + 1))));
    [normalizedParticipants[index], normalizedParticipants[swapIndex]] = [normalizedParticipants[swapIndex], normalizedParticipants[index]];
  }
  const byeCount = bracketSize - normalizedParticipants.length;
  let participantIndex = 0;
  const roundCount = Math.log2(bracketSize);
  const roundNames = Array.from({ length: roundCount }, (_, index) => {
    const remainingRounds = roundCount - index;
    if (remainingRounds === 1) return 'Final';
    if (remainingRounds === 2) return 'Semifinal';
    if (remainingRounds === 3) return 'Quarterfinal';
    return `Round ${index + 1}`;
  });

  return roundNames.map((name, roundIndex) => {
    const matchCount = bracketSize / (2 ** (roundIndex + 1));
    return {
      name,
      order: roundIndex + 1,
      key: `tvt-round-${roundIndex + 1}`,
      matches: Array.from({ length: matchCount }, (_, matchIndex) => {
        let teamA = null;
        let teamB = null;
        if (roundIndex === 0) {
          teamA = normalizedParticipants[participantIndex++] || null;
          if (matchIndex >= byeCount) teamB = normalizedParticipants[participantIndex++] || null;
        }
        return {
          name: `${name} - Match ${matchIndex + 1}`,
          order: matchIndex + 1,
          round: roundIndex + 1,
          participants: [teamA, teamB].filter(Boolean),
          teamA,
          teamB,
          winnerParticipantId: teamA && !teamB ? teamA : null,
          status: teamA && !teamB ? 'completed' : teamA && teamB ? 'active' : 'pending',
          advancesToIndex: roundIndex < roundCount - 1 ? Math.floor(matchIndex / 2) : null,
          advancesToSlot: matchIndex % 2,
        };
      }),
    };
  });
};

export const resolveTeamMatchClaims = (claims = []) => {
  if (claims.length < 2) return { status: 'result_pending', winnerParticipantId: null };
  const firstClaimedWinner = String(claims[0].claimedWinnerId);
  const secondClaimedWinner = String(claims[1].claimedWinnerId);
  return firstClaimedWinner === secondClaimedWinner
    ? { status: 'completed', winnerParticipantId: firstClaimedWinner }
    : { status: 'disputed', winnerParticipantId: null };
};

const findTournamentStageMatch = (tournament, matchId) => {
  for (const stage of tournament.stages) {
    const match = stage.matches.id(matchId);
    if (match) return { stage, match };
  }
  return null;
};

const advanceTeamWinner = (tournament, match, winnerParticipantId) => {
  if (!match.advancesToMatchId) return false;
  const next = findTournamentStageMatch(tournament, match.advancesToMatchId);
  if (!next) throw new Error('Next Team vs Team round was not found');
  if (match.advancesToSlot === 0) next.match.teamA = winnerParticipantId;
  else next.match.teamB = winnerParticipantId;
  next.match.participants = [next.match.teamA, next.match.teamB].filter(Boolean);
  next.match.status = next.match.teamA && next.match.teamB ? 'active' : 'pending';
  return true;
};

const completeTeamTournamentGame = (tournament, match, gameResult, winnerParticipantId) => {
  gameResult.status = 'completed';
  gameResult.winnerParticipantId = winnerParticipantId;
  if (String(winnerParticipantId) === String(match.teamA)) match.teamAWins += 1;
  else match.teamBWins += 1;

  const hasWonSeries = tournament.teamTournamentMode !== 'bo3' || match.teamAWins >= 2 || match.teamBWins >= 2;
  if (!hasWonSeries) {
    match.currentGame += 1;
    match.status = 'active';
    return false;
  }

  match.winnerParticipantId = winnerParticipantId;
  match.status = 'completed';
  return !advanceTeamWinner(tournament, match, winnerParticipantId);
};