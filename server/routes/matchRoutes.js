import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  submitResult,
  getMatch,
  resolveDispute,
  raiseDispute,
  getMatchDisputes,
  flagScreenshotAsFake,
  canJoinMatch,
} from "../controllers/matchController.js";

const router = express.Router();

/**
 * POST /api/match/submit-result
 * Submit match result with screenshot
 * Middleware: auth → multer upload → controller
 */
router.post(
  "/submit-result",
  authMiddleware,
  upload.single("screenshot"),
  submitResult
);

/**
 * GET /api/match/:matchId
 * Get match details with results
 */
router.get("/:matchId", getMatch);

/**
 * POST /api/match/resolve-dispute
 * Admin endpoint to resolve disputed matches
 */
router.post("/resolve-dispute", authMiddleware, resolveDispute);

/**
 * POST /api/match/raise-dispute
 * Raise a dispute for a match
 */
router.post("/raise-dispute", authMiddleware, raiseDispute);

/**
 * GET /api/match/:matchId/disputes
 * Get disputes for a match
 */
router.get("/:matchId/disputes", getMatchDisputes);

/**
 * POST /api/match/flag-screenshot
 * Admin endpoint to flag screenshot as fake
 */
router.post("/flag-screenshot", authMiddleware, flagScreenshotAsFake);

/**
 * POST /api/match/can-join
 * Check if user can join a match based on trust score
 */
router.post("/can-join", authMiddleware, canJoinMatch);

export default router;
