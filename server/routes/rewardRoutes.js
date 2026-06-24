import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getMyReferralDashboard,
  submitReferralCode,
  getRewardSettings,
  updateRewardSettings,
  getRewardAnalytics,
} from '../controllers/rewardController.js';

const router = express.Router();

router.get('/me', authMiddleware, getMyReferralDashboard);
router.post('/apply', authMiddleware, submitReferralCode);
router.get('/settings', authMiddleware, getRewardSettings);
router.put('/settings', authMiddleware, updateRewardSettings);
router.get('/analytics', authMiddleware, getRewardAnalytics);

export default router;
