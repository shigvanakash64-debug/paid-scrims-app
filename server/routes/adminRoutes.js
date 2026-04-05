import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  triggerTimeoutResolution,
  checkCronStatus,
  getTimeoutStats,
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

export default router;
