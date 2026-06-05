import express from 'express';
import {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
  createDepositOrder,
  confirmDeposit,
  submitDepositRequest,
  getDepositHistory,
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
 * POST /wallet/deposit-order
 * Create a Razorpay order for wallet deposit
 */
router.post('/deposit-request', submitDepositRequest);
router.get('/deposits', getDepositHistory);
router.post('/deposit-order', createDepositOrder);

/**
 * POST /wallet/confirm-deposit
 * Confirm Razorpay payment and update wallet balance
 */
router.post('/confirm-deposit', confirmDeposit);

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
