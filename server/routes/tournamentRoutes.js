import express from 'express';
import { authMiddleware, hostOnlyMiddleware } from '../middleware/authMiddleware.js';
import { createTournament, listMyTournaments } from '../controllers/tournamentController.js';

const router = express.Router();

router.use(authMiddleware, hostOnlyMiddleware);
router.get('/', listMyTournaments);
router.post('/', createTournament);

export default router;