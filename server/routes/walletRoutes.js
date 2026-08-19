import express from 'express';
import {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
  getWithdrawalHistory,
  createCashfreeDepositOrder,
  verifyCashfreeDeposit,
  getWalletSummary,
} from '../controllers/walletController.js';
import { authMiddleware, requireVerifiedPhone } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/withdraw', requireVerifiedPhone, requestWithdrawal);
router.get('/balance', getWalletBalance);
router.get('/summary', getWalletSummary);
router.get('/withdrawals', getWithdrawalHistory);
router.post('/deposit/create-order', requireVerifiedPhone, createCashfreeDepositOrder);
router.post('/deposit/verify', requireVerifiedPhone, verifyCashfreeDeposit);
router.post('/cashfree-order', requireVerifiedPhone, createCashfreeDepositOrder);
router.post('/cashfree-verify', requireVerifiedPhone, verifyCashfreeDeposit);
router.get('/transactions', getTransactionHistory);
router.post('/add-balance', addBalance);

export default router;
