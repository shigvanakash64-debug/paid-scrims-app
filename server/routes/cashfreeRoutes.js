import express from 'express';
import { handleCashfreeWebhook, handleCashfreeReturn } from '../controllers/cashfreeController.js';

const router = express.Router();

/**
 * POST /api/cashfree/webhook
 * Cashfree sends event notifications here. No auth is required.
 */
router.post('/webhook', express.raw({ type: '*/*' }), handleCashfreeWebhook);
router.post('/cashfree-webhook', express.raw({ type: '*/*' }), handleCashfreeWebhook);

// Return URL for redirect checkout. Cashfree will redirect users here after payment.
router.get('/return', handleCashfreeReturn);

export default router;
