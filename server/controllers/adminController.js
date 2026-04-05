import {
  manualTriggerResolution,
  getCronJobStatus,
  getCronStats,
} from "../utils/cronJobs.js";
import TrustScoreEngine from "../utils/trustScore.js";
import ScreenshotValidator from "../utils/screenshotValidation.js";
import User from "../models/User.js";
import Match from "../models/Match.js";

/**
 * Admin endpoint to manually trigger match timeout resolution
 * Useful for testing, debugging, or forcing resolution
 */
export const triggerTimeoutResolution = async (req, res) => {
  try {
    // Ideally, check if user is admin
    // if (!req.user.isAdmin) return res.status(403).json({ error: "Admin only" });

    const result = await manualTriggerResolution(User);

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

/**
 * Get trust score statistics
 */
export const getTrustStats = async (req, res) => {
  try {
    const trustStats = await TrustScoreEngine.getTrustStats();
    const screenshotStats = await ScreenshotValidator.getScreenshotStats();

    res.status(200).json({
      success: true,
      trust: trustStats,
      screenshots: screenshotStats,
    });
  } catch (error) {
    console.error("getTrustStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: Adjust user's trust score manually
 */
export const adjustTrustScore = async (req, res) => {
  try {
    const { userId, adjustment, reason } = req.body;
    const adminId = req.userId;

    if (!userId || !adjustment || !reason) {
      return res.status(400).json({
        error: "userId, adjustment, and reason are required"
      });
    }

    const result = await TrustScoreEngine.adjustTrustScore(userId, adjustment, reason, adminId);

    res.status(200).json({
      success: true,
      message: "Trust score adjusted",
      data: result
    });
  } catch (error) {
    console.error("adjustTrustScore error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: Ban or unban user
 */
export const toggleUserBan = async (req, res) => {
  try {
    const { userId, ban, reason } = req.body;
    const adminId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (ban) {
      user.isBanned = true;
      user.banReason = reason || "Banned by admin";
      console.log(`[ADMIN-BAN] User ${user.username} banned by admin ${adminId}: ${reason}`);
    } else {
      user.isBanned = false;
      user.banReason = null;
      user.banExpiresAt = null;
      console.log(`[ADMIN-UNBAN] User ${user.username} unbanned by admin ${adminId}`);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${ban ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason
      }
    });
  } catch (error) {
    console.error("toggleUserBan error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get users with low trust scores or suspicious activity
 */
export const getSuspiciousUsers = async (req, res) => {
  try {
    const { limit = 50, minTrustScore = 50 } = req.query;

    const users = await User.find({
      $or: [
        { trustScore: { $lt: minTrustScore } },
        { isBanned: true },
        { 'suspiciousFlags.0': { $exists: true } }
      ]
    })
    .select('username email trustScore isBanned banReason suspiciousFlags matchesPlayed disputesRaised disputesLost')
    .sort({ trustScore: 1, updatedAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("getSuspiciousUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get detailed user profile for admin review
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password') // Exclude password
      .populate('wallet.transactions.matchId', 'entry status');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's recent matches
    const recentMatches = await Match.find({
      players: userId
    })
    .populate('players', 'username')
    .populate('result.winner', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      user,
      recentMatches
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ error: error.message });
  }
};
