import Match from "../models/Match.js";

/**
 * Refund both players in a cancelled match
 * Ensures atomic update to prevent race conditions
 * @param {string} matchId - Match ID
 * @param {object} userModel - Mongoose User model
 * @returns {Promise<object>} - Refund result
 */
export const refundPaidUsers = async (matchId, userModel) => {
  try {
    const match = await Match.findById(matchId);

    if (!match) {
      throw new Error('Match not found');
    }

    const paidUsers = (match.paidUsers || []).map((user) => user.toString());
    const refundAmount = Number(match.entry || 0);

    if (!paidUsers.length || refundAmount <= 0) {
      return {
        success: true,
        matchId,
        totalRefunded: 0,
        refundAmount: 0,
        results: [],
      };
    }

    const refundResults = [];

    for (const playerId of paidUsers) {
      try {
        const updatedUser = await userModel.findByIdAndUpdate(
          playerId,
          {
            $inc: { 'wallet.balance': refundAmount },
            $push: {
              transactions: {
                type: 'refund',
                amount: refundAmount,
                matchId,
                status: 'completed',
                createdAt: new Date(),
                reason: 'Match cancelled after single paid-user refund resolution',
              },
            },
          },
          { returnDocument: 'after' }
        );

        refundResults.push({
          playerId,
          refunded: true,
          newBalance: updatedUser?.wallet?.balance,
        });
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
      totalRefunded: refundResults.filter((r) => r.refunded).length,
      refundAmount,
      results: refundResults,
    };
  } catch (error) {
    console.error('[REFUND ERROR] Refund processing failed:', error);
    throw new Error(`Refund failed: ${error.message}`);
  }
};

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
      { returnDocument: 'after' }
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
          { returnDocument: 'after' }
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
