import WallpaperPurchase from '../models/WallpaperPurchase.js';
import Wallpaper from '../models/Wallpaper.js';
import User from '../models/User.js';
import { createWallpaperCashfreeOrder, verifyWallpaperCashfreePayment, processWallpaperCashfreeWebhook } from '../services/wallpaperCashfreeService.js';

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

export const createWallpaperPaymentOrder = async (req, res) => {
  try {
    const userId = req.userId;
    const { wallpaperId } = req.body || {};

    if (!wallpaperId) {
      return res.status(400).json({ error: 'wallpaperId is required' });
    }

    const wallpaper = await Wallpaper.findById(wallpaperId);
    if (!wallpaper || !wallpaper.isActive) {
      return res.status(404).json({ error: 'Wallpaper not found' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const existingPaid = await WallpaperPurchase.findOne({ userId, wallpaperId, paymentStatus: 'SUCCESS' });
    if (existingPaid) {
      return res.status(200).json({
        success: true,
        alreadyPurchased: true,
        orderId: existingPaid.orderId,
        paymentSessionId: existingPaid.paymentSessionId,
        amount: Number(existingPaid.amount || wallpaper.price),
        currency: existingPaid.currency || 'INR',
      });
    }

    const result = await createWallpaperCashfreeOrder({
      wallpaperId,
      userId,
      userName: user.username || 'Wallpaper Buyer',
      userEmail: user.email || 'wallpaper@clutchzone.in',
      userPhone: user.phone || user.mobile || '9999999999',
      amount: wallpaper.price,
      returnBaseUrl: `${req.protocol}://${req.get('host')}/api/wallpaper/payment/return`,
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('[WALLPAPER PAYMENT] create order error:', error?.response?.data || error?.message || error);
    return res.status(500).json({ error: error.message || 'Unable to create wallpaper payment order' });
  }
};

export const verifyWallpaperPaymentReturn = async (req, res) => {
  try {
    let { orderId, order_id } = req.query || {};
    orderId = orderId || order_id;

    if (!orderId) {
      const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontend.replace(/\/$/, '')}/wallpaper`);
    }

    const result = await verifyWallpaperCashfreePayment({ orderId });

    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    if (result.success) {
      return res.redirect(`${frontend.replace(/\/$/, '')}/wallpaper/my-library`);
    }

    return res.redirect(`${frontend.replace(/\/$/, '')}/wallpaper`);
  } catch (error) {
    console.error('[WALLPAPER PAYMENT] return verification error:', error);
    const frontend = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontend.replace(/\/$/, '')}/wallpaper`);
  }
};

export const handleWallpaperWebhook = async (req, res) => {
  try {
    const { payload, rawBody } = parseWebhookPayload(req);
    const signature = req.headers['x-cashfree-signature'] || req.headers['x-cashfree-signature'.toLowerCase()];

    const result = await processWallpaperCashfreeWebhook({ payload, signature, rawBody });
    return res.status(200).json({ success: true, ...result });
  } catch (error) {
    console.error('[WALLPAPER PAYMENT] webhook error:', error);
    return res.status(400).json({ error: error.message || 'Cashfree Wallpaper webhook could not be processed' });
  }
};
