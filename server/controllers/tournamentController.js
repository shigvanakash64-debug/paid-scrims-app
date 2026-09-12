import Tournament from '../models/Tournament.js';
import TournamentParticipant from '../models/TournamentParticipant.js';
import User from '../models/User.js';
import TournamentMatchResult from '../models/TournamentMatchResult.js';
import { verifyToken } from '../utils/authUtils.js';

const calculateFinancials = (entryFee, successfulEntries) => {
  const totalCollection = entryFee * successfulEntries;
  const prizePool = totalCollection * 0.7;
  const retainedAmount = totalCollection * 0.3;
  return {
    totalCollection,
    prizePool,
    retainedAmount,
    clutchZoneFee: retainedAmount * 0.2,
    hostShare: retainedAmount * 0.8,
  };
};

const buildStages = (format, customStages = []) => {
  if (format === 'single-match') {
    return [{ name: 'Per Kill', key: 'single-match', order: 1, matchCount: 1 }];
  }

  return customStages
    .filter((stage) => stage?.name?.trim())
    .map((stage, index) => ({
      name: stage.name.trim(),
      key: `custom-${index + 1}`,
      order: index + 1,
      matchCount: Math.max(1, Number(stage.matches) || 1),
    }));
};

export const validateTournamentInput = ({
  name,
  format,
  game,
  entryFee,
  maxTeams,
  successfulEntries = 0,
  perKillReward = 0,
  estimatedDate,
  estimatedTime,
  roomId,
  roomPassword,
}) => {
  if (!name || !format || entryFee === undefined || maxTeams === undefined) {
    throw new Error('Tournament name, format, entry fee and maximum teams are required');
  }
  if (!['single-match', 'custom'].includes(format)) {
    throw new Error('Invalid tournament format');
  }
  if (!['Free Fire', 'BGMI'].includes(game)) {
    throw new Error('Invalid game');
  }

  const numericEntryFee = Number(entryFee);
  const numericMaxTeams = Number(maxTeams);
  const numericSuccessfulEntries = format === 'single-match' ? 0 : Number(successfulEntries);
  const numericPerKillReward = Number(perKillReward);
  if (!Number.isFinite(numericEntryFee) || numericEntryFee < 0 || !Number.isInteger(numericMaxTeams) || numericMaxTeams < 1 || !Number.isInteger(numericSuccessfulEntries) || numericSuccessfulEntries < 0 || numericSuccessfulEntries > numericMaxTeams) {
    throw new Error('Invalid entry fee or maximum teams');
  }
  if (!estimatedDate || !estimatedTime) {
    throw new Error('Estimated match date/time fields (estimatedDate and estimatedTime) are required');
  }
  const parsedDate = new Date(`${estimatedDate}T${estimatedTime}`);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error('Estimated match date and time are invalid');
  }
  if (!roomId || !String(roomId).trim() || !roomPassword || !String(roomPassword).trim()) {
    throw new Error('Room ID and password are required');
  }
  if (format === 'single-match') {
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
    numericSuccessfulEntries,
    numericPerKillReward,
    estimatedDate: parsedDate,
    roomId: String(roomId).trim(),
    roomPassword: String(roomPassword).trim(),
    estimatedTime: String(estimatedTime).trim(),
  };
};

export const createTournament = async (req, res) => {
  try {
    const { name, game = 'Free Fire', format, entryFee, maxTeams, successfulEntries = 0, customStages = [], perKillReward = 0, estimatedDate, estimatedTime, roomId, roomPassword } = req.body;

    let normalizedValues;
    try {
      normalizedValues = validateTournamentInput({
        name,
        game,
        format,
        entryFee,
        maxTeams,
        successfulEntries,
        perKillReward,
        estimatedDate,
        estimatedTime,
        roomId,
        roomPassword,
      });
    } catch (validationError) {
      return res.status(400).json({ error: validationError.message });
    }

    const financials = format === 'single-match'
      ? { totalCollection: normalizedValues.numericEntryFee * normalizedValues.numericSuccessfulEntries, prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
      : calculateFinancials(normalizedValues.numericEntryFee, normalizedValues.numericSuccessfulEntries);

    const tournament = await Tournament.create({
      name: name.trim(),
      game,
      format,
      entryFee: normalizedValues.numericEntryFee,
      maxTeams: normalizedValues.numericMaxTeams,
      successfulEntries: normalizedValues.numericSuccessfulEntries,
      perKillReward: format === 'single-match' ? normalizedValues.numericPerKillReward : 0,
      estimatedDate: normalizedValues.estimatedDate,
      estimatedTime: normalizedValues.estimatedTime,
      roomId: normalizedValues.roomId,
      roomPassword: normalizedValues.roomPassword,
      ...financials,
      stages: buildStages(format, customStages),
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
    const tournaments = await Tournament.find({ createdBy: req.userId }).sort({ createdAt: -1 }).lean();
    const normalizedTournaments = tournaments.map((tournament) => {
      const financials = tournament.format === 'single-match'
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

    const tournaments = await Tournament.find({ status: { $in: ['open', 'upcoming', 'active'] } })
      .select('name game format entryFee maxTeams successfulEntries prizePool perKillReward stages status createdBy createdAt estimatedDate estimatedTime roomId roomPassword')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    const registrationIds = currentUserId
      ? await TournamentParticipant.find({ userId: currentUserId, status: 'registered' })
          .select('tournamentId')
          .lean()
      : [];

    const registeredTournamentIds = new Set(registrationIds.map((item) => String(item.tournamentId)));

    return res.json({
      success: true,
      tournaments: tournaments.map((tournament) => {
        const financials = tournament.format === 'single-match'
          ? { totalCollection: (tournament.entryFee || 0) * (tournament.successfulEntries || 0), prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
          : calculateFinancials(tournament.entryFee, tournament.successfulEntries || 0);

        return {
          ...tournament,
          ...financials,
          successfulEntries: tournament.successfulEntries || 0,
          isRegistered: currentUserId ? registeredTournamentIds.has(String(tournament._id)) : false,
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
    const existingParticipant = await TournamentParticipant.findOne({ tournamentId, userId: req.userId, status: 'registered' });
    if (existingParticipant) {
      return res.status(409).json({ error: 'You are already registered for this tournament' });
    }

    const tournament = await Tournament.findOneAndUpdate(
      { _id: tournamentId, status: { $in: ['open', 'upcoming', 'active'] }, $expr: { $lt: ['$successfulEntries', '$maxTeams'] } },
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
        displayName: req.user?.username || 'Participant',
      });
      const financials = tournament.format === 'single-match'
        ? { totalCollection: tournament.entryFee * tournament.successfulEntries, prizePool: 0, retainedAmount: 0, clutchZoneFee: 0, hostShare: 0 }
        : calculateFinancials(tournament.entryFee, tournament.successfulEntries);
      await Tournament.updateOne(
        { _id: tournament._id },
        {
          $addToSet: { 'stages.$[].matches.$[].participants': participant._id },
          $set: financials,
        },
      );
    } catch (error) {
      await Tournament.findByIdAndUpdate(tournament._id, { $inc: { successfulEntries: -1 } });
      await User.findByIdAndUpdate(req.userId, {
        $inc: { 'wallet.balance': tournament.entryFee },
        $pull: { 'wallet.transactions': { description: `Tournament entry fee: ${tournament.name}`, amount: -tournament.entryFee } },
      });
      if (error.code === 11000) return res.status(409).json({ error: 'You are already registered for this tournament' });
      throw error;
    }

    return res.json({ success: true, message: 'Tournament registration successful', walletBalance: user.wallet.balance });
  } catch (error) {
    console.error('joinTournament error:', error);
    return res.status(500).json({ error: 'Failed to join tournament' });
  }
};

export const createTournamentMatchResult = async (req, res) => {
  try {
    const tournament = await Tournament.findOne({ _id: req.params.tournamentId, createdBy: req.userId });
    if (!tournament) return res.status(404).json({ error: 'Tournament not found' });
    if (tournament.format === 'single-match' && await TournamentMatchResult.exists({ tournamentId: tournament._id })) {
      return res.status(409).json({ error: 'Per-kill tournaments allow only one result.' });
    }
    const stage = tournament.stages.find((item) => item.key === req.body.stageKey);
    const matchTitle = String(req.body.matchTitle || '').trim();
    const resultType = tournament.format === 'single-match' ? 'grand-finale' : (req.body.resultType === 'grand-finale' ? 'grand-finale' : 'normal');
    if (!stage) return res.status(400).json({ error: 'Stage not found' });
    if (!matchTitle) return res.status(400).json({ error: 'Match title is required' });
    if (resultType === 'grand-finale' && stage.key !== 'grand-final' && tournament.format !== 'single-match') return res.status(400).json({ error: 'Grand Finale result belongs only to the Grand Final stage' });

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
    const tournament = await Tournament.findOne(query).populate('stages.matches.participants');
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
    const resultType = tournament.format === 'single-match' ? 'grand-finale' : (req.body.resultType === 'grand-finale' ? 'grand-finale' : 'normal');
    if (matchTitle && resultType === 'grand-finale' && stage.key !== 'grand-final' && tournament.format !== 'single-match') return res.status(400).json({ error: 'Grand Finale result belongs only to the Grand Final stage' });
    const participantMap = new Map(match.participants.map((participant) => [participant._id.toString(), participant]));
    const seen = new Set();
    const normalizedEntries = [];
    for (const entry of entries) {
      if (!participantMap.has(String(entry.participantId))) return res.status(400).json({ error: 'Participant is not assigned to this match' });
      if (seen.has(String(entry.participantId))) return res.status(400).json({ error: 'Duplicate participant in result' });
      seen.add(String(entry.participantId));

      if (tournament.format === 'single-match') {
        const kills = Number(entry.kills || 0);
        const perKillReward = Number(tournament.perKillReward || 0);
        if (!Number.isFinite(kills) || kills < 0) return res.status(400).json({ error: 'Kills must be a valid non-negative number' });
        const money = kills * perKillReward;
        normalizedEntries.push({ participantId: entry.participantId, participantName: participantMap.get(String(entry.participantId)).displayName || 'Participant', kills, money });
        continue;
      }

      const points = Number(entry.points || 0);
      if (!Number.isFinite(points) || points < 0) return res.status(400).json({ error: 'Points must be a valid non-negative number' });
      normalizedEntries.push({ participantId: entry.participantId, participantName: participantMap.get(String(entry.participantId)).displayName || 'Participant', points });
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

  const sortedEntries = [...result.entries].sort((left, right) => right.points - left.points);
  const prizeShares = [0.5, 0.3, 0.2];
  for (let index = 0; index < Math.min(3, sortedEntries.length); index += 1) {
    const entry = sortedEntries[index];
    const participant = await TournamentParticipant.findById(entry.participantId);
    if (!participant) continue;
    await User.findByIdAndUpdate(participant.userId, {
      $inc: { 'wallet.balance': financials.prizePool * prizeShares[index] },
      $push: { 'wallet.transactions': { type: 'match_win', amount: financials.prizePool * prizeShares[index], description: `Tournament ${index + 1}${index === 0 ? 'st' : index === 1 ? 'nd' : 'rd'} place: ${tournament.name}`, timestamp: new Date(), tournamentId: tournament._id } },
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
    const resultType = found.tournament.format === 'single-match' ? 'grand-finale' : (req.body?.resultType === 'grand-finale' ? 'grand-finale' : 'normal');

    let result = await TournamentMatchResult.findOne({ tournamentId: req.params.tournamentId, matchId: req.params.matchId });
    if (!result) {
      result = new TournamentMatchResult({ tournamentId: req.params.tournamentId, matchId: req.params.matchId, stageKey: found.stage.key, status: 'draft' });
    }

    if (result.status === 'published') return res.status(409).json({ error: 'Published results are locked' });

    if (found.tournament.format === 'single-match') {
      const participantMap = new Map(found.match.participants.map((participant) => [participant._id.toString(), participant]));
      const seen = new Set();
      const normalizedEntries = []; 

      for (const entry of submittedEntries) {
        if (!participantMap.has(String(entry.participantId))) return res.status(400).json({ error: 'Participant is not assigned to this match' });
        if (seen.has(String(entry.participantId))) return res.status(400).json({ error: 'Duplicate participant in result' });
        seen.add(String(entry.participantId));

        const kills = Number(entry.kills || 0);
        const perKillReward = Number(found.tournament.perKillReward || 0);
        if (!Number.isFinite(kills) || kills < 0) return res.status(400).json({ error: 'Kills must be a valid non-negative number' });

        const money = kills * perKillReward;
        normalizedEntries.push({
          participantId: entry.participantId,
          participantName: participantMap.get(String(entry.participantId)).displayName || 'Participant',
          kills,
          money,
        });
      }

      if (!normalizedEntries.length) return res.status(400).json({ error: 'Add at least one result before publishing' });
      result.entries = normalizedEntries;
      result.resultType = resultType;
      result.stageKey = found.stage.key;
      if (matchTitle) result.matchTitle = matchTitle;
      if (matchTitle) found.match.name = matchTitle;
      await found.tournament.save();
      await result.save();
    } else {
      if (!result.entries.length) return res.status(400).json({ error: 'Add at least one result before publishing' });
      if (result.resultType === 'grand-finale' && found.stage.key !== 'grand-final') return res.status(400).json({ error: 'Grand Finale result belongs only to the Grand Final stage' });
    }

    result.status = 'published';
    result.publishedBy = req.userId;
    result.publishedAt = new Date();
    await result.save();

    if (found.tournament.format === 'single-match') {
      await distributePerKillPayout(found.tournament, result);
    } else if (result.resultType === 'grand-finale') {
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