import Match from "../models/Match.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { processPayout } from "../utils/payout.js";
import TrustScoreEngine from "../utils/trustScore.js";
import ScreenshotValidator from "../utils/screenshotValidation.js";
import {
  sendNotification,
  sendBroadcastNotification,
  sendMatchEventNotification,
  updateLastActivity,
} from "../services/notificationService.js";
import { creditCashback, creditWelcomeBonus, creditReferralCommission, markCompletedPaidMatch, updateReferralStatus } from "../utils/rewardService.js";

const PAYMENT_UPIS = [
  '8261047808@fam',
  '8261047808@mbk',
];
const RESULT_DEADLINE_MS = 5 * 60 * 1000;
const pendingMatchCreations = new Set();

const getNextPaymentUpi = async () => {
  const lastMatch = await Match.findOne({ paymentUpi: { $exists: true, $ne: null } })
    .sort({ createdAt: -1 })
    .select('paymentUpi')
    .lean();

  if (!lastMatch || !lastMatch.paymentUpi) {
    return PAYMENT_UPIS[0];
  }

  const lastIndex = PAYMENT_UPIS.indexOf(lastMatch.paymentUpi);
  const nextIndex = lastIndex === -1 ? 0 : (lastIndex + 1) % PAYMENT_UPIS.length;
  return PAYMENT_UPIS[nextIndex];
};

/**
 * Submit result with screenshot for a match
 * Validates participant, uploads screenshot, implements result logic
 */
export const submitResult = async (req, res) => {
  try {
    const { matchId, winner } = req.body;
    const userId = req.userId; // From authMiddleware

    // Validate required fields
    if (!matchId || !winner) {
      return res
        .status(400)
        .json({ error: "matchId and winner are required" });
    }

    if (winner !== 'win' && winner !== 'lose') {
      return res.status(400).json({ error: 'Winner must be "win" or "lose"' });
    }

    if (winner === 'win' && !req.file) {
      return res.status(400).json({ error: "Screenshot is required when you choose I WON" });
    }

    // Fetch match and user
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Result submissions are only allowed after the match has started and both players are in play.
    const allowedResultStatuses = ['ongoing', 'result_pending', 'disputed'];
    if (!allowedResultStatuses.includes(match.status)) {
      return res.status(400).json({
        error: 'Result submission opens only after the match becomes ongoing. Please wait until the match starts.',
      });
    }

    // Validate user is a participant
    const isParticipant = match.players.some(
      (p) => p.toString() === userId.toString()
    );

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "Only match participants can submit results" });
    }

    // Prevent duplicate submissions by same user
    const alreadySubmitted = match.result.submittedBy.some(
      (p) => p.toString() === userId.toString()
    );

    if (alreadySubmitted) {
      return res
        .status(400)
        .json({ error: "You have already submitted a result for this match" });
    }

    const opponentId = match.players.find((p) => p.toString() !== userId.toString());

    let screenshotUrl = null;
    if (req.file) {
      // Validate screenshot
      const validation = await ScreenshotValidator.validateScreenshot(
        req.file.buffer,
        userId,
        matchId
      );

      if (!validation.valid) {
        return res.status(400).json({ error: validation.reason });
      }

      // Upload screenshot to Cloudinary
      try {
        screenshotUrl = await uploadToCloudinary(
          req.file.buffer,
          req.file.originalname
        );
      } catch (uploadError) {
        return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
      }

      // Add screenshot hash to prevent duplicates
      match.addScreenshotHash(validation.hash);

      match.result.screenshots.push({
        user: userId,
        image: screenshotUrl,
        uploadedAt: validation.metadata.uploadedAt,
        metadata: {
          fileSize: validation.metadata.fileSize,
          mimeType: validation.metadata.mimeType,
          dimensions: await ScreenshotValidator.getImageDimensions(req.file.buffer)
        }
      });
    }

    // Set result deadline if not already set (5 minutes from first result submission)
    if (!match.resultDeadline) {
      match.resultDeadline = new Date(Date.now() + RESULT_DEADLINE_MS);
    }

    // Update match with submission
    match.result.submittedBy.push(userId);

    if (!opponentId) {
      return res.status(400).json({ error: 'This match does not have an opponent to review.' });
    }

    const selectedWinner = winner === 'win' ? userId : opponentId;
    match.result.submissionClaims = match.result.submissionClaims || [];

    match.result.submissionClaims.push({
      user: userId,
      claimedWinner: selectedWinner,
      outcome: winner,
      submittedAt: new Date(),
    });

    const submittedCount = match.result.submittedBy.length;
    const totalPlayers = match.players.length;
    let payoutInfo = null;

    if (submittedCount === totalPlayers) {
      const claims = match.result.submissionClaims || [];
      const uniqueClaimedWinners = [...new Set(claims.map((claim) => claim.claimedWinner.toString()))];

      if (uniqueClaimedWinners.length === 1) {
        const confirmedWinnerId = claims[0].claimedWinner;
        match.result.winner = confirmedWinnerId;
        match.result.decidedAt = new Date();
        match.completedAt = new Date();
        match.status = 'completed';

        await TrustScoreEngine.onValidMatchCompletion(userId);
        if (opponentId) {
          await TrustScoreEngine.onValidMatchCompletion(opponentId);
        }

        await TrustScoreEngine.onBothAgreeResult(userId);
        if (opponentId) {
          await TrustScoreEngine.onBothAgreeResult(opponentId);
        }

        await match.save();
        try {
          payoutInfo = await processPayout(match._id, confirmedWinnerId, User);
          const feeAmount = Number(payoutInfo?.fee || 0);
          const perPlayerPlatformFee = feeAmount / Math.max(1, match.players.length);
          if (feeAmount > 0) {
            for (const participantId of match.players) {
              const participant = await User.findById(participantId);
              if (!participant) continue;
              participant.wallet.totalPlatformFeesCollected = (participant.wallet?.totalPlatformFeesCollected || 0) + perPlayerPlatformFee;
              await participant.save();
            }
          }
          for (const participantId of match.players) {
            const participant = await User.findById(participantId);
            if (!participant) continue;
            await creditCashback({ userId: participant._id, matchEntryFee: match.entry, matchId: match._id });
            await creditWelcomeBonus({ userId: participant._id, matchId: match._id });
            await markCompletedPaidMatch(participant._id);
            await updateReferralStatus({ referredUserId: participant._id, status: 'active', matchId: match._id });
            await creditReferralCommission({ referredUserId: participant._id, platformFee: perPlayerPlatformFee, matchId: match._id });
          }
        } catch (payoutError) {
          console.error('PAYOUT ERROR:', payoutError.message);
        }

        const loserId = match.players.find((p) => p.toString() !== confirmedWinnerId.toString());
        if (confirmedWinnerId) {
          await User.findByIdAndUpdate(confirmedWinnerId, {
            $push: {
              notifications: {
                type: 'success',
                message: `You won match #${match._id} and earned ₹${payoutInfo?.winnerAmount ?? 0}!`,
                link: `/match/${match._id}`,
                relatedMatch: match._id,
              },
            },
          });
        }
        if (loserId) {
          await User.findByIdAndUpdate(loserId, {
            $push: {
              notifications: {
                type: 'info',
                message: `Match #${match._id} is complete. Better luck next time!`,
                link: `/match/${match._id}`,
                relatedMatch: match._id,
              },
            },
          });
        }
      } else {
        match.status = 'disputed';
        match.result.decidedAt = new Date();
        match.disputes = match.disputes || [];
        if (!match.disputes.some((dispute) => dispute.reason === 'wrong_result' && dispute.status === 'pending')) {
          match.disputes.push({
            raisedBy: userId,
            reason: 'wrong_result',
            description: 'Both players submitted different winner claims. Admin review is required before any payout is released.',
            status: 'pending',
            createdAt: new Date(),
          });
        }
        match.adminMessages.push({
          sender: 'system',
          text: 'Both players submitted different winner claims. The match has been moved to dispute for admin review.',
        });

        await TrustScoreEngine.onConflictSubmission(userId);
        if (opponentId) {
          await TrustScoreEngine.onConflictSubmission(opponentId);
        }
      }
    } else if (submittedCount === 1) {
      match.status = 'result_pending';
    }

    if (!payoutInfo) {
      await match.save();
    }

    res.status(200).json({
      success: true,
      message: "Result submitted successfully",
      matchStatus: match.status,
      submittedCount,
      totalPlayers,
      matchId,
      screenshotUrl,
      payoutInfo,
    });
  } catch (error) {
    console.error("submitResult error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const approveResult = async (req, res) => {
  try {
    const { matchId, winnerId } = req.body;
    const adminId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId).populate('players', 'username');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'result_pending' && match.status !== 'disputed') {
      return res.status(400).json({ error: 'Match is not pending result approval' });
    }

    const normalizedWinnerId = winnerId?.id?.toString?.() || winnerId?.toString?.();
    const winner = normalizedWinnerId
      ? match.players.find((player) =>
          player._id?.toString() === normalizedWinnerId ||
          player.toString() === normalizedWinnerId ||
          player.id?.toString() === normalizedWinnerId
        )
      : match.result.winner
        ? match.players.find((player) => player._id?.toString() === match.result.winner.toString() || player.toString() === match.result.winner.toString() || player.id?.toString() === match.result.winner.toString())
        : null;

    if (!winner) {
      return res.status(400).json({ error: 'Winner could not be determined' });
    }

    match.result.winner = winner._id;
    match.completedAt = new Date();

    await match.save();

    const payoutInfo = await processPayout(matchId, winner._id, User);
    const perPlayerPlatformFee = Number(payoutInfo?.fee || 0) / Math.max(1, match.players.length);

    for (const player of match.players) {
      await creditReferralCommission({ referredUserId: player._id, platformFee: perPlayerPlatformFee, matchId });
    }

    const loser = match.players.find((player) => player._id.toString() !== winner._id.toString());
    await User.findByIdAndUpdate(winner._id, {
      $push: {
        notifications: {
          type: 'success',
          message: `Admin approved your win for match #${match._id}. ₹${payoutInfo.winnerAmount} has been added to your balance.`,
          link: `/match/${match._id}`,
          relatedMatch: match._id,
        },
      },
    });
    if (loser) {
      await User.findByIdAndUpdate(loser._id, {
        $push: {
          notifications: {
            type: 'info',
            message: `Match #${match._id} has been approved by admin. Better luck next time.`,
            link: `/match/${match._id}`,
            relatedMatch: match._id,
          },
        },
      });
    }

    res.status(200).json({
      success: true,
      message: 'Result approved and payout processed',
      payoutInfo,
      matchId,
    });
  } catch (error) {
    console.error('approveResult error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const rejectResult = async (req, res) => {
  try {
    const { matchId } = req.body;
    const adminId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId).populate('players', 'username');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'result_pending' && match.status !== 'disputed') {
      return res.status(400).json({ error: 'Match is not pending result approval or already disputed' });
    }

    if (match.status !== 'disputed') {
      match.status = 'disputed';
      await match.save();

      for (const player of match.players) {
        await User.findByIdAndUpdate(player._id, {
          $push: {
            notifications: {
              type: 'warning',
              message: `Result for match #${match._id} was rejected by admin and moved to dispute.`,
              link: `/match/${match._id}`,
              relatedMatch: match._id,
            },
          },
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Result rejected and match moved to dispute',
      matchId,
    });
  } catch (error) {
    console.error('rejectResult error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Get match details with result
 */
const serializeMatch = (match) => {
  const record = match.toObject ? match.toObject() : match;
  return {
    id: record._id.toString(),
    creator: record.creator ? {
      id: record.creator._id?.toString() || record.creator.toString(),
      username: record.creator.username || record.creator
    } : null,
    players: (record.players || []).map((player) => {
      if (typeof player === 'string' || player instanceof String) {
        return { id: player.toString(), username: player.toString() };
      }
      return {
        id: player._id.toString(),
        username: player.username,
      };
    }),
    mode: record.mode,
    type: record.type,
    entry: record.entry,
    prizePool: record.prizePool,
    status: record.status,
    skillSetting: record.skillSetting || 'Skill On',
    paidUsers: (record.paidUsers || []).map((u) => u.toString()),
    verifiedUsers: (record.verifiedUsers || []).map((u) => u.toString()),
    paymentDueAt: record.paymentDueAt,
    resultDeadline: record.resultDeadline || null,
    startedAt: record.startedAt || null,
    paymentUpi: record.paymentUpi || null,
    roomDetails: record.roomDetails || null,
    paymentScreenshots: (record.paymentScreenshots || []).map((item) => ({
      user: item.user
        ? typeof item.user === 'object'
          ? {
              id: item.user._id?.toString() || item.user.toString(),
              username: item.user.username || item.user._id?.toString?.() || item.user.toString(),
            }
          : { id: item.user.toString(), username: item.user.toString() }
        : null,
      image: item.image,
      uploadedAt: item.uploadedAt,
    })),
    result: {
      winner: record.result?.winner ? record.result.winner.toString() : null,
      screenshots: (record.result?.screenshots || []).map((item) => ({
        user: item.user
          ? typeof item.user === 'object'
            ? {
                id: item.user._id?.toString() || item.user.toString(),
                username: item.user.username || item.user._id?.toString?.() || item.user.toString(),
              }
            : { id: item.user.toString(), username: item.user.toString() }
          : null,
        image: item.image,
        uploadedAt: item.uploadedAt,
      })),
      decidedAt: record.result?.decidedAt || null,
      paidOut: record.result?.paidOut || false,
    },
    adminMessages: (record.adminMessages || []).map((item) => ({
      id: item._id?.toString() || `${item.sender}-${item.createdAt}`,
      sender: item.sender,
      text: item.text,
      createdAt: item.createdAt,
    })),
    canceledBy: record.canceledBy ? record.canceledBy.toString() : null,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

const cancelExpiredPayments = async () => {
  const now = new Date();
  const expiredMatches = await Match.find({
    status: { $in: ['matched', 'payment_pending'] },
    paymentDueAt: { $lte: now },
  });

  for (const expired of expiredMatches) {
    if ((expired.paidUsers || []).length >= (expired.players || []).length) {
      continue;
    }
    expired.status = 'cancelled';
    expired.adminMessages.push({
      sender: 'system',
      text: 'Match auto-cancelled because payment was not completed in time.',
    });
    await expired.save();
  }
};

export const getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    await cancelExpiredPayments();

    const match = await Match.findById(matchId)
      .populate('creator', 'username')
      .populate('players', 'username')
      .populate('paymentScreenshots.user', 'username')
      .populate('result.screenshots.user', 'username');

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('getMatch error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const createMatch = async (req, res) => {
  try {
    const { mode, type, entry, skillSetting } = req.body;
    const userId = req.userId;

    if (!mode || !type || !entry) {
      return res.status(400).json({ error: 'mode, type and entry are required' });
    }

    if (pendingMatchCreations.has(userId.toString())) {
      return res.status(409).json({ error: 'Match creation already in progress. Please wait a moment.' });
    }

    pendingMatchCreations.add(userId.toString());

    const allowedSkillSettings = ['Skill On', 'Skill Off'];
    const finalSkillSetting = allowedSkillSettings.includes(skillSetting) ? skillSetting : 'Skill On';

    const parsedEntry = Number(entry);
    if (!parsedEntry || parsedEntry <= 0) {
      return res.status(400).json({ error: 'Invalid entry fee' });
    }

    // Get user for notifications (don't check balance for creating match)
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prize pool is fixed per entry amount using the official tier table.
    const prizePoolTable = {
      5: 7,
      10: 15,
      20: 35,
      30: 50,
      50: 80,
      100: 170,
      200: 360,
      500: 900,
      1000: 1800,
    };

    let prizePool = prizePoolTable[parsedEntry] ?? null;
    if (!prizePool) {
      const exactMatch = Object.keys(prizePoolTable)
        .map(Number)
        .sort((a, b) => a - b)
        .find((entry) => parsedEntry <= entry);

      prizePool = exactMatch ? prizePoolTable[exactMatch] : 0;
    }

    const match = await Match.create({
      creator: userId,
      players: [userId],
      mode,
      type,
      skillSetting: finalSkillSetting,
      entry: parsedEntry,
      prizePool,
      status: 'waiting',
      paymentDueAt: null,
      adminMessages: [
        {
          sender: 'system',
          text: 'Match request created. Waiting for an opponent to accept.',
        },
      ],
    });

    // Update creator's last activity
    await updateLastActivity(userId);

    // Send broadcast notification to all active users
    const creatorName = user.username || 'Player';
    await sendBroadcastNotification(
      '🔥 New Match Available',
      `${creatorName} created a ${mode} match — join now and compete!`,
      {
        matchId: match._id,
        type: 'success',
        priority: 10,
        data: {
          matchId: match._id.toString(),
          eventType: 'match_created',
          entryFee: parsedEntry,
          mode: mode,
        },
      }
    );

    res.status(201).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('createMatch error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  } finally {
    pendingMatchCreations.delete(userId.toString());
  }
};

export const acceptMatch = async (req, res) => {
  try {
    const { matchId } = req.body;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId)
      .populate('creator', 'username onesignalPlayerId')
      .populate('players', 'username');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status !== 'waiting') {
      return res.status(400).json({ error: 'Match is not available for acceptance' });
    }

    if (match.players.some(p => p._id?.toString() === userId.toString())) {
      return res.status(400).json({ error: 'You already joined this match' });
    }

    const opponent = await User.findById(userId).select('username onesignalPlayerId');
    const opponentUsername = opponent?.username || 'Opponent';

    match.players.push(userId);
    match.paymentUpi = await getNextPaymentUpi();
    match.status = 'payment_pending';
    match.paymentDueAt = new Date(Date.now() + 5 * 60 * 1000);

    match.adminMessages.push({
      sender: 'system',
      text: `🔔 You got an opponent! ${opponentUsername} has joined. Both players must pay from wallet to continue.`,
    });

    await match.save();
    await updateLastActivity(userId);

    const creatorPlayerId = match.creator.onesignalPlayerId;
    if (creatorPlayerId && creatorPlayerId.trim()) {
      await sendNotification(
        [creatorPlayerId],
        '⚡ Player Joined',
        `${opponentUsername} has joined your match. Complete wallet payment to start the match.`,
        {
          url: `https://www.clutchzone.in/match/${match._id}`,
          matchId: match._id,
          type: 'success',
          priority: 10,
          link: `/match/${match._id}`,
          data: {
            eventType: 'player_joined',
            matchId: match._id.toString(),
            opponent: opponentUsername,
          },
        }
      );
    }

    if (match.players.length === parseInt(match.mode.split('v')[0]) * 2) {
      const playerIds = (
        await User.find({
          _id: { $in: match.players },
          onesignalPlayerId: { $exists: true, $ne: null },
        }).select('onesignalPlayerId')
      ).map(u => u.onesignalPlayerId);

      if (playerIds.length > 0) {
        await sendNotification(
          playerIds,
          '🎮 Match Ready',
          'Match is ready and waiting for wallet payments from both players.',
          {
            url: `https://www.clutchzone.in/match/${match._id}`,
            matchId: match._id,
            type: 'success',
            priority: 10,
            data: {
              eventType: 'match_full',
              matchId: match._id.toString(),
            },
          }
        );
      }
    }

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('acceptMatch error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const payMatchWithWallet = async (req, res) => {
  try {
    const { matchId } = req.body;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId).populate('players', 'username onesignalPlayerId');
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!match.players.some((player) => player._id?.toString() === userId.toString())) {
      return res.status(403).json({ error: 'Only match participants can pay for this match' });
    }

    if (['cancelled', 'completed', 'disputed', 'verified'].includes(match.status)) {
      return res.status(400).json({ error: 'Cannot pay for this match' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (match.paidUsers.some((p) => p.toString() === userId.toString())) {
      return res.status(400).json({ error: 'You have already paid for this match' });
    }

    if (user.wallet.balance < match.entry) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        required: match.entry,
        available: user.wallet.balance,
      });
    }

    user.wallet.balance -= match.entry;
    user.wallet.transactions.push({
      type: 'fee',
      amount: -match.entry,
      description: `Match entry fee for ${match.mode} ${match.type}`,
      timestamp: new Date(),
      matchId: match._id,
    });
    await user.save();

    match.paidUsers.push(userId);
    match.adminMessages.push({
      sender: 'system',
      text: `${user.username} has paid ₹${match.entry} from wallet.`,
    });

    const allPlayersPaid = match.players.length > 0 && match.paidUsers.length === match.players.length;
    if (allPlayersPaid) {
      match.status = 'verified';
      match.adminMessages.push({
        sender: 'system',
        text: 'Both players have paid from wallet. Room credentials can now be published.',
      });
    } else {
      match.status = 'payment_pending';
    }

    await match.save();

    const playerIds = match.players
      .filter((player) => player.onesignalPlayerId)
      .map((player) => player.onesignalPlayerId);

    if (playerIds.length > 0) {
      await sendNotification(
        playerIds,
        '💵 Match payment update',
        `${user.username} completed wallet payment for match ${match.mode}. ${allPlayersPaid ? 'Both players have paid.' : 'Waiting for the opponent to pay.'}`,
        {
          type: 'info',
          priority: 9,
          data: {
            eventType: 'match_payment',
            matchId: match._id.toString(),
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      match: serializeMatch(match),
      message: allPlayersPaid
        ? 'Payment completed. Both players have paid and match is ready for room details.'
        : 'Payment completed. Waiting for the opponent to pay.',
    });
  } catch (error) {
    console.error('payMatchWithWallet error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const uploadPaymentProof = async (req, res) => {
  try {
    const { matchId } = req.body;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const userIsParticipant = match.players.some((playerId) => playerId.toString() === userId.toString());
    if (!userIsParticipant) {
      return res.status(403).json({ error: 'Only match participants can upload payment proof' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Payment screenshot is required' });
    }

    if (match.status === 'cancelled' || match.status === 'completed') {
      return res.status(400).json({ error: 'Cannot upload payment proof for this match' });
    }

    let screenshotUrl;
    try {
      screenshotUrl = await uploadToCloudinary(req.file.buffer, req.file.originalname);
    } catch (uploadError) {
      return res.status(500).json({ error: `Upload failed: ${uploadError.message}` });
    }

    if (!match.paidUsers.some((p) => p.toString() === userId.toString())) {
      match.paidUsers.push(userId);
    }

    match.paymentScreenshots.push({
      user: userId,
      image: screenshotUrl,
      uploadedAt: new Date(),
    });

    match.status = 'payment_pending';
    match.adminMessages.push({
      sender: 'user',
      text: 'Paid',
    });

    await match.save();

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('uploadPaymentProof error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const verifyPlayer = async (req, res) => {
  try {
    const { matchId, playerId } = req.body;
    const adminId = req.userId;

    if (!matchId || !playerId) {
      return res.status(400).json({ error: 'matchId and playerId are required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (!match.players.some((player) => player.toString() === playerId.toString())) {
      return res.status(400).json({ error: 'Player is not part of this match' });
    }

    if (match.verifiedUsers.some((player) => player.toString() === playerId.toString())) {
      return res.status(400).json({ error: 'Player is already verified' });
    }

    match.verifiedUsers.push(playerId);
    match.adminMessages.push({
      sender: 'admin',
      text: `Verified player ${playerId}`,
    });

    if (match.verifiedUsers.length === match.players.length) {
      match.status = 'verified';
      match.adminMessages.push({
        sender: 'system',
        text: 'Both players are verified. Admin can now start the match.',
      });
    }

    await match.save();

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('verifyPlayer error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const startMatch = async (req, res) => {
  try {
    const { matchId, roomId, password } = req.body;
    const userId = req.userId;

    if (!matchId || !roomId || !password) {
      return res.status(400).json({ error: 'matchId, roomId, and password are required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    const isCreator = match.creator.toString() === userId.toString();
    if (!isCreator && !req.isAdmin) {
      return res.status(403).json({ error: 'Only the match creator or an admin can publish room credentials' });
    }

    if (match.status !== 'verified') {
      return res.status(400).json({ error: 'Match must be verified before starting' });
    }

    match.roomDetails = {
      roomId,
      password,
      createdAt: new Date(),
    };
    match.status = 'ongoing';
    match.startedAt = new Date();
    match.adminMessages.push({
      sender: 'system',
      text: 'Room created',
    });

    await match.save();

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('startMatch error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const cancelMatch = async (req, res) => {
  try {
    const { matchId } = req.body;
    const userId = req.userId;

    if (!matchId) {
      return res.status(400).json({ error: 'matchId is required' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    if (match.status === 'completed' || match.status === 'cancelled') {
      return res.status(400).json({ error: 'This match cannot be cancelled' });
    }

    const hasBothPaid = (match.paidUsers || []).length >= (match.players || []).length;
    if (!req.isAdmin && hasBothPaid) {
      return res.status(400).json({ error: 'Cancellation is locked after both players have paid.' });
    }

    const isParticipant = match.players.some((player) => player.toString() === userId.toString());
    if (!isParticipant && !req.isAdmin) {
      return res.status(403).json({ error: 'Only participants or admin can cancel the match' });
    }

    const isCreator = match.creator.toString() === userId.toString();

    if (req.isAdmin) {
      // Admin cancellation - fully cancel
      match.status = 'cancelled';
      match.canceledBy = userId;
      match.adminMessages.push({
        sender: 'system',
        text: 'Admin cancelled the match.',
      });
    } else if (isCreator) {
      // Creator cancellation - fully cancel the match request
      match.status = 'cancelled';
      match.canceledBy = userId;
      match.adminMessages.push({
        sender: 'system',
        text: 'Match cancelled by creator.',
      });
    } else {
      // Opponent cancellation - remove opponent, reset match to waiting
      match.players = match.players.filter((player) => player.toString() !== userId.toString());
      match.status = 'waiting';
      match.paymentDueAt = null;
      match.paidUsers = match.paidUsers.filter((user) => user.toString() !== userId.toString());
      match.verifiedUsers = match.verifiedUsers.filter((user) => user.toString() !== userId.toString());
      match.adminMessages.push({
        sender: 'system',
        text: 'Opponent left the match. Looking for new opponent...',
      });
    }

    await match.save();

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('cancelMatch error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const addChatMessage = async (req, res) => {
  try {
    const { matchId, text, sender } = req.body;
    const userId = req.userId;

    if (!matchId || !text || !sender) {
      return res.status(400).json({ error: 'matchId, text, and sender are required' });
    }

    const allowedUserMessages = ['Paid', 'Issue', 'Not received room'];
    const allowedAdminMessages = ['Payment received', 'Room created', 'Match cancelled'];

    if (sender === 'user' && !allowedUserMessages.includes(text)) {
      return res.status(400).json({ error: 'Invalid user message' });
    }

    if (sender === 'admin' && !req.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    if (sender === 'admin' && !allowedAdminMessages.includes(text)) {
      return res.status(400).json({ error: 'Invalid admin message' });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    match.adminMessages.push({ sender, text });
    await match.save();

    res.status(200).json({ match: serializeMatch(match) });
  } catch (error) {
    console.error('addChatMessage error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

export const listMatches = async (req, res) => {
  try {
    const { mode, type, entry } = req.query;
    await cancelExpiredPayments();

    // Exclude matches older than 2 hours
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const query = { status: 'waiting', createdAt: { $gte: twoHoursAgo } };
    if (mode) query.mode = mode;
    if (type) query.type = type;
    if (entry) query.entry = Number(entry);

    const matches = await Match.find(query)
      .populate('creator', 'username trustScore')
      .populate('players', 'username')
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({ matches: matches.map(serializeMatch) });
  } catch (error) {
    console.error('listMatches error:', error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Resolve disputed matches manually (for admin)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { matchId, winnerDecision, disputeId } = req.body;
    const adminId = req.userId; // From authMiddleware

    if (!matchId || !winnerDecision) {
      return res
        .status(400)
        .json({ error: "matchId and winnerDecision are required" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    if (match.status !== "disputed") {
      return res.status(400).json({ error: "Match is not in disputed state" });
    }

    // If disputeId provided, resolve specific dispute
    if (disputeId) {
      await match.resolveDispute(disputeId, adminId, "upheld");
    }

    match.result.winner = winnerDecision;
    match.result.decidedAt = new Date();
    match.status = "completed";
    match.result.paidOut = true; // Mark for payout processing

    await match.save();

    // Update trust scores based on dispute resolution
    const loserId = match.players.find(p => p.toString() !== winnerDecision.toString());
    if (loserId) {
      await TrustScoreEngine.onLoseDispute(loserId);
    }

    res.status(200).json({
      success: true,
      message: "Dispute resolved",
      winner: winnerDecision,
    });
  } catch (error) {
    console.error("resolveDispute error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Raise a dispute for a match
 */
export const raiseDispute = async (req, res) => {
  try {
    const { matchId, reason, description, evidence } = req.body;
    const userId = req.userId;

    if (!matchId || !reason) {
      return res.status(400).json({ error: "matchId and reason are required" });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Validate user is a participant
    const isParticipant = match.players.some(p => p.toString() === userId.toString());
    if (!isParticipant) {
      return res.status(403).json({ error: "Only match participants can raise disputes" });
    }

    // Check if user already raised a dispute for this match
    const existingDispute = match.disputes.find(d =>
      d.raisedBy.toString() === userId.toString() && d.status === "pending"
    );

    if (existingDispute) {
      return res.status(400).json({ error: "You already have a pending dispute for this match" });
    }

    // Raise the dispute
    await match.raiseDispute(userId, reason, description, evidence || []);

    // Update user's dispute count and trust score
    const user = await User.findById(userId);
    if (user) {
      user.disputesRaised += 1;
      await user.save();

      // Check for repeated disputes penalty
      await TrustScoreEngine.onRepeatedDisputes(userId);
    }

    res.status(200).json({
      success: true,
      message: "Dispute raised successfully",
      disputeId: match.disputes[match.disputes.length - 1]._id
    });
  } catch (error) {
    console.error("raiseDispute error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Get disputes for a match
 */
export const getMatchDisputes = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("disputes.raisedBy", "username")
      .populate("disputes.resolvedBy", "username");

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.status(200).json({
      success: true,
      disputes: match.disputes
    });
  } catch (error) {
    console.error("getMatchDisputes error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Admin: Flag screenshot as fake
 */
export const flagScreenshotAsFake = async (req, res) => {
  try {
    const { matchId, userId } = req.body;
    const adminId = req.userId;

    if (!matchId || !userId) {
      return res.status(400).json({ error: "matchId and userId are required" });
    }

    await ScreenshotValidator.flagAsFake(matchId, userId, adminId);

    res.status(200).json({
      success: true,
      message: "Screenshot flagged as fake"
    });
  } catch (error) {
    console.error("flagScreenshotAsFake error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Check if user can join a match (trust score validation)
 */
export const canJoinMatch = async (req, res) => {
  try {
    const { entryFee } = req.body;
    const userId = req.userId;

    if (!entryFee) {
      return res.status(400).json({ error: "entryFee is required" });
    }

    const result = await TrustScoreEngine.canJoinMatch(userId, entryFee);

    res.status(200).json(result);
  } catch (error) {
    console.error("canJoinMatch error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Request a withdrawal from user's wallet
 * Creates a pending withdrawal that requires admin approval
 */
export const requestWithdrawal = async (req, res) => {
  try {
const { amount, upi } = req.body;
  const userId = req.userId;

  if (!upi || typeof upi !== 'string' || !upi.trim()) {
    return res.status(400).json({ error: "UPI ID is required" });
  }

    const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ error: "Minimum withdrawal amount is ₹100" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.wallet.balance < parsedAmount) {
      return res.status(400).json({ error: "Insufficient balance" });
    }

    // Create pending withdrawal
    const withdrawal = {
      amount: parsedAmount,
      upi: upi.trim(),
      status: 'pending',
      requestedAt: new Date()
    };

    user.wallet.pendingWithdrawals.push(withdrawal);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal request submitted successfully. Admin approval required.",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        requestedAt: withdrawal.requestedAt
      }
    });
  } catch (error) {
    console.error("requestWithdrawal error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};
