import {
  manualTriggerResolution,
  getCronJobStatus,
  getCronStats,
} from "../utils/cronJobs.js";

/**
 * Admin endpoint to manually trigger match timeout resolution
 * Useful for testing, debugging, or forcing resolution
 */
export const triggerTimeoutResolution = async (req, res) => {
  try {
    // Ideally, check if user is admin
    // if (!req.user.isAdmin) return res.status(403).json({ error: "Admin only" });

    // Need to import User model
    const userModel = req.app.locals.User;

    if (!userModel) {
      return res.status(500).json({
        error: "User model not available. Configure it in server.js",
      });
    }

    const result = await manualTriggerResolution(userModel);

    res.status(200).json({
      success: true,
      message: "Manual timeout resolution triggered",
      data: result,
    });
  } catch (error) {
    console.error("triggerTimeoutResolution error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check cron job status
 */
export const checkCronStatus = async (req, res) => {
  try {
    const status = getCronJobStatus();
    const stats = getCronStats();

    res.status(200).json({
      success: true,
      cron: {
        status,
        stats,
      },
    });
  } catch (error) {
    console.error("checkCronStatus error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get timeout statistics (how many matches are pending)
 */
export const getTimeoutStats = async (req, res) => {
  try {
    const Match = req.app.locals.Match;

    if (!Match) {
      return res.status(500).json({
        error: "Match model not available",
      });
    }

    const now = new Date();

    // Count matches by status
    const stats = {
      result_pending: await Match.countDocuments({
        status: "result_pending",
        resultDeadline: { $exists: true },
      }),
      ongoing: await Match.countDocuments({
        status: "ongoing",
        resultDeadline: { $exists: true },
      }),
      expired: await Match.countDocuments({
        status: { $in: ["result_pending", "ongoing"] },
        resultDeadline: { $exists: true, $lte: now },
      }),
      completed: await Match.countDocuments({
        status: "completed",
      }),
      disputed: await Match.countDocuments({
        status: "disputed",
      }),
      cancelled: await Match.countDocuments({
        status: "cancelled",
      }),
    };

    res.status(200).json({
      success: true,
      timestamp: now,
      stats,
    });
  } catch (error) {
    console.error("getTimeoutStats error:", error);
    res.status(500).json({ error: error.message });
  }
};
