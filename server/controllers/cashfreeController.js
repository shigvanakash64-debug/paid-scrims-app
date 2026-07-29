import { createCashfreeOrder, verifyCashfreePayment, processCashfreeWebhook } from '../services/cashfreeService.js';

const parseWebhookPayload = (req) => {
  if (!req.body) {
    return { payload: {}, rawBody: req.rawBody || '' };
  }

  if (Buffer.isBuffer(req.body)) {
    const text = req.body.toString('utf8');
    try {
      return { payload: JSON.parse(text), rawBody: text };
    } catch {
      return { payload: {}, rawBody: text };
    }
  }

  if (typeof req.body === 'string') {
    try {
      return { payload: JSON.parse(req.body), rawBody: req.body };
    } catch {
      return { payload: {}, rawBody: req.body };
    }
  }

  return { payload: req.body, rawBody: req.rawBody || JSON.stringify(req.body) };
};

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

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Create Cashfree Deposit Order Error:', error);
    return res.status(500).json({ error: error.message || 'Unable to create Cashfree order' });
  }
};

export const verifyCashfreeDeposit = async (req, res) => {
  try {
    const userId = req.userId;
    let { orderId, paymentSessionId } = req.body || {};

    if (!orderId && paymentSessionId) {
      const PaymentDeposit = (await import('../models/PaymentDeposit.js')).default;
      const deposit = await PaymentDeposit.findOne({ paymentSessionId });
      if (deposit) {
        orderId = deposit.orderId;
      }
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId or paymentSessionId is required for verification' });
    }

    const result = await verifyCashfreePayment({ orderId, userId });

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
    const { payload, rawBody } = parseWebhookPayload(req);
    const signature = req.headers['x-cashfree-signature'] || req.headers['x-cashfree-signature'.toLowerCase()];

    const orderId = payload?.data?.orderId || payload?.data?.order_id || payload?.orderId || payload?.order_id;

    const result = await processCashfreeWebhook({ payload, signature, rawBody });

    return res.status(200).json({ success: true, orderId, ...result });
  } catch (error) {
    console.error('Cashfree Webhook Error:', error);
    return res.status(400).json({ error: error.message || 'Cashfree webhook could not be processed' });
  }
};

export const handleCashfreeReturn = async (req, res) => {
  try {
    // Cashfree will redirect users to this URL after payment completion.
    // Support both orderId and paymentSessionId query params.
    let { orderId, paymentSessionId } = req.query || {};

    if (!orderId && paymentSessionId) {
      const PaymentDeposit = (await import('../models/PaymentDeposit.js')).default;
      const deposit = await PaymentDeposit.findOne({ paymentSessionId });
      if (deposit) {
        orderId = deposit.orderId;
      }
    }

    if (!orderId) {
      // If we cannot resolve an order id, redirect back to frontend with an error
      const frontend = process.env.FRONTEND_URL || '/';
      const redirectTo = `${frontend.replace(/\/$/, '')}/deposit-result?status=error&message=${encodeURIComponent('missing_order_id')}`;
      return res.redirect(redirectTo);
    }

    const result = await verifyCashfreePayment({ orderId, userId: null });

    const frontend = process.env.FRONTEND_URL || '/';
    const status = result && result.success ? 'success' : 'failed';
    const message = result && result.message ? result.message : (result && result.status) || 'unknown';

    const redirectTo = `${frontend.replace(/\/$/, '')}/deposit-result?status=${encodeURIComponent(status)}&orderId=${encodeURIComponent(orderId)}&message=${encodeURIComponent(message)}`;

    return res.redirect(redirectTo);
  } catch (error) {
    console.error('Cashfree Return Handler Error:', error);
    const frontend = process.env.FRONTEND_URL || '/';
    const redirectTo = `${frontend.replace(/\/$/, '')}/deposit-result?status=error&message=${encodeURIComponent(error.message || 'return_handler_failed')}`;
    return res.redirect(redirectTo);
  }
};
