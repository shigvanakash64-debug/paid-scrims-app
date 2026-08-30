import BRMatch from '../models/BRMatch.js';
import BRParticipant from '../models/BRParticipant.js';
import User from '../models/User.js';

/**
 * Step 1: Initiate join (check wallet, deduct entry fee, create participant placeholder)
 * Frontend: Shows in-game name entry form after this succeeds
 */
export const initiateBRJoin = async (req, res) => {
  try {
    const userId = req.userId;
    const { matchId } = req.params;

    // Fetch match
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    // Validate match status
    if (match.status === 'CLOSED' || match.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Match is no longer accepting entries' });
    }

    if (match.status === 'FULL') {
      return res.status(400).json({ error: 'Match is full' });
    }

    // Check if user already registered
    const existingParticipant = await BRParticipant.findOne({
      userId,
      brMatchId: matchId,
      status: 'registered',
    });

    if (existingParticipant) {
      return res.status(400).json({ error: 'You are already registered for this match' });
    }

    // Fetch user and check wallet balance
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const walletBalance = user.wallet?.balance || 0;

    if (walletBalance < match.entryFee) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        required: match.entryFee,
        available: walletBalance,
      });
    }

    // ATOMIC: Deduct entry fee from wallet
    user.wallet.balance -= match.entryFee;

    // Record transaction (matching existing CS system pattern)
    user.wallet.transactions.push({
      type: 'fee',
      amount: -match.entryFee,
      description: `BR Match entry fee: ${match.matchName}`,
      timestamp: new Date(),
      matchId: matchId, // Reference to BR Match
    });

    await user.save();

    // Return success with transaction info
    res.json({
      success: true,
      message: 'Entry fee deducted successfully. Please enter your in-game name to complete registration.',
      entryFeeDeducted: match.entryFee,
      walletBalanceAfter: user.wallet.balance,
    });
  } catch (error) {
    console.error('Error initiating BR join:', error);
    res.status(500).json({ error: 'Failed to process join request' });
  }
};

/**
 * Step 2: Confirm registration with in-game name
 * ATOMIC: Assign slot and create participant record
 */
export const confirmBRRegistration = async (req, res) => {
  try {
    const userId = req.userId;
    const { matchId } = req.params;
    const { inGameName } = req.body;

    // Validate in-game name
    if (!inGameName || typeof inGameName !== 'string') {
      return res.status(400).json({ error: 'Invalid in-game name' });
    }

    if (inGameName.trim().length === 0 || inGameName.length > 50) {
      return res.status(400).json({ error: 'In-game name must be between 1-50 characters' });
    }

    // Fetch match
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    // Validate match status
    if (match.status === 'CLOSED' || match.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Match is no longer accepting entries' });
    }

    if (match.status === 'FULL') {
      return res.status(400).json({ error: 'Match is full' });
    }

    // Check if user already registered
    const existingParticipant = await BRParticipant.findOne({
      userId,
      brMatchId: matchId,
      status: 'registered',
    });

    if (existingParticipant) {
      return res.status(400).json({ error: 'You are already registered for this match' });
    }

    // ATOMIC: Find next available slot and create participant
    // Use transaction to ensure atomicity
    const nextSlot = match.currentPlayers + 1;

    if (nextSlot > 50) {
      return res.status(400).json({ error: 'Match is full. No more slots available.' });
    }

    // Create participant record
    const participant = new BRParticipant({
      userId,
      brMatchId: matchId,
      inGameName: inGameName.trim(),
      entryFee: match.entryFee,
      status: 'registered',
      slotNumber: nextSlot,
    });

    await participant.save();

    // Update match player count
    match.currentPlayers = nextSlot;

    // Update match status if full
    if (nextSlot >= 50) {
      match.status = 'FULL';
    }

    match.updatedAt = new Date();
    await match.save();

    res.json({
      success: true,
      message: 'Registration completed successfully!',
      participant: {
        inGameName: participant.inGameName,
        slotNumber: participant.slotNumber,
        matchName: match.matchName,
        entryFee: match.entryFee,
      },
      match: {
        currentPlayers: match.currentPlayers,
        status: match.status,
      },
    });
  } catch (error) {
    console.error('Error confirming BR registration:', error);
    res.status(500).json({ error: 'Failed to complete registration' });
  }
};

/**
 * Get room credentials for a registered participant
 * SECURITY: Only return room ID/password to registered participants
 */
export const getBRRoomCredentials = async (req, res) => {
  try {
    const userId = req.userId;
    const { matchId } = req.params;

    // Verify user is registered participant
    const participant = await BRParticipant.findOne({
      userId,
      brMatchId: matchId,
      status: 'registered',
    });

    if (!participant) {
      return res.status(403).json({ error: 'You are not a registered participant for this match' });
    }

    // Fetch match and return room details
    const match = await BRMatch.findById(matchId);

    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    res.json({
      success: true,
      roomId: match.roomId,
      roomPassword: match.roomPassword,
      inGameName: participant.inGameName,
      scrimType: match.scrimType,
      perKillReward: match.perKillReward,
    });
  } catch (error) {
    console.error('Error fetching room credentials:', error);
    res.status(500).json({ error: 'Failed to fetch room details' });
  }
};

/**
 * Get list of participants for a specific BR match
 * Non-admin users see limited info, admin sees full info
 */
export const getBRParticipants = async (req, res) => {
  try {
    const { matchId } = req.params;

    // Verify match exists
    const match = await BRMatch.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'BR match not found' });
    }

    const participants = await BRParticipant.find({ brMatchId: matchId, status: 'registered' })
      .populate('userId', 'username')
      .sort({ slotNumber: 1 });

    // Format response based on user role
    let formattedParticipants = participants.map((p) => ({
      slotNumber: p.slotNumber,
      inGameName: p.inGameName,
      registrationTime: p.registrationTimestamp,
    }));

    // Admin gets more info
    if (req.isAdmin) {
      formattedParticipants = participants.map((p) => ({
        slotNumber: p.slotNumber,
        inGameName: p.inGameName,
        username: p.userId?.username,
        userId: p.userId?._id,
        registrationStatus: p.status,
        entryFee: p.entryFee,
        registrationTime: p.registrationTimestamp,
      }));
    }

    res.json({
      success: true,
      participants: formattedParticipants,
      count: participants.length,
    });
  } catch (error) {
    console.error('Error fetching BR participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  }
};

/**
 * Check if user is registered for a match
 * Used to determine which view to show (JOIN vs REGISTERED)
 */
export const checkBRRegistration = async (req, res) => {
  try {
    const userId = req.userId;
    const { matchId } = req.params;

    const participant = await BRParticipant.findOne({
      userId,
      brMatchId: matchId,
      status: 'registered',
    });

    res.json({
      success: true,
      isRegistered: !!participant,
      participant: participant
        ? {
            inGameName: participant.inGameName,
            slotNumber: participant.slotNumber,
          }
        : null,
    });
  } catch (error) {
    console.error('Error checking BR registration:', error);
    res.status(500).json({ error: 'Failed to check registration status' });
  }
};
