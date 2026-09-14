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
    return [{ name: 'Per Kill', key: 'single-match', order: 1, time: '', matchCount: 1 }];
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
  const participantName = participant?.displayName || participant?.userName || participant?.username || 'Participant';

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

export const assignTournamentGroups = (participants = [], rng = Math.random) => {
  const groupedParticipants = [...participants].sort(() => {
    const value = typeof rng === 'function' ? rng() : 0.5;
    return value - 0.5;
  });

  const assignments = new Map();
  groupedParticipants.forEach((participant, index) => {
    const participantKey = String(participant?._id || participant?.participantId || participant?.userId || participant?.id || index);
    assignments.set(participantKey, Math.floor(index / 12) + 1);
  });

  return assignments;
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
  hostMessage,
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
  const requiresTime = format === 'single-match';
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
    roomId: roomId ? String(roomId).trim() : '',
    roomPassword: roomPassword ? String(roomPassword).trim() : '',
    estimatedTime: String(estimatedTime).trim(),
    hostMessage: hostMessage ? String(hostMessage).trim() : '',
  };
};

export const createTournament = async (req, res) => {
  try {
    const { name, game = 'Free Fire', format, entryFee, maxTeams, successfulEntries = 0, customStages = [], perKillReward = 0, estimatedDate, estimatedTime, roomId, roomPassword, hostMessage } = req.body;

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
        hostMessage,
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
      hostMessage: normalizedValues.hostMessage,
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

export const updateTournamentMessage = async (req, res) => {
  try {
    const { message } = req.body || {};
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
    if (tournament.format !== 'custom') return res.status(400).json({ error: 'Stages can only be added to custom tournaments' });

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
      .select('name game format entryFee maxTeams successfulEntries prizePool perKillReward stages status createdBy createdAt estimatedDate estimatedTime hostMessage roomId roomPassword')
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
        const financials = tournament.format === 'single-match'
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
      const allParticipants = await TournamentParticipant.find({ tournamentId: tournament._id, status: 'registered' }).sort({ registeredAt: 1 }).lean();
      const assignments = assignTournamentGroups(allParticipants, Math.random);
      const updates = allParticipants.map((entry) => ({
        updateOne: {
          filter: { _id: entry._id },
          update: { $set: { groupNumber: Number(assignments.get(String(entry._id)) || 1) } },
        },
      }));
      if (updates.length) {
        await TournamentParticipant.bulkWrite(updates);
      }
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
      return res.json({ success: true, message: 'Tournament registration successful', walletBalance: user.wallet.balance, userGroup: Number(assignments.get(String(participant._id)) || 1) });
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

    const assignments = assignTournamentGroups(participants, Math.random);
    const groupMap = new Map();
    participants.forEach((participant) => {
      const groupNumber = Number(assignments.get(String(participant._id)) || 1);
      const memberName = participant.displayName || participant.userId?.username || 'Participant';
      const bucket = groupMap.get(groupNumber) || [];
      bucket.push({ _id: participant._id, participantId: participant._id, userId: participant.userId?._id || participant.userId, displayName: memberName, username: participant.userId?.username || memberName });
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

    return res.json({ success: true, groups, userGroup });
  } catch (error) {
    console.error('getTournamentGroups error:', error);
    return res.status(500).json({ error: 'Failed to load groups' });
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
    const finalStageOrder = Math.max(...tournament.stages.map((item) => Number(item.order || 0)), 0);
    const isFinalStage = stage.order === finalStageOrder;
    if (resultType === 'grand-finale' && !isFinalStage && tournament.format !== 'single-match') return res.status(400).json({ error: 'Grand Finale result belongs only to the final stage' });

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
    const finalStageOrder = Math.max(...tournament.stages.map((item) => Number(item.order || 0)), 0);
    const isFinalStage = stage.order === finalStageOrder;
    if (matchTitle && resultType === 'grand-finale' && !isFinalStage && tournament.format !== 'single-match') return res.status(400).json({ error: 'Grand Finale result belongs only to the final stage' });
    const participantMap = new Map(match.participants.map((participant) => [participant._id.toString(), participant]));
    const seen = new Set();
    const normalizedEntries = [];
    for (const entry of entries) {
      if (!participantMap.has(String(entry.participantId))) return res.status(400).json({ error: 'Participant is not assigned to this match' });
      if (seen.has(String(entry.participantId))) return res.status(400).json({ error: 'Duplicate participant in result' });
      seen.add(String(entry.participantId));

      if (tournament.format === 'single-match') {
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