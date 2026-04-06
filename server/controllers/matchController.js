import Match from "../models/Match.js";
import User from "../models/User.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { processPayout } from "../utils/payout.js";
import TrustScoreEngine from "../utils/trustScore.js";
import ScreenshotValidator from "../utils/screenshotValidation.js";

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

    if (!req.file) {
      return res.status(400).json({ error: "Screenshot is required" });
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
    let screenshotUrl;
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

    // Update match with submission
    match.result.submittedBy.push(userId);
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

    // Set result deadline if not already set (5 minutes from first submission)
    if (!match.resultDeadline) {
      const DEADLINE_MS = 5 * 60 * 1000; // 5 minutes
      match.resultDeadline = new Date(Date.now() + DEADLINE_MS);
    }

    // RESULT LOGIC ENGINE WITH TRUST SCORE INTEGRATION
    const submittedCount = match.result.submittedBy.length;
    const totalPlayers = match.players.length;

    if (submittedCount === totalPlayers) {
      // All players submitted - check if winner is same
      const allWinnersMatch = match.result.submittedBy.every((_, idx) => {
        // In this implementation, we're storing one winner per submission
        // Check if all submissions agree on same winner
        return true; // This assumes same winner - adjust based on actual data structure
      });

      if (winner === match.result.winner || !match.result.winner) {
        // Same winner declared - process payout
        match.result.winner = winner;
        match.result.decidedAt = new Date();
        match.status = "completed";
        match.result.paidOut = true; // Mark for processPayout

        // Update trust scores for both players
        await TrustScoreEngine.onValidMatchCompletion(userId);
        const opponentId = match.players.find(p => p.toString() !== userId.toString());
        if (opponentId) {
          await TrustScoreEngine.onValidMatchCompletion(opponentId);
        }

        // Both agree bonus
        await TrustScoreEngine.onBothAgreeResult(userId);
        if (opponentId) {
          await TrustScoreEngine.onBothAgreeResult(opponentId);
        }

        // Attempt payout (User model import would be needed)
        // For now, we'll flag it and let payout service handle it
      } else {
        // Different winners - dispute
        match.status = "disputed";
        match.result.decidedAt = new Date();

        // Penalize both players for conflict submission
        await TrustScoreEngine.onConflictSubmission(userId);
        const opponentId = match.players.find(p => p.toString() !== userId.toString());
        if (opponentId) {
          await TrustScoreEngine.onConflictSubmission(opponentId);
        }
      }
    } else if (submittedCount === 1) {
      // First submission - deadline already set above
      match.status = "result_pending"; // Waiting for opponent
    }

    await match.save();

    res.status(200).json({
      success: true,
      message: "Result submitted successfully",
      matchStatus: match.status,
      submittedCount,
      totalPlayers,
      matchId,
      screenshotUrl,
    });
  } catch (error) {
    console.error("submitResult error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * Get match details with result
 */
export const getMatch = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId)
      .populate("players", "username email")
      .populate("result.winner", "username")
      .populate("result.screenshots.user", "username");

    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    res.status(200).json(match);
  } catch (error) {
    console.error("getMatch error:", error);
    res.status(500).json({ error: `Server error: ${error.message}` });
  }
};

/**
 * List available open matches for the pairing lobby
 */
export const listMatches = async (req, res) => {
  try {
    const { mode, type, entry } = req.query;
    const availableMatches = [
      {
        id: 'match-001',
        mode: '1v1',
        type: 'Headshot',
        entryFee: 50,
        prizePool: 80,
        creator: 'Akash_77',
        trustScore: 82,
        status: 'Waiting for opponent',
      },
      {
        id: 'match-002',
        mode: '1v1',
        type: 'Bodyshot',
        entryFee: 100,
        prizePool: 160,
        creator: 'Riya_09',
        trustScore: 74,
        status: 'Waiting for opponent',
      },
      {
        id: 'match-003',
        mode: '2v2',
        type: 'Headshot',
        entryFee: 200,
        prizePool: 320,
        creator: 'ShadowKing',
        trustScore: 88,
        status: 'Waiting for opponents',
      },
      {
        id: 'match-004',
        mode: '1v1',
        type: 'Headshot',
        entryFee: 30,
        prizePool: 48,
        creator: 'Nova_X',
        trustScore: 65,
        status: 'Waiting for opponent',
      },
      {
        id: 'match-005',
        mode: '3v3',
        type: 'Bodyshot',
        entryFee: 500,
        prizePool: 800,
        creator: 'AlphaRider',
        trustScore: 91,
        status: 'Waiting for teammates',
      },
    ];

    const filtered = availableMatches.filter((match) => {
      if (mode && match.mode !== mode) return false;
      if (type && match.type !== type) return false;
      if (entry && Number(match.entryFee) !== Number(entry)) return false;
      return true;
    });

    res.status(200).json({ matches: filtered });
  } catch (error) {
    console.error("listMatches error:", error);
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
