import Tournament from '../models/Tournament.js';

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
  if (format === 'multi-stage') {
    return [
      { name: 'Group Stage', key: 'groups', order: 1, groups: 5, matchesPerGroup: 3, matchCount: 15 },
      { name: 'Quarter Final', key: 'quarter-final', order: 2, matchCount: 3 },
      { name: 'Semi Final', key: 'semi-final', order: 3, matchCount: 3 },
      { name: 'Grand Final', key: 'grand-final', order: 4, matchCount: 1 },
    ];
  }

  if (format === 'single-match') {
    return [{ name: 'Single Match', key: 'single-match', order: 1, matchCount: 1 }];
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

export const createTournament = async (req, res) => {
  try {
    const { name, game = 'Free Fire', format, entryFee, maxTeams, successfulEntries = 0, customStages = [] } = req.body;
    if (!name || !format || entryFee === undefined || maxTeams === undefined) {
      return res.status(400).json({ error: 'Tournament name, format, entry fee and maximum teams are required' });
    }
    if (!['multi-stage', 'single-match', 'custom'].includes(format)) {
      return res.status(400).json({ error: 'Invalid tournament format' });
    }
    if (!['Free Fire', 'BGMI'].includes(game)) {
      return res.status(400).json({ error: 'Invalid game' });
    }

    const numericEntryFee = Number(entryFee);
    const numericMaxTeams = Number(maxTeams);
    const numericSuccessfulEntries = Number(successfulEntries);
    if (!Number.isFinite(numericEntryFee) || numericEntryFee < 0 || !Number.isInteger(numericMaxTeams) || numericMaxTeams < 1 || !Number.isInteger(numericSuccessfulEntries) || numericSuccessfulEntries < 0 || numericSuccessfulEntries > numericMaxTeams) {
      return res.status(400).json({ error: 'Invalid entry fee or maximum teams' });
    }

    const financials = calculateFinancials(numericEntryFee, numericSuccessfulEntries);

    const tournament = await Tournament.create({
      name: name.trim(),
      game,
      format,
      entryFee: numericEntryFee,
      maxTeams: numericMaxTeams,
      successfulEntries: numericSuccessfulEntries,
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
    const normalizedTournaments = tournaments.map((tournament) => ({
      ...tournament,
      ...calculateFinancials(tournament.entryFee, tournament.successfulEntries || 0),
      successfulEntries: tournament.successfulEntries || 0,
    }));
    return res.json({ success: true, tournaments: normalizedTournaments });
  } catch (error) {
    console.error('listMyTournaments error:', error);
    return res.status(500).json({ error: 'Failed to load tournaments' });
  }
};

export const listPublicTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find({ status: { $in: ['upcoming', 'active'] } })
      .select('name game format entryFee maxTeams successfulEntries prizePool stages status createdBy createdAt')
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      tournaments: tournaments.map((tournament) => ({
        ...tournament,
        ...calculateFinancials(tournament.entryFee, tournament.successfulEntries || 0),
        successfulEntries: tournament.successfulEntries || 0,
      })),
    });
  } catch (error) {
    console.error('listPublicTournaments error:', error);
    return res.status(500).json({ error: 'Failed to load public tournaments' });
  }
};