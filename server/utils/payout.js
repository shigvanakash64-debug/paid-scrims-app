import Match from "../models/Match.js";

/**
 * Process payout for match winner
 * - Prevents duplicate payouts with atomic update
 * - Assumes User model has wallet property
 * - Calculates platform fee (10%)
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

    // Prevent duplicate payouts - atomic check
    if (match.result.paidOut) {
      throw new Error("Payout already processed for this match");
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
    const platformFee = totalPool * 0.1; // 10% fee
    const winnerAmount = totalPool - platformFee;

    // Update match atomically before wallet update
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          "result.paidOut": true,
          "result.winner": winnerId,
          "result.decidedAt": new Date(),
          status: "completed",
        },
      },
      { new: true }
    );

    if (!updatedMatch.result.paidOut) {
      throw new Error("Atomic match update failed");
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
