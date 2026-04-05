import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  submitResult,
  getMatch,
  resolveDispute,
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

export default router;
