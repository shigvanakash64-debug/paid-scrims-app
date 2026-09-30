import express from 'express';
import { authMiddleware, hostMiddleware, hostOnlyMiddleware } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
	addTournamentStage,
	createTournament,
	createTournamentMatchResult,
	deleteTournament,
	getPublicTournamentMatches,
	getMyTeamTournamentMatches,
	getTournamentGroups,
	getTournamentManageView,
	generateTeamTournamentBracket,
	resolveTeamTournamentDispute,
	joinTournament,
	listMyTournaments,
	listPublicTournaments,
	publishTournamentMatchResult,
	saveTournamentMatchDraft,
	updateTournamentMessage,
	submitTeamTournamentResult,
} from '../controllers/tournamentController.js';

const router = express.Router();

router.get('/public', listPublicTournaments);
router.post('/:tournamentId/join', authMiddleware, joinTournament);
router.get('/:tournamentId/public-matches', getPublicTournamentMatches);
router.get('/:tournamentId/groups', authMiddleware, getTournamentGroups);
router.get('/:tournamentId/team-matches', authMiddleware, getMyTeamTournamentMatches);
router.post('/:tournamentId/team-matches/:matchId/result', authMiddleware, upload.single('screenshot'), submitTeamTournamentResult);
router.patch('/:tournamentId/team-matches/:matchId/resolve', authMiddleware, hostMiddleware, resolveTeamTournamentDispute);
router.get('/', authMiddleware, hostOnlyMiddleware, listMyTournaments);
router.post('/', authMiddleware, hostOnlyMiddleware, createTournament);
router.post('/:tournamentId/stages', authMiddleware, hostOnlyMiddleware, addTournamentStage);
router.post('/:tournamentId/team-bracket', authMiddleware, hostOnlyMiddleware, generateTeamTournamentBracket);
router.put('/:tournamentId/message', authMiddleware, hostOnlyMiddleware, updateTournamentMessage);
router.delete('/:tournamentId', authMiddleware, hostOnlyMiddleware, deleteTournament);
router.post('/:tournamentId/results', authMiddleware, hostOnlyMiddleware, createTournamentMatchResult);
router.get('/:tournamentId/manage', authMiddleware, hostMiddleware, getTournamentManageView);
router.put('/:tournamentId/matches/:matchId/result', authMiddleware, hostMiddleware, saveTournamentMatchDraft);
router.post('/:tournamentId/matches/:matchId/result/publish', authMiddleware, hostMiddleware, publishTournamentMatchResult);

export default router;