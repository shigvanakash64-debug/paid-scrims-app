import { createCashfreeOrder, verifyCashfreePayment, processCashfreeWebhook } from '../services/cashfreeService.js';

export const createCashfreeDepositOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid amount for deposit' });
    }

    const result = await createCashfreeOrder({
      amount,
      userId,
      userName: req.user?.username || 'Clutch Zone User',
      userEmail: req.user?.email || 'placeholder@clutchzone.in',
      userPhone: req.user?.phone || '9999999999',
    });

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Create Cashfree Deposit Order Error:', error);
    return res.status(500).json({ error: error.message || 'Unable to create Cashfree order' });
  }
};

export const verifyCashfreeDeposit = async (req, res) => {
  try {
    const userId = req.userId;
    let { orderId, paymentSessionId } = req.body || {};

    console.log('[Cashfree] verifyCashfreeDeposit called', { orderId, paymentSessionId, userId });

    // Allow frontend to pass either orderId or paymentSessionId (post-redirect variations)
    if (!orderId && paymentSessionId) {
      // Try to resolve orderId from stored PaymentDeposit record
      const PaymentDeposit = (await import('../models/PaymentDeposit.js')).default;
      const deposit = await PaymentDeposit.findOne({ paymentSessionId });
      if (deposit) {
        orderId = deposit.orderId;
        console.log('[Cashfree] Resolved orderId from paymentSessionId', { paymentSessionId, orderId });
      }
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId or paymentSessionId is required for verification' });
    }

    const result = await verifyCashfreePayment({ orderId, userId });

    console.log('[Cashfree] verifyCashfreePayment result', { orderId, result });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        status: result.status,
        message: result.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: result.message,
      orderId: result.orderId,
      amount: result.amount,
    });
  } catch (error) {
    console.error('Verify Cashfree Deposit Error:', error);
    return res.status(500).json({ error: error.message || 'Unable to verify Cashfree payment' });
  }
};

export const handleCashfreeWebhook = async (req, res) => {
  try {
    const payload = req.body;
    const signature = req.headers['x-cashfree-signature'] || req.headers['x-cashfree-signature'.toLowerCase()];
    const rawBody = req.rawBody || JSON.stringify(payload);

    const result = await processCashfreeWebhook({ payload, signature, rawBody });

    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return res.status(400).json({ error: error.message || 'Cashfree webhook could not be processed' });
  }
};
