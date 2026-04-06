import Match from "../models/Match.js";

/**
 * Calculate platform commission based on entry fee tiers
 * @param {number} entryFee - The entry fee amount
 * @returns {number} - The commission amount
 */
const calculateCommission = (entryFee) => {
  if (entryFee <= 30) return entryFee * (1 / 3);
  if (entryFee <= 50) return entryFee * 0.4;
  return entryFee * 0.3;
};

/**
 * Process payout for match winner
 * - Prevents duplicate payouts with atomic update using isPaid flag
 * - Assumes User model has wallet property
 * - Calculates platform fee based on tiered commission structure
 * @param {string} matchId - Match ID
 * @param {string} winnerId - Winner user ID
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<object>} - Payout result
 */
export const processPayout = async (matchId, winnerId, userModel) => {
  try {
    // Fetch match with specific conditions
    const match = await Match.findById(matchId);

    if (!match) {
      throw new Error("Match not found");
    }

    // Prevent duplicate payouts - check isPaid flag (CRITICAL)
    if (match.isPaid) {
      throw new Error("Payout already processed for this match");
    }

    // Also check paidOut flag for backwards compatibility
    if (match.result.paidOut) {
      throw new Error("Payout already processed (result.paidOut flag set)");
    }

    // Verify winner is in the match
    const winnerInMatch = match.players.some(
      (p) => p.toString() === winnerId.toString()
    );

    if (!winnerInMatch) {
      throw new Error("Winner must be a participant in the match");
    }

    // Calculate payout
    const totalPool = match.entry * match.players.length;
    const platformFee = calculateCommission(match.entry);
    const winnerAmount = totalPool - platformFee;

    console.log(`[PAYOUT] Processing payout for match ${matchId}. Winner: ${winnerId}, Amount: ${winnerAmount}`);

    // Update match atomically BEFORE wallet update - Both flags must be set
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          isPaid: true, // PRIMARY safety flag
          "result.paidOut": true, // SECONDARY safety flag
          "result.winner": winnerId,
          "result.decidedAt": new Date(),
          status: "completed",
        },
      },
      { new: true }
    );

    if (!updatedMatch.isPaid || !updatedMatch.result.paidOut) {
      throw new Error("Atomic match update failed - safety flags not set");
    }

    // Credit winner wallet
    const updatedUser = await userModel.findByIdAndUpdate(
      winnerId,
      {
        $inc: { "wallet.balance": winnerAmount },
        $push: {
          transactions: {
            type: "payout",
            amount: winnerAmount,
            matchId,
            status: "completed",
            createdAt: new Date(),
          },
        },
      },
      { new: true }
    );

    console.log(`[PAYOUT] Successfully paid ${winnerId} ${winnerAmount}. New balance: ${updatedUser?.wallet?.balance}`);

    return {
      success: true,
      matchId,
      winner: winnerId,
      totalPool,
      fee: platformFee,
      winnerAmount,
      updatedBalance: updatedUser.wallet?.balance,
    };
  } catch (error) {
    throw new Error(`Payout processing failed: ${error.message}`);
  }
};
