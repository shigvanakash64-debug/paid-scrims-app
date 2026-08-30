import BRMatchResult from '../models/BRMatchResult.js';
import BRMatch from '../models/BRMatch.js';
import BRParticipant from '../models/BRParticipant.js';

/**
 * Submit match result (user submits their kill count)
 */
export const submitMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { kills } = req.body;

    // Validate kills
    if (kills === undefined || kills === null) {
      return res.status(400).json({ error: 'Kills count is required' });
    }

    if (typeof kills !== 'number' || kills < 0) {
      return res.status(400).json({ error: 'Kills must be a non-negative number' });
    }

    // Check if match exists
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    // Check if user is participant in this match
    const participant = await BRParticipant.findOne({ matchId, userId: req.userId });
    if (!participant) {
      return res.status(403).json({ error: 'You are not a participant in this match' });
    }

    // Check if already submitted result (update if exists)
    let result = await BRMatchResult.findOne({ matchId, userId: req.userId });
    if (result) {
      result.kills = kills;
      result.submittedAt = new Date();
      await result.save();
      return res.json({
        success: true,
        message: 'Result updated successfully',
        result,
      });
    }

    // Create new result
    result = new BRMatchResult({
      matchId,
      userId: req.userId,
      username: req.user.username,
      kills,
    });

    await result.save();

    res.status(201).json({
      success: true,
      message: 'Result submitted successfully',
      result,
    });
  } catch (error) {
    console.error('Error submitting match result:', error);
    res.status(500).json({ error: 'Failed to submit result' });
  }
};

/**
 * Get user's result for a specific match
 */
export const getUserMatchResult = async (req, res) => {
  try {
    const { matchId } = req.params;

    const result = await BRMatchResult.findOne({ matchId, userId: req.userId });

    if (!result) {
      return res.json({ success: true, result: null });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Error fetching user match result:', error);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
};

/**
 * Get all results for a specific match (ADMIN ONLY)
 */
export const getMatchResults = async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { matchId } = req.params;

    // Check if match exists
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    // Get all results for this match
    const results = await BRMatchResult.find({ matchId })
      .sort({ submittedAt: -1 });

    res.json({
      success: true,
      match: {
        _id: match._id,
        matchName: match.matchName,
        scrimType: match.scrimType,
        perKillReward: match.perKillReward,
      },
      results,
      totalSubmissions: results.length,
    });
  } catch (error) {
    console.error('Error fetching match results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
};

/**
 * Get user's submitted kills for a match (public info)
 */
export const getUserKillsForMatch = async (req, res) => {
  try {
    const { matchId, userId } = req.params;

    const result = await BRMatchResult.findOne({ matchId, userId });

    if (!result) {
      return res.json({ success: true, kills: 0, submitted: false });
    }

    res.json({
      success: true,
      kills: result.kills,
      submitted: true,
      submittedAt: result.submittedAt,
    });
  } catch (error) {
    console.error('Error fetching user kills:', error);
    res.status(500).json({ error: 'Failed to fetch kills' });
  }
};
