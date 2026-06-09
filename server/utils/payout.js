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

const getOfficialPrizePool = (entryFee) => {
  const prizePoolTable = {
    30: 50,
    50: 80,
    100: 170,
    200: 360,
    500: 900,
    1000: 1800,
  };

  return prizePoolTable[entryFee] || Object.entries(prizePoolTable)
    .map(([fee, pool]) => [Number(fee), pool])
    .sort((a, b) => a[0] - b[0])
    .find(([fee]) => entryFee <= fee)?.[1] || 0;
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

    const officialPrizePool = getOfficialPrizePool(match.entry);
    const effectivePrizePool = officialPrizePool || Number(match.prizePool || 0) || 0;

    if (match.prizePool !== effectivePrizePool) {
      await Match.findByIdAndUpdate(matchId, {
        $set: { prizePool: effectivePrizePool },
      });
    }

    const winnerAmount = effectivePrizePool;
    const totalPool = effectivePrizePool;
    const platformFee = Math.max(0, totalPool - winnerAmount);

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
          completedAt: new Date(),
          status: "completed",
        },
      },
      { new: true }
    );

    if (!updatedMatch.isPaid || !updatedMatch.result.paidOut) {
      throw new Error("Atomic match update failed - safety flags not set");
    }

    // Credit winner wallet and update player stats
    const updatedUser = await userModel.findByIdAndUpdate(
      winnerId,
      {
        $inc: {
          "wallet.balance": winnerAmount,
          matchesPlayed: 1,
          matchesWon: 1,
        },
        $push: {
          'wallet.transactions': {
            type: 'match_win',
            amount: winnerAmount,
            description: `Match win - ${matchId}`,
            matchId,
            timestamp: new Date(),
          },
        },
      },
      { new: true }
    );

    const loserIds = match.players
      .map((player) => player.toString())
      .filter((playerId) => playerId !== winnerId.toString());

    if (loserIds.length > 0) {
      await userModel.updateMany(
        { _id: { $in: loserIds } },
        { $inc: { matchesPlayed: 1, matchesLost: 1 } }
      );
    }

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
