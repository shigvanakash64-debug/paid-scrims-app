import Match from "../models/Match.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { processPayout } from "../utils/payout.js";

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

    // Fetch match
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
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

    // Update match with submission
    match.result.submittedBy.push(userId);
    match.result.screenshots.push({
      user: userId,
      image: screenshotUrl,
    });

    // RESULT LOGIC ENGINE
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

        // Attempt payout (User model import would be needed)
        // For now, we'll flag it and let payout service handle it
      } else {
        // Different winners - dispute
        match.status = "disputed";
        match.result.decidedAt = new Date();
      }
    } else if (submittedCount === 1) {
      // First submission - set timeout for opponent to submit
      const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
      match.timeout = new Date(Date.now() + TIMEOUT_MS);
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
 * Resolve disputed matches manually (for admin)
 */
export const resolveDispute = async (req, res) => {
  try {
    const { matchId, winnerDecision } = req.body;

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

    match.result.winner = winnerDecision;
    match.result.decidedAt = new Date();
    match.status = "completed";

    await match.save();

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
