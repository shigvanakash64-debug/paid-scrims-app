import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as brResultController from '../controllers/brResultController.js';

const router = express.Router();

/**
 * SUBMIT MATCH RESULT (User submits their kill count)
 * POST /api/br-result/:matchId/submit
 * Auth: Required (user)
 * Body: { kills: number }
 */
router.post('/:matchId/submit', authMiddleware, brResultController.submitMatchResult);

/**
 * GET USER'S MATCH RESULT
 * GET /api/br-result/:matchId/my-result
 * Auth: Required (user)
 */
router.get('/:matchId/my-result', authMiddleware, brResultController.getUserMatchResult);

/**
 * GET ALL RESULTS FOR A MATCH (Admin only)
 * GET /api/br-result/:matchId/results
 * Auth: Required (admin)
 */
router.get('/:matchId/results', authMiddleware, brResultController.getMatchResults);

/**
 * GET USER'S KILLS FOR A MATCH
 * GET /api/br-result/:matchId/user/:userId
 * Public endpoint (no auth required for public leaderboards)
 */
router.get('/:matchId/user/:userId', brResultController.getUserKillsForMatch);

export default router;
