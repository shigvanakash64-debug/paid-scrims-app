import BRMatch from '../models/BRMatch.js';
import BRParticipant from '../models/BRParticipant.js';
import User from '../models/User.js';

/**
 * Create a new BR match (ADMIN ONLY)
 */
export const createBRMatch = async (req, res) => {
  try {
    // Verify admin
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { matchName, entryFee, scrimType, perKillReward, scheduledDateTime, roomId, roomPassword } =
      req.body;

    // Validate required fields
    if (!matchName || entryFee === undefined || !scrimType || perKillReward === undefined || !scheduledDateTime) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate numeric values
    if (entryFee < 0 || perKillReward < 0) {
      return res.status(400).json({ error: 'Invalid field values' });
    }

    // Validate scheduledDateTime is in the future
    const scheduledDate = new Date(scheduledDateTime);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date/time format' });
    }

    if (scheduledDate <= new Date()) {
      return res.status(400).json({ error: 'Match must be scheduled for a future date/time' });
    }

    const brMatch = new BRMatch({
      matchName,
      entryFee,
      scrimType,
      perKillReward,
      scheduledDateTime: scheduledDate,
      roomId: roomId || '',
      roomPassword: roomPassword || '',
      maxPlayers: 50, // Fixed at 50
      createdBy: req.userId,
      status: 'OPEN',
    });

    await brMatch.save();

    res.status(201).json({
      success: true,
      message: 'BR match created successfully',
      match: brMatch,
    });
  } catch (error) {
    console.error('Error creating BR match:', error);
    res.status(500).json({ error: 'Failed to create BR match' });
  }
};

/**
 * Get a single BR match by ID
 */
export const getBRMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await BRMatch.findById(matchId).populate('createdBy', 'username email');

    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    res.json({
      success: true,
      match,
    });
  } catch (error) {
    console.error('Error fetching BR match:', error);
    res.status(500).json({ error: 'Failed to fetch BR match' });
  }
};

/**
 * List all BR matches (publicly available info)
 * Status, entry fee, current players, etc. visible to all
 * Room ID/password only visible to registered participants
 */
export const listBRMatches = async (req, res) => {
  try {
    const { status } = req.query;

    const filter = {};
    if (status) {
      filter.status = status;
    }

    const matches = await BRMatch.find(filter)
      .populate('createdBy', 'username')
      .sort({ createdAt: -1 });

    // For each match, determine if user is a registered participant
    const userId = req.userId;
    const enrichedMatches = await Promise.all(
      matches.map(async (match) => {
        const matchObj = match.toObject();

        if (userId) {
          const participant = await BRParticipant.findOne({
            userId,
            brMatchId: match._id,
            status: 'registered',
          });

          // Only return room details if user is registered
          if (participant) {
            matchObj.isRegistered = true;
            matchObj.roomId = match.roomId;
            matchObj.roomPassword = match.roomPassword;
            matchObj.inGameName = participant.inGameName;
          } else {
            matchObj.isRegistered = false;
            delete matchObj.roomId;
            delete matchObj.roomPassword;
          }
        } else {
          matchObj.isRegistered = false;
          delete matchObj.roomId;
          delete matchObj.roomPassword;
        }

        return matchObj;
      })
    );

    res.json({
      success: true,
      matches: enrichedMatches,
      count: enrichedMatches.length,
    });
  } catch (error) {
    console.error('Error listing BR matches:', error);
    res.status(500).json({ error: 'Failed to fetch BR matches' });
  }
};

/**
 * Update BR match information (ADMIN ONLY)
 * Admin can update: matchName, scrimType, perKillReward, timerDuration, roomId, roomPassword, status
 */
export const updateBRMatch = async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { matchId } = req.params;
    const { matchName, scrimType, perKillReward, scheduledDateTime, roomId, roomPassword, status } = req.body;

    const match = await BRMatch.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    // Update allowed fields only
    if (matchName) match.matchName = matchName;
    if (scrimType) match.scrimType = scrimType;
    if (perKillReward !== undefined) match.perKillReward = perKillReward;
    if (scheduledDateTime) {
      const scheduledDate = new Date(scheduledDateTime);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({ error: 'Invalid date/time format' });
      }
      match.scheduledDateTime = scheduledDate;
    }
    if (roomId !== undefined) match.roomId = roomId || '';
    if (roomPassword !== undefined) match.roomPassword = roomPassword || '';
    if (status) match.status = status;

    match.updatedAt = new Date();

    await match.save();

    res.json({
      success: true,
      message: 'BR match updated successfully',
      match,
    });
  } catch (error) {
    console.error('Error updating BR match:', error);
    res.status(500).json({ error: 'Failed to update BR match' });
  }
};

/**
 * Close a BR match (ADMIN ONLY)
 * Prevents new joinings and registrations
 */
export const closeBRMatch = async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { matchId } = req.params;

    const match = await BRMatch.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    match.status = 'CLOSED';
    match.updatedAt = new Date();

    await match.save();

    res.json({
      success: true,
      message: 'BR match closed successfully',
      match,
    });
  } catch (error) {
    console.error('Error closing BR match:', error);
    res.status(500).json({ error: 'Failed to close BR match' });
  }
};

/**
 * Get list of participants for a BR match (ADMIN ONLY)
 */
export const getBRMatchParticipants = async (req, res) => {
  try {
    if (!req.isAdmin) {
      return res.status(403).json({ error: 'Unauthorized. Admin access required.' });
    }

    const { matchId } = req.params;

    // Verify match exists
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    const participants = await BRParticipant.find({ brMatchId: matchId, status: 'registered' })
      .populate('userId', 'username email phoneNumber')
      .sort({ slotNumber: 1 });

    res.json({
      success: true,
      participants,
      count: participants.length,
    });
  } catch (error) {
    console.error('Error fetching BR match participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};
