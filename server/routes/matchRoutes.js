import express from "express";
import { authMiddleware, adminMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";
import {
  submitResult,
  getMatch,
  listMatches,
  resolveDispute,
  raiseDispute,
  getMatchDisputes,
  flagScreenshotAsFake,
  canJoinMatch,
  createMatch,
  acceptMatch,
  uploadPaymentProof,
  verifyPlayer,
  startMatch,
  cancelMatch,
  addChatMessage,
  requestWithdrawal,
  approveResult,
  rejectResult,
} from "../controllers/matchController.js";

const router = express.Router();

/**
 * POST /api/match/create
 * Create a new match request
 */
router.post("/create", authMiddleware, createMatch);

/**
 * POST /api/match/accept
 * Accept a waiting match request
 */
router.post("/accept", authMiddleware, acceptMatch);

/**
 * POST /api/match/upload-payment
 * Upload payment screenshot and mark the user as paid
 */
router.post(
  "/upload-payment",
  authMiddleware,
  upload.single("screenshot"),
  uploadPaymentProof
);

/**
 * POST /api/match/verify-player
 * Admin verifies a player's payment proof
 */
router.post("/verify-player", authMiddleware, adminMiddleware, verifyPlayer);

/**
 * POST /api/match/start
 * Creator or admin starts the verified match and publishes room details
 */
router.post("/start", authMiddleware, startMatch);

/**
 * POST /api/match/cancel
 * Cancel a match before it starts
 */
router.post("/cancel", authMiddleware, cancelMatch);

/**
 * POST /api/match/chat
 * Add a controlled chat message for admin or user actions
 */
router.post("/chat", authMiddleware, addChatMessage);

/**
 * POST /api/match/withdraw
 * Request a withdrawal from user's wallet (requires admin approval)
 */
router.post("/withdraw", authMiddleware, requestWithdrawal);

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

router.post("/approve-result", authMiddleware, adminMiddleware, approveResult);
router.post("/reject-result", authMiddleware, adminMiddleware, rejectResult);

/**
 * GET /api/match/list
 * List waiting matches
 */
router.get("/list", listMatches);

/**
 * GET /api/match/:matchId
 * Get match details with results
 */
router.get("/:matchId", getMatch);

/**
 * POST /api/match/resolve-dispute
 * Admin endpoint to resolve disputed matches
 */
router.post("/resolve-dispute", authMiddleware, adminMiddleware, resolveDispute);

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
router.post("/flag-screenshot", authMiddleware, adminMiddleware, flagScreenshotAsFake);

/**
 * POST /api/match/can-join
 * Check if user can join a match based on trust score
 */
router.post("/can-join", authMiddleware, canJoinMatch);

export default router;
