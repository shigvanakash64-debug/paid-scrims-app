import express from 'express';
import { authMiddleware, hostMiddleware } from '../middleware/authMiddleware.js';
import { createGlobalMatchRequest, listGlobalMatchRequests, respondToGlobalMatchRequest } from '../controllers/globalMatchRequestController.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', listGlobalMatchRequests);
router.post('/', createGlobalMatchRequest);
router.patch('/:requestId/respond', hostMiddleware, respondToGlobalMatchRequest);

export default router;
