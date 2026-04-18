import express from 'express';
import {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
} from '../controllers/walletController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /wallet/withdraw
 * User requests a withdrawal
 */
router.post('/withdraw', requestWithdrawal);

/**
 * GET /wallet/balance
 * Get user's wallet balance and transactions
 */
router.get('/balance', getWalletBalance);

/**
 * GET /wallet/transactions
 * Get user's transaction history
 */
router.get('/transactions', getTransactionHistory);

/**
 * POST /wallet/add-balance
 * Admin or internal endpoint to add balance
 */
router.post('/add-balance', addBalance);

export default router;
