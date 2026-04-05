import cron from "node-cron";
import Match from "../models/Match.js";
import { batchAutoResolveMatches } from "./autoResolveMatch.js";

let cronJobInstance = null;

/**
 * Initialize cron job for match timeout resolution
 * Runs every 1 minute
 * @param {object} userModel - Mongoose User model
 * @param {object} options - Configuration options
 */
export const initializeCronJobs = (userModel, options = {}) => {
  if (cronJobInstance) {
    console.log("[CRON] Cron job already running");
    return;
  }

  const cronExpression = options.cronExpression || "* * * * *"; // Every minute
  const batchSize = options.batchSize || 100; // Process up to 100 matches per run

  cronJobInstance = cron.schedule(cronExpression, async () => {
    try {
      const now = new Date();
      console.log(`\n[CRON] Starting match timeout resolution at ${now.toISOString()}`);

      // Fetch matches that need processing
      // Status: result_pending (first player submitted, waiting for second)
      // OR: ongoing (match started but no results yet)
      // AND: resultDeadline has passed OR is about to pass
      const matchesToProcess = await Match.find({
        status: { $in: ["result_pending", "ongoing", "pending"] },
        resultDeadline: { $exists: true, $lte: now },
        isPaid: false,
      })
        .limit(batchSize)
        .lean();

      if (matchesToProcess.length === 0) {
        console.log(`[CRON] No matches to process`);
        return;
      }

      console.log(`[CRON] Found ${matchesToProcess.length} matches to process`);

      // Batch process matches
      const results = await batchAutoResolveMatches(matchesToProcess, userModel);

      // Summary statistics
      const resolved = results.filter((r) => r.resolved).length;
      const failed = results.filter((r) => r.error).length;
      const skipped = results.filter((r) => !r.resolved && !r.error).length;

      console.log(
        `[CRON] Complete - Resolved: ${resolved}, Failed: ${failed}, Skipped: ${skipped}`
      );

      // Log detailed results
      results.forEach((result) => {
        if (result.resolved) {
          console.log(
            `  ✓ Match ${result.matchId} - ${result.action} (${result.reason})`
          );
        } else if (result.error) {
          console.log(`  ✗ Match ${result.matchId} - ERROR: ${result.error}`);
        }
      });

      console.log("");
    } catch (error) {
      console.error("[CRON ERROR] Timeout resolution error:", error);
    }
  });

  console.log(`[CRON] Initialized - Running every minute`);
};

/**
 * Stop the cron job
 */
export const stopCronJobs = () => {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance = null;
    console.log("[CRON] Stopped");
  }
};

/**
 * Get cron job status
 */
export const getCronJobStatus = () => {
  return {
    active: cronJobInstance !== null,
    instance: cronJobInstance ? "Running" : "Not running",
  };
};

/**
 * Manual trigger for match timeout resolution (for testing)
 * Process all pending matches immediately
 */
export const manualTriggerResolution = async (userModel) => {
  try {
    console.log(`[MANUAL TRIGGER] Starting manual resolution`);

    const now = new Date();

    // Fetch all matches that need processing
    const matchesToProcess = await Match.find({
      status: { $in: ["result_pending", "ongoing", "pending"] },
      resultDeadline: { $exists: true, $lte: now },
      isPaid: false,
    }).lean();

    if (matchesToProcess.length === 0) {
      console.log(`[MANUAL TRIGGER] No matches to process`);
      return {
        success: true,
        processed: 0,
        results: [],
      };
    }

    console.log(`[MANUAL TRIGGER] Processing ${matchesToProcess.length} matches`);

    const results = await batchAutoResolveMatches(matchesToProcess, userModel);

    const resolved = results.filter((r) => r.resolved).length;
    const failed = results.filter((r) => r.error).length;

    return {
      success: true,
      processed: matchesToProcess.length,
      resolved,
      failed,
      results,
    };
  } catch (error) {
    console.error("[MANUAL TRIGGER ERROR]:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Setup cron job statistics endpoint (for monitoring)
 * Returns last execution time and status
 */
export const getCronStats = () => {
  return {
    cronActive: cronJobInstance !== null,
    lastCheck: new Date(),
    expression: "* * * * *",
  };
};
