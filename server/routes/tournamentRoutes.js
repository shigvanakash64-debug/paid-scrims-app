import express from 'express';
import { authMiddleware, hostMiddleware, hostOnlyMiddleware } from '../middleware/authMiddleware.js';
import {
	createTournament,
	createTournamentMatchResult,
	getPublicTournamentMatches,
	getTournamentManageView,
	joinTournament,
	listMyTournaments,
	listPublicTournaments,
	publishTournamentMatchResult,
	saveTournamentMatchDraft,
} from '../controllers/tournamentController.js';

const router = express.Router();

router.get('/public', listPublicTournaments);
router.post('/:tournamentId/join', authMiddleware, joinTournament);
router.get('/:tournamentId/public-matches', getPublicTournamentMatches);
router.get('/', authMiddleware, hostOnlyMiddleware, listMyTournaments);
router.post('/', authMiddleware, hostOnlyMiddleware, createTournament);
router.post('/:tournamentId/results', authMiddleware, hostOnlyMiddleware, createTournamentMatchResult);
router.get('/:tournamentId/manage', authMiddleware, hostMiddleware, getTournamentManageView);
router.put('/:tournamentId/matches/:matchId/result', authMiddleware, hostMiddleware, saveTournamentMatchDraft);
router.post('/:tournamentId/matches/:matchId/result/publish', authMiddleware, hostMiddleware, publishTournamentMatchResult);

export default router;