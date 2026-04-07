import cron from "node-cron";
import Match from "../models/Match.js";
import { batchAutoResolveMatches } from "./autoResolveMatch.js";

let cronJobInstance = null;

const cancelPaymentTimeouts = async () => {
  const now = new Date();
  const matches = await Match.find({
    status: { $in: ['matched', 'payment_pending'] },
    paymentDueAt: { $exists: true, $lte: now },
  });

  const results = [];
  for (const match of matches) {
    if ((match.paidUsers || []).length >= (match.players || []).length) {
      continue;
    }
    match.status = 'cancelled';
    match.adminMessages = match.adminMessages || [];
    match.adminMessages.push({
      sender: 'system',
      text: 'Match auto-cancelled because payment was not completed in time.',
      createdAt: new Date(),
    });
    await match.save();
    results.push({ matchId: match._id.toString(), action: 'cancelled', reason: 'payment timeout' });
  }
  return results;
};

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

          // Handle payment timeouts for matches awaiting proof
          const paymentTimeouts = await cancelPaymentTimeouts();
          if (paymentTimeouts.length > 0) {
            console.log(`[CRON] Cancelled ${paymentTimeouts.length} matches due to payment timeout`);
          }

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

    const paymentTimeouts = await cancelPaymentTimeouts();
    const matchesToProcess = await Match.find({
      status: { $in: ["result_pending", "ongoing", "pending"] },
      resultDeadline: { $exists: true, $lte: now },
      isPaid: false,
    }).lean();

    if (matchesToProcess.length === 0 && paymentTimeouts.length === 0) {
      console.log(`[MANUAL TRIGGER] No matches to process`);
      return {
        success: true,
        processed: 0,
        cancelled: paymentTimeouts.length,
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
      cancelled: paymentTimeouts.length,
      resolved,
      failed,
      results,
      paymentTimeouts,
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
