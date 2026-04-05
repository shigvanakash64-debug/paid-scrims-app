import Match from "../models/Match.js";

/**
 * Handle timeout for matches with single submission
 * Should be run periodically (e.g., every minute via cron job)
 * Auto-declares first submitter as winner if opponent doesn't submit within 5 minutes
 */
export const handleMatchTimeouts = async () => {
  try {
    const now = new Date();

    // Find matches that have timed out
    const timedOutMatches = await Match.find({
      timeout: { $lt: now },
      status: { $ne: "completed" },
      "result.submittedBy.1": { $exists: false }, // Only 1 submission
    });

    console.log(`Processing ${timedOutMatches.length} timed out matches`);

    for (const match of timedOutMatches) {
      // Get the user who submitted
      const submittedUser = match.result.submittedBy[0];

      // Auto-declare as winner
      match.result.winner = submittedUser;
      match.result.decidedAt = new Date();
      match.status = "completed";
      match.timeout = null;

      await match.save();
      console.log(`Auto-resolved match ${match._id} - Winner: ${submittedUser}`);
    }

    return {
      processed: timedOutMatches.length,
      timestamp: now,
    };
  } catch (error) {
    console.error("handleMatchTimeouts error:", error);
    throw error;
  }
};

/**
 * Example: Add to server.js to run every minute
 * 
 * import { handleMatchTimeouts } from "./utils/timeoutHandler.js";
 * 
 * // Run timeout handler every 60 seconds
 * setInterval(handleMatchTimeouts, 60 * 1000);
 */
