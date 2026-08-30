import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import * as brMatchController from '../controllers/brMatchController.js';
import * as brParticipantController from '../controllers/brParticipantController.js';

const router = express.Router();

// ========== BR MATCH ROUTES (Admin and Public) ==========

/**
 * CREATE BR MATCH (Admin only)
 * POST /api/br-match/create
 */
router.post('/create', authMiddleware, brMatchController.createBRMatch);

/**
 * LIST ALL BR MATCHES
 * GET /api/br-match/list
 * Query: ?status=OPEN|FULL|CLOSED|COMPLETED
 * NOTE: Must come BEFORE /:matchId route to avoid being caught by parameterized route
 */
router.get('/list', authMiddleware, brMatchController.listBRMatches);

/**
 * GET SINGLE BR MATCH
 * GET /api/br-match/:matchId
 */
router.get('/:matchId', brMatchController.getBRMatch);

/**
 * UPDATE BR MATCH (Admin only)
 * PATCH /api/br-match/:matchId
 */
router.patch('/:matchId', authMiddleware, brMatchController.updateBRMatch);

/**
 * CLOSE BR MATCH (Admin only)
 * POST /api/br-match/:matchId/close
 */
router.post('/:matchId/close', authMiddleware, brMatchController.closeBRMatch);

/**
 * GET BR MATCH PARTICIPANTS (Admin only)
 * GET /api/br-match/:matchId/participants-admin
 */
router.get('/:matchId/participants-admin', authMiddleware, brMatchController.getBRMatchParticipants);

// ========== BR PARTICIPANT ROUTES (User Actions) ==========

/**
 * STEP 1: INITIATE JOIN (Deduct entry fee)
 * POST /api/br-participant/:matchId/join
 */
router.post('/:matchId/join', authMiddleware, brParticipantController.initiateBRJoin);

/**
 * STEP 2: CONFIRM REGISTRATION (Enter in-game name)
 * POST /api/br-participant/:matchId/confirm
 */
router.post('/:matchId/confirm', authMiddleware, brParticipantController.confirmBRRegistration);

/**
 * GET ROOM CREDENTIALS (Only for registered participants)
 * GET /api/br-participant/:matchId/room
 * NOTE: Must come BEFORE /:matchId route to avoid being caught by parameterized route
 */
router.get('/:matchId/room', authMiddleware, brParticipantController.getBRRoomCredentials);

/**
 * CHECK IF USER IS REGISTERED
 * GET /api/br-participant/:matchId/check-registration
 * NOTE: Must come BEFORE /:matchId route to avoid being caught by parameterized route
 */
router.get('/:matchId/check-registration', authMiddleware, brParticipantController.checkBRRegistration);

/**
 * GET PARTICIPANTS FOR A MATCH
 * GET /api/br-participant/:matchId
 */
router.get('/:matchId', authMiddleware, brParticipantController.getBRParticipants);

export default router;
