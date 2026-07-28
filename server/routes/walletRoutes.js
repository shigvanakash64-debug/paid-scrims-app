import express from 'express';
import {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
  getWithdrawalHistory,
} from '../controllers/walletController.js';
import {
  createCashfreeDepositOrder,
  verifyCashfreeDeposit,
} from '../controllers/cashfreeController.js';
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

// Manual deposit endpoints removed: /deposit-request, /deposit-upi, /deposits
router.get('/withdrawals', getWithdrawalHistory);

/**
 * POST /wallet/cashfree-order
 * Create a Cashfree order and return payment session id
 */
router.post('/cashfree-order', createCashfreeDepositOrder);

/**
 * POST /wallet/cashfree-verify
 * Verify the Cashfree payment from the backend
 */
router.post('/cashfree-verify', verifyCashfreeDeposit);

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
