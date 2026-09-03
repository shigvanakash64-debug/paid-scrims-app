import express from 'express';
import { authMiddleware, requireVerifiedPhone } from '../middleware/authMiddleware.js';
import {
  createChallenge,
  getMyChallenges,
  acceptChallenge,
  declineChallenge,
  cancelChallenge,
} from '../controllers/challengeController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', getMyChallenges);
router.post('/', requireVerifiedPhone, createChallenge);
router.post('/:challengeId/accept', requireVerifiedPhone, acceptChallenge);
router.post('/:challengeId/decline', declineChallenge);
router.post('/:challengeId/cancel', cancelChallenge);

export default router;
