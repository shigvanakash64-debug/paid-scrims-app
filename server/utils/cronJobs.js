import cron from "node-cron";
import Match from "../models/Match.js";
import BRMatch from "../models/BRMatch.js";
import { batchAutoResolveMatches } from "./autoResolveMatch.js";
import { cleanupExpiredUploads } from "./cleanupExpiredUploads.js";
import {
  sendBroadcastNotification,
  sendRetentionNotification,
} from "../services/notificationService.js";

let cronJobInstance = null;
let broadcastNotificationJobInstance = null;
let retentionNotificationJobInstance = null;

const RESULT_DEADLINE_MS = 5 * 60 * 1000;
const MATCH_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const RETENTION_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

const expireUnmatchedWaitingMatches = async () => {
  const cutoff = new Date(Date.now() - MATCH_TIMEOUT_MS);
  const matches = await Match.find({
    status: 'waiting',
    createdAt: { $lt: cutoff },
    players: { $size: 1 },
  });

  for (const match of matches) {
    match.status = 'cancelled';
    match.canceledBy = match.creator;
    match.adminMessages = match.adminMessages || [];
    match.adminMessages.push({
      sender: 'system',
      text: 'Match auto-cancelled because no opponent joined within 2 hours.',
      createdAt: new Date(),
    });
    await match.save();
  }

  return matches.length;
};

const pruneClosedBRMatches = async () => {
  const cutoff = new Date(Date.now() - RETENTION_WINDOW_MS);

  const result = await BRMatch.deleteMany({
    status: { $in: ['CLOSED', 'COMPLETED'] },
    updatedAt: { $lt: cutoff },
  });

  if (result.deletedCount > 0) {
    console.log(`[CRON] Deleted ${result.deletedCount} old BR matches older than 2 days`);
  }

  return result.deletedCount;
};

const pruneClosedMatches = async () => {
  const cutoff = new Date(Date.now() - RETENTION_WINDOW_MS);

  const result = await Match.deleteMany({
    status: { $in: ['completed', 'cancelled', 'disputed'] },
    updatedAt: { $lt: cutoff },
  });

  if (result.deletedCount > 0) {
    console.log(`[CRON] Deleted ${result.deletedCount} old matches older than 2 days`);
  }

  return result.deletedCount;
};

const ensureResultDeadlines = async () => {
  const now = new Date();
  const matches = await Match.find({
    status: 'result_pending',
    resultDeadline: { $exists: false },
  });

  for (const match of matches) {
    const startedAt = match.startedAt || now;
    match.resultDeadline = new Date(startedAt.getTime() + RESULT_DEADLINE_MS);
    await match.save();
  }

  return matches.length;
};

const repairLegacyMatches = async (userModel, batchSize = 100) => {
  const now = new Date();
  const matchesToRepair = await Match.find({
    status: { $in: ['result_pending', 'ongoing'] },
    $or: [
      { resultDeadline: { $exists: true, $lte: now } },
      { result: { $exists: true }, 'result.winner': { $exists: true, $ne: null } },
    ],
  })
    .limit(batchSize)
    .lean();

  if (matchesToRepair.length === 0) {
    return [];
  }

  const results = [];
  for (const match of matchesToRepair) {
    try {
      const result = await batchAutoResolveMatches([match], userModel);
      results.push(...result);
    } catch (error) {
      results.push({ matchId: match._id, error: error.message });
    }
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

  const cronExpression = options.cronExpression || "*/1 * * * *"; // Every 1 minute
  const batchSize = options.batchSize || 100; // Process up to 100 matches per run

  cronJobInstance = cron.schedule(cronExpression, async () => {
    try {
      const now = new Date();
      console.log(`\n[CRON] Starting match timeout resolution at ${now.toISOString()}`);

      const deadlineBackfills = await ensureResultDeadlines();
      if (deadlineBackfills > 0) {
        console.log(`[CRON] Backfilled result deadlines for ${deadlineBackfills} result_pending matches`);
      }

      const cleanupResult = await cleanupExpiredUploads();
      if (cleanupResult.deletedCount > 0) {
        console.log(`[CRON] Removed ${cleanupResult.deletedCount} expired screenshots older than 48 hours`);
      }

      // Waiting matches remain visible until their creator cancels them.

      const prunedBRMatches = await pruneClosedBRMatches();
      if (prunedBRMatches > 0) {
        console.log(`[CRON] Removed ${prunedBRMatches} stale BR matches older than 2 days`);
      }

      const prunedMatches = await pruneClosedMatches();
      if (prunedMatches > 0) {
        console.log(`[CRON] Removed ${prunedMatches} stale matches older than 2 days`);
      }

      const repairedMatches = await repairLegacyMatches(userModel, batchSize);
      if (repairedMatches.length > 0) {
        const repairedCount = repairedMatches.filter((result) => result.resolved).length;
        if (repairedCount > 0) {
          console.log(`[CRON] Repaired ${repairedCount} legacy matches`);
        }
      }

      const matchesToProcess = await Match.find({
        status: 'result_pending',
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

      const results = await batchAutoResolveMatches(matchesToProcess, userModel);

      const resolved = results.filter((r) => r.resolved).length;
      const failed = results.filter((r) => r.error).length;
      const skipped = results.filter((r) => !r.resolved && !r.error).length;

      console.log(
        `[CRON] Complete - Resolved: ${resolved}, Failed: ${failed}, Skipped: ${skipped}`
      );

      results.forEach((result) => {
        if (result.resolved) {
          console.log(`  ✓ Match ${result.matchId} - ${result.action} (${result.reason})`);
        } else if (result.error) {
          console.log(`  ✗ Match ${result.matchId} - ERROR: ${result.error}`);
        }
      });

      console.log("");
    } catch (error) {
      console.error("[CRON ERROR] Timeout resolution error:", error);
    }
  });

  console.log(`[CRON] Initialized - Running every minute for deadline checks and auto-resolution`);
  console.log(`[CRON] Broadcast and retention notifications are disabled by default to reduce backend load`);
};

/**
 * Stop the cron job
 */
export const stopCronJobs = () => {
  if (cronJobInstance) {
    cronJobInstance.stop();
    cronJobInstance = null;
    console.log("[CRON] Main match resolution job stopped");
  }

  if (broadcastNotificationJobInstance) {
    broadcastNotificationJobInstance.stop();
    broadcastNotificationJobInstance = null;
    console.log("[CRON] Broadcast notification job stopped");
  }

  if (retentionNotificationJobInstance) {
    retentionNotificationJobInstance.stop();
    retentionNotificationJobInstance = null;
    console.log("[CRON] Retention notification job stopped");
  }

  console.log("[CRON] All cron jobs stopped");
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

    await ensureResultDeadlines();
    const cleanupResult = await cleanupExpiredUploads();
    const matchesToProcess = await Match.find({
      status: 'result_pending',
      resultDeadline: { $exists: true, $lte: now },
      isPaid: false,
    }).lean();

    if (matchesToProcess.length === 0) {
      console.log(`[MANUAL TRIGGER] No matches to process`);
      return {
        success: true,
        processed: 0,
        cancelled: 0,
        cleanup: cleanupResult,
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
      cancelled: 0,
      cleanup: cleanupResult,
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
