import mongoose from 'mongoose';
import Tournament from '../models/Tournament.js';
import TournamentParticipant from '../models/TournamentParticipant.js';
import User from '../models/User.js';
import TournamentMatchResult from '../models/TournamentMatchResult.js';
import { verifyToken } from '../utils/authUtils.js';

export const COMPLETED_TOURNAMENT_EXPIRY_MS = 2 * 24 * 60 * 60 * 1000;

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
  ]);

  return { deletedCount: tournamentIds.length };
};

export const calculateFinancials = (entryFee, successfulEntries) => {
  const totalCollection = entryFee * successfulEntries;
  const prizePool = totalCollection * 0.7;
  const retainedAmount = totalCollection * 0.3;
  return {
    totalCollection,
    prizePool,
    retainedAmount,
    clutchZoneFee: retainedAmount * 0.1,
    hostShare: retainedAmount * 0.2,
  };
};

const PER_KILL_FORMATS = new Set(['single-match', 'br-per-kill']);
const CUSTOM_FORMATS = new Set(['custom', 'br-custom', 'cs-custom', 'team-vs-team']);
const SINGLE_STAGE_FORMATS = new Set(['single-match', 'br-per-kill']);
const TEAM_SIZE_FORMATS = new Set(['br-custom', 'cs-custom', 'team-vs-team']);
export const CUSTOM_TOURNAMENT_GAMES = new Set([
  'Free Fire', 'BGMI', 'PUBG Mobile', 'Fortnite', 'Apex Legends', 'PUBG: Battlegrounds',
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
  teamSize = 1,
  teamTournamentMode = 'knockout',
  successfulEntries = 0,
  perKillReward = 0,
  estimatedDate,
  estimatedTime,
  roomId,
  roomPassword,
  hostMessage,
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
  const numericSuccessfulEntries = isPerKillFormat(format) ? 0 : Number(successfulEntries);
  const numericPerKillReward = Number(perKillReward);
  const numericTeamSize = TEAM_SIZE_FORMATS.has(format) ? Number(teamSize) : 1;
  if (!Number.isFinite(numericEntryFee) || numericEntryFee < 0 || !Number.isInteger(numericMaxTeams) || numericMaxTeams < 1 || !Number.isInteger(numericSuccessfulEntries) || numericSuccessfulEntries < 0 || numericSuccessfulEntries > numericMaxTeams) {
    throw new Error('Invalid entry fee or maximum teams');
  }
  const requiresTime = requiresSingleStageSchedule(format);
  if (!estimatedDate || (requiresTime && !estimatedTime)) {
    throw new Error(requiresTime ? 'Estimated match date/time fields (estimatedDate and estimatedTime) are required' : 'Estimated match date is required');
  }

  const parsedDate = requiresTime ? new Date(`${estimatedDate}T${estimatedTime}`) : new Date(`${estimatedDate}T00:00:00`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(requiresTime ? 'Estimated match date and time are invalid' : 'Estimated match date is invalid');
  }

  if (hostMessage !== undefined && typeof hostMessage !== 'string') {
    throw new Error('Tournament message must be text');
  }
  if (typeof hostMessage === 'string' && hostMessage.length > 300) {
    throw new Error('Tournament message cannot exceed 300 characters');
  }

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
    numericTeamSize,
    teamTournamentMode: format === 'team-vs-team' ? teamTournamentMode : '',
    numericSuccessfulEntries,
    numericPerKillReward,
    estimatedDate: parsedDate,
    roomId: roomId ? String(roomId).trim() : '',
    roomPassword: roomPassword ? String(roomPassword).trim() : '',
    estimatedTime: String(estimatedTime).trim(),
    hostMessage: hostMessage ? String(hostMessage).trim() : '',
  };
};

export const createTournament = async (req, res) => {
  try {
    const { name, game = 'Free Fire', format, entryFee, maxTeams, teamSize = 1, teamTournamentMode = 'knockout', successfulEntries = 0, customStages = [], perKillReward = 0, estimatedDate, estimatedTime, roomId, roomPassword, hostMessage } = req.body;

    let normalizedValues;
    try {
      normalizedValues = validateTournamentInput({
        name,
        game,
        format,
        entryFee,
        maxTeams,
        teamSize,
        teamTournamentMode,
        successfulEntries,
        perKillReward,
        estimatedDate,
        estimatedTime,
        roomId,
        roomPassword,
        hostMessage,
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
      teamSize: normalizedValues.numericTeamSize,
      teamTournamentMode: normalizedValues.teamTournamentMode || undefined,
      successfulEntries: normalizedValues.numericSuccessfulEntries,
      perKillReward: isPerKillFormat(format) ? normalizedValues.numericPerKillReward : 0,
      estimatedDate: normalizedValues.estimatedDate,
      estimatedTime: normalizedValues.estimatedTime,
      roomId: normalizedValues.roomId,
      roomPassword: normalizedValues.roomPassword,
      hostMessage: normalizedValues.hostMessage,
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
  const payoutClaim = await Tournament.findOneAndUpdate(
    { _id: tournament._id, payoutsDistributed: { $ne: true } },
    { $set: { payoutsDistributed: true, payoutsDistributedAt: new Date(), status: 'completed' } },
    { new: true },
  );
  if (!payoutClaim) return;

  await User.findByIdAndUpdate(participant.userId, {
    $inc: { 'wallet.balance': financials.prizePool },
    $push: { 'wallet.transactions': { type: 'match_win', amount: financials.prizePool, description: `Team tournament winner: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
  });
  if (financials.hostShare > 0) {
    await User.findByIdAndUpdate(tournament.createdBy, {
      $inc: { 'wallet.balance': financials.hostShare },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: financials.hostShare, description: `Host share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
  if (financials.clutchZoneFee > 0) {
    await User.findByIdAndUpdate(admin._id, {
      $inc: { 'wallet.balance': financials.clutchZoneFee },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: financials.clutchZoneFee, description: `Platform share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
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
  try {
    const tournament = await Tournament.findById(req.params.tournamentId);
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.format !== 'team-vs-team') return res.status(400).json({ error: 'TVT results are only available for Team vs Team tournaments' });

    const { stage, match } = findTournamentStageMatch(tournament, req.params.matchId) || {};
    if (!match || !stage?.key.startsWith('tvt-round-')) return res.status(404).json({ error: 'Team match not found' });
    if (!['active', 'result_pending'].includes(match.status)) return res.status(409).json({ error: 'This team match is not accepting results' });

    const { outcome } = req.body || {};
    if (!['win', 'lose'].includes(outcome)) return res.status(400).json({ error: 'Choose I WON or I LOST' });
    if (outcome === 'win' && !req.file) return res.status(400).json({ error: 'A screenshot is required when you choose I WON' });

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
    let screenshotUrl = '';
    let screenshotHash = '';

    if (req.file) {
      const mimeType = ScreenshotValidator.detectMimeType(req.file.buffer);
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(mimeType)) {
        return res.status(400).json({ error: 'Upload a valid image screenshot' });
      }
      screenshotHash = ScreenshotValidator.generateHash(req.file.buffer);
      const existingHash = tournament.stages.some((item) => item.matches.some((teamMatch) =>
        (teamMatch.gameResults || []).some((game) => (game.claims || []).some((claim) => claim.screenshotHash === screenshotHash)),
      ));
      if (existingHash) return res.status(400).json({ error: 'This screenshot has already been submitted in the tournament' });
      try {
        screenshotUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
      } catch (uploadError) {
        return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      }
    }

    let gameResult = match.gameResults.find((game) => game.gameNumber === gameNumber);
    if (!gameResult) {
      match.gameResults.push({ gameNumber, status: 'pending', claims: [] });
      gameResult = match.gameResults[match.gameResults.length - 1];
    }
    if (gameResult.status === 'disputed' || gameResult.status === 'completed') {
      return res.status(409).json({ error: 'This game result has already been finalized or sent for review' });
    }
    if (gameResult.claims.some((claim) => String(claim.participantId) === participantId)) {
      return res.status(409).json({ error: 'Your team has already submitted this game result' });
    }

    gameResult.claims.push({
      participantId,
      userId: req.userId,
      outcome,
      claimedWinnerId: outcome === 'win' ? participantId : opponentId,
      screenshotUrl,
      screenshotHash,
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

    await tournament.save();
    if (tournamentComplete) await payoutTeamTournamentWinner(tournament, resolution.winnerParticipantId);
    return res.json({ success: true, status: match.status, currentGame: match.currentGame, teamAWins: match.teamAWins, teamBWins: match.teamBWins, screenshotUrl });
  } catch (error) {
    console.error('submitTeamTournamentResult error:', error);
    return res.status(500).json({ error: 'Failed to submit Team vs Team result' });
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
    ]);

    return res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('deleteTournament error:', error);
    return res.status(500).json({ error: 'Failed to delete tournament' });
  }
};

export const listPublicTournaments = async (req, res) => {
  try {
    await cleanupExpiredCompletedTournaments();
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

    const tournaments = await Tournament.find({
      status: { $in: ['open', 'upcoming', 'active'] },
      createdAt: { $gte: new Date(Date.now() - COMPLETED_TOURNAMENT_EXPIRY_MS) },
    })
      .select('name game format entryFee maxTeams teamSize teamTournamentMode successfulEntries prizePool perKillReward stages status createdBy createdAt estimatedDate estimatedTime hostMessage roomId roomPassword')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const registrations = currentUserId
      ? await TournamentParticipant.find({ userId: currentUserId, status: 'registered' })
          .select('tournamentId groupNumber')
          .lean()
      : [];

    const registeredTournamentIds = new Set(registrations.map((item) => String(item.tournamentId)));
    const userGroupMap = new Map(registrations.filter((item) => Number(item.groupNumber) > 0).map((item) => [String(item.tournamentId), Number(item.groupNumber)]));

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
    const tournamentForRegistration = await Tournament.findById(tournamentId).select('format teamSize status').lean();
    if (!tournamentForRegistration) return res.status(404).json({ error: 'Tournament not found' });

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
      { _id: tournamentId, status: { $in: acceptedStatuses }, $expr: { $lt: ['$successfulEntries', '$maxTeams'] } },
      { $inc: { successfulEntries: 1 } },
      { new: true },
    );
    if (!tournament) {
      return res.status(400).json({ error: 'Tournament is full or no longer accepting entries' });
    }

    const user = await User.findOneAndUpdate(
      { _id: req.userId, 'wallet.balance': { $gte: tournament.entryFee } },
      {
        $inc: { 'wallet.balance': -tournament.entryFee },
        $push: {
          'wallet.transactions': {
            type: 'fee',
            amount: -tournament.entryFee,
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
      const assignments = assignTournamentGroups(allParticipants, Math.random, 12);
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
        $inc: { 'wallet.balance': tournament.entryFee },
        $pull: { 'wallet.transactions': { description: `Tournament entry fee: ${tournament.name}`, amount: -tournament.entryFee } },
      });
      if (error.code === 11000) return res.status(409).json({ error: 'You are already registered for this tournament' });
      throw error;
    }

  } catch (error) {
    console.error('joinTournament error:', error);
    return res.status(500).json({ error: 'Failed to join tournament' });
  }
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

    const persistedGroups = participants.every((participant) => Number(participant.groupNumber) > 0);
    const assignments = persistedGroups
      ? new Map(participants.map((participant) => [String(participant._id), Number(participant.groupNumber)]))
      : assignTournamentGroups(participants, Math.random, 12);

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

    return res.json({ success: true, groups, userGroup, groupSize: 12 });
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
    { $set: { payoutsDistributed: true, payoutsDistributedAt: new Date(), status: 'completed' } },
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
    const payout = financials.prizePool * (prizeShares[index] / totalShare);
    await User.findByIdAndUpdate(participant.userId, {
      $inc: { 'wallet.balance': payout },
      $push: { 'wallet.transactions': { type: 'match_win', amount: payout, description: `Tournament ${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} place: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }

  const host = await User.findById(tournament.createdBy);
  if (host && financials.hostShare > 0) {
    await User.findByIdAndUpdate(host._id, {
      $inc: { 'wallet.balance': financials.hostShare },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: financials.hostShare, description: `Host share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
    });
  }
  if (financials.clutchZoneFee > 0) {
    await User.findByIdAndUpdate(admin._id, {
      $inc: { 'wallet.balance': financials.clutchZoneFee },
      $push: { 'wallet.transactions': { type: 'admin_adjustment', amount: financials.clutchZoneFee, description: `Platform share: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
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
    const money = Number(entry.money || 0);
    if (!money) continue;
    const participant = await TournamentParticipant.findById(entry.participantId);
    if (!participant) continue;
    await User.findByIdAndUpdate(participant.userId, {
      $inc: { 'wallet.balance': money },
      $push: { 'wallet.transactions': { type: 'match_win', amount: money, description: `Per-kill payout: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
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

export const buildTournamentBracket = (participantIds = []) => {
  const bracketSize = 2 ** Math.ceil(Math.log2(participantIds.length));
  const normalizedParticipants = participantIds.map(String);
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