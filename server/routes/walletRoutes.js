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
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);

router.post('/withdraw', requestWithdrawal);
router.get('/balance', getWalletBalance);
router.get('/summary', getWalletSummary);
router.get('/withdrawals', getWithdrawalHistory);
router.post('/deposit/create-order', createCashfreeDepositOrder);
router.post('/deposit/verify', verifyCashfreeDeposit);
router.post('/cashfree-order', createCashfreeDepositOrder);
router.post('/cashfree-verify', verifyCashfreeDeposit);
router.get('/transactions', getTransactionHistory);
router.post('/add-balance', addBalance);

export default router;
