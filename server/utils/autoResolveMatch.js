import Match from "../models/Match.js";
import { refundPlayers } from "./refund.js";

/**
 * Auto-resolve match based on submission status and deadline
 * Implements decision logic for timeout scenarios
 * @param {object} match - Match document from MongoDB
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<object>} - Resolution result
 */
export const autoResolveMatch = async (match, userModel) => {
  try {
    const now = new Date();
    const submittedCount = match.result.submittedBy.length;
    const totalPlayers = match.players.length;

    // Skip if already completed or disputed
    if (match.status === "completed" || match.status === "disputed") {
      return {
        resolved: false,
        reason: "Match already completed or disputed",
        matchId: match._id,
      };
    }

    // Skip if no deadline set yet
    if (!match.resultDeadline) {
      return {
        resolved: false,
        reason: "Deadline not set yet",
        matchId: match._id,
      };
    }

    // Check if deadline has passed
    const isDeadlineExpired = now > match.resultDeadline;

    if (isDeadlineExpired) {
      // CASE 1: Both players submitted with same winner
      if (submittedCount === totalPlayers) {
        console.log(`[AUTO-RESOLVE] Match ${match._id}: Both submitted - should already be processed`);
        return {
          resolved: false,
          reason: "Both submitted but status not updated",
          matchId: match._id,
        };
      }

      // CASE 2: Only one player submitted → declare as winner
      if (submittedCount === 1) {
        const winnerId = match.result.submittedBy[0];
        console.log(`[AUTO-RESOLVE] Match ${match._id}: Single submission - Winner: ${winnerId}`);

        const updatedMatch = await Match.findByIdAndUpdate(
          match._id,
          {
            $set: {
              "result.winner": winnerId,
              "result.decidedAt": now,
              status: "completed",
              isPaid: false, // Will be paid by payout service
            },
          },
          { new: true }
        );

        return {
          resolved: true,
          reason: "Single submission - auto-resolved",
          matchId: match._id,
          winner: winnerId,
          action: "declared_winner",
        };
      }

      // CASE 3: No players submitted → refund both players
      if (submittedCount === 0) {
        console.log(`[AUTO-RESOLVE] Match ${match._id}: No submissions - Cancelling and refunding`);

        const refundResult = await refundPlayers(match._id, userModel);

        return {
          resolved: true,
          reason: "No submissions - match cancelled and refunded",
          matchId: match._id,
          action: "cancelled_refunded",
          refundDetails: refundResult,
        };
      }
    } else {
      // Deadline not yet expired
      return {
        resolved: false,
        reason: "Deadline not yet expired",
        matchId: match._id,
        timeUntilDeadline: match.resultDeadline - now,
      };
    }

    return {
      resolved: false,
      reason: "Unknown condition",
      matchId: match._id,
    };
  } catch (error) {
    console.error(`[AUTO-RESOLVE ERROR] Match ${match._id}:`, error);
    throw new Error(`Auto-resolve failed: ${error.message}`);
  }
};

/**
 * Batch process multiple matches for auto-resolution
 * @param {Array} matches - Array of match documents
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<Array>} - Resolution results for each match
 */
export const batchAutoResolveMatches = async (matches, userModel) => {
  const results = [];

  for (const match of matches) {
    try {
      const result = await autoResolveMatch(match, userModel);
      results.push(result);
    } catch (error) {
      console.error(`[BATCH AUTO-RESOLVE ERROR] Match ${match._id}:`, error);
      results.push({
        resolved: false,
        matchId: match._id,
        error: error.message,
      });
    }
  }

  return results;
};
