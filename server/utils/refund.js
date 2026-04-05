import Match from "../models/Match.js";

/**
 * Refund both players in a cancelled match
 * Ensures atomic update to prevent race conditions
 * @param {string} matchId - Match ID
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<object>} - Refund result
 */
export const refundPlayers = async (matchId, userModel) => {
  try {
    // Fetch match
    const match = await Match.findById(matchId);

    if (!match) {
      throw new Error("Match not found");
    }

    // Prevent duplicate refunds with atomic check
    if (match.status === "cancelled" && match.isPaid) {
      throw new Error("Refund already processed for this match");
    }

    const refundAmount = match.entry;
    const players = match.players;

    // Log refund processing
    console.log(
      `[REFUND] Processing refund for match ${matchId}: ${players.length} players × ${refundAmount}`
    );

    // Update match atomically first
    const updatedMatch = await Match.findByIdAndUpdate(
      matchId,
      {
        $set: {
          status: "cancelled",
          isPaid: true,
          "result.decidedAt": new Date(),
        },
      },
      { new: true }
    );

    if (updatedMatch.isPaid !== true) {
      throw new Error("Atomic match update failed");
    }

    // Refund each player
    const refundResults = [];

    for (const playerId of players) {
      try {
        const updatedUser = await userModel.findByIdAndUpdate(
          playerId,
          {
            $inc: { "wallet.balance": refundAmount },
            $push: {
              transactions: {
                type: "refund",
                amount: refundAmount,
                matchId,
                status: "completed",
                createdAt: new Date(),
                reason: "Match cancelled - no submissions",
              },
            },
          },
          { new: true }
        );

        refundResults.push({
          playerId,
          refunded: true,
          newBalance: updatedUser?.wallet?.balance,
        });

        console.log(
          `[REFUND] Player ${playerId} refunded ${refundAmount}. New balance: ${updatedUser?.wallet?.balance}`
        );
      } catch (playerError) {
        console.error(`[REFUND ERROR] Failed to refund player ${playerId}:`, playerError);
        refundResults.push({
          playerId,
          refunded: false,
          error: playerError.message,
        });
      }
    }

    return {
      success: true,
      matchId,
      totalRefunded: players.length,
      refundAmount,
      results: refundResults,
    };
  } catch (error) {
    console.error("[REFUND ERROR] Refund processing failed:", error);
    throw new Error(`Refund failed: ${error.message}`);
  }
};
