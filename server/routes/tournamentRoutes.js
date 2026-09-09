import express from 'express';
import { authMiddleware, hostOnlyMiddleware } from '../middleware/authMiddleware.js';
import { createTournament, joinTournament, listMyTournaments, listPublicTournaments } from '../controllers/tournamentController.js';

const router = express.Router();

router.get('/public', listPublicTournaments);
router.post('/:tournamentId/join', authMiddleware, joinTournament);
router.use(authMiddleware, hostOnlyMiddleware);
router.get('/', listMyTournaments);
router.post('/', createTournament);

export default router;