import express from 'express';
import {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
  submitDepositRequest,
  getDepositUpiDetails,
  getDepositHistory,
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

/**
 * POST /wallet/deposit-request
 * Create a manual UPI deposit request for admin verification
 */
router.post('/deposit-request', submitDepositRequest);
router.get('/deposit-upi', getDepositUpiDetails);
router.get('/deposits', getDepositHistory);
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
