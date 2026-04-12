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
  getDashboardStats,
  getAllMatches,
  getAllPayments,
  getAdminLogs,
  verifyPayment,
  rejectPayment,
  rejectPlayerPayment,
  startMatch,
  cancelMatch,
  getAllDisputes,
  resolveDispute,
  adjustUserWallet,
  getAllUsers,
  getAllWithdrawals,
  approveWithdrawal,
  rejectWithdrawal
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

// ============================================================================
// DASHBOARD ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/stats
 * Get dashboard stats (counts, revenue, etc.)
 */
router.get("/stats", authMiddleware, getDashboardStats);

/**
 * GET /api/admin/matches
 * Get all matches with optional filtering by status
 */
router.get("/matches", authMiddleware, getAllMatches);

/**
 * GET /api/admin/payments
 * Get all payment requests and pending verifications
 */
router.get("/payments", authMiddleware, getAllPayments);

/**
 * GET /api/admin/logs
 * Get recent admin activity logs
 */
router.get("/logs", authMiddleware, getAdminLogs);

/**
 * POST /api/admin/matches/:matchId/verify-payment
 * Verify payment for a match
 */
router.post("/matches/:matchId/verify-payment", authMiddleware, verifyPayment);

/**
 * POST /api/admin/matches/:matchId/reject-payment
 * Reject a payment submission
 */
router.post("/matches/:matchId/reject-payment", authMiddleware, rejectPayment);
router.post("/matches/:matchId/reject-payment/:playerId", authMiddleware, rejectPlayerPayment);

/**
 * POST /api/admin/matches/:matchId/start
 * Start a match with room details
 */
router.post("/matches/:matchId/start", authMiddleware, startMatch);

/**
 * POST /api/admin/matches/:matchId/cancel
 * Cancel a match and refund both players
 */
router.post("/matches/:matchId/cancel", authMiddleware, cancelMatch);

/**
 * GET /api/admin/disputes
 * Get all disputes
 */
router.get("/disputes", authMiddleware, getAllDisputes);

/**
 * POST /api/admin/matches/:matchId/resolve-dispute
 * Resolve a dispute
 */
router.post("/matches/:matchId/resolve-dispute", authMiddleware, resolveDispute);

/**
 * POST /api/admin/users/:userId/adjust-wallet
 * Adjust a user's wallet balance
 */
router.post("/users/:userId/adjust-wallet", authMiddleware, adjustUserWallet);

/**
 * GET /api/admin/users
 * Get all users with search and pagination
 */
router.get("/users", authMiddleware, getAllUsers);

/**
 * GET /api/admin/withdrawals
 * Get all withdrawal requests
 */
router.get("/withdrawals", authMiddleware, getAllWithdrawals);

/**
 * POST /api/admin/withdrawals/:withdrawalId/approve
 * Approve a withdrawal request
 */
router.post("/withdrawals/:withdrawalId/approve", authMiddleware, approveWithdrawal);

/**
 * POST /api/admin/withdrawals/:withdrawalId/reject
 * Reject a withdrawal request
 */
router.post("/withdrawals/:withdrawalId/reject", authMiddleware, rejectWithdrawal);

export default router;
