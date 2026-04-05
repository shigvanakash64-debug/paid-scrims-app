import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  triggerTimeoutResolution,
  checkCronStatus,
  getTimeoutStats,
  getTrustStats,
  adjustTrustScore,
  toggleUserBan,
  getSuspiciousUsers,
  getUserProfile,
} from "../controllers/adminController.js";

const router = express.Router();

/**
 * POST /api/admin/trigger-timeout
 * Manually trigger match timeout resolution
 * Requires authentication (should be admin)
 */
router.post("/trigger-timeout", authMiddleware, triggerTimeoutResolution);

/**
 * GET /api/admin/cron-status
 * Check if cron job is running
 */
router.get("/cron-status", checkCronStatus);

/**
 * GET /api/admin/timeout-stats
 * Get statistics on pending matches and timeouts
 */
router.get("/timeout-stats", getTimeoutStats);

/**
 * GET /api/admin/trust-stats
 * Get trust score and anti-cheat statistics
 */
router.get("/trust-stats", authMiddleware, getTrustStats);

/**
 * POST /api/admin/adjust-trust-score
 * Manually adjust a user's trust score
 */
router.post("/adjust-trust-score", authMiddleware, adjustTrustScore);

/**
 * POST /api/admin/toggle-ban
 * Ban or unban a user
 */
router.post("/toggle-ban", authMiddleware, toggleUserBan);

/**
 * GET /api/admin/suspicious-users
 * Get users with low trust scores or suspicious activity
 */
router.get("/suspicious-users", authMiddleware, getSuspiciousUsers);

/**
 * GET /api/admin/user/:userId
 * Get detailed user profile for admin review
 */
router.get("/user/:userId", authMiddleware, getUserProfile);

export default router;
