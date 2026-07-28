import express from 'express';
import { handleCashfreeWebhook } from '../controllers/cashfreeController.js';

const router = express.Router();

/**
 * POST /api/cashfree/webhook
 * Cashfree sends event notifications here. No auth is required.
 */
router.post('/webhook', handleCashfreeWebhook);

export default router;
