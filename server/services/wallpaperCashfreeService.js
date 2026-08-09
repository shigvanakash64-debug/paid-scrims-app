import crypto from 'crypto';
import {
  CFConfig,
  CFEnvironment,
  CFOrderRequest,
  CFCustomerDetails,
  CFOrderMeta,
  CFPaymentGateway,
} from 'cashfree-pg-sdk-nodejs';
import WallpaperPurchase from '../models/WallpaperPurchase.js';
import Wallpaper from '../models/Wallpaper.js';
import User from '../models/User.js';

const API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';
const paymentGateway = new CFPaymentGateway();

const isTestEnvironment = () => String(process.env.CASHFREE_ENV || '').toUpperCase() === 'TEST';
const getCashfreeEnvironment = () => (isTestEnvironment() ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION);

const normalizeStatus = (value) => {
  if (typeof value !== 'string') return '';
  return value.toUpperCase();
};

export const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured');
  }

  return new CFConfig(getCashfreeEnvironment(), API_VERSION, clientId, clientSecret, 180000, null);
};

const SUCCESS_PAYMENT_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'SETTLED', 'APPROVED', 'CAPTURED', 'CONFIRMED']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'ACTIVE', 'INITIATED', 'CREATED', 'PROCESSING', 'ATTEMPTED', 'NOT_ATTEMPTED', 'IN_PROGRESS', 'WAITING']);

const isSuccessfulPaymentStatus = (value) => SUCCESS_PAYMENT_STATUSES.has(normalizeStatus(value));
const isPendingPaymentStatus = (value) => {
  const normalized = normalizeStatus(value);
  return !normalized || PENDING_PAYMENT_STATUSES.has(normalized);
};

const getStatusFromPayload = (orderResponse, paymentEntities = []) => {
  const firstPayment = paymentEntities[0] || {};
  const orderStatus = orderResponse?.cfOrder?.orderStatus
    || orderResponse?.cfOrder?.order_status
    || orderResponse?.orderStatus
    || orderResponse?.order_status
    || orderResponse?.status;

  if (orderStatus) {
    return normalizeStatus(orderStatus);
  }

  const paymentStatus = firstPayment.paymentStatus
    || firstPayment.payment_status
    || firstPayment.status;

  return normalizeStatus(paymentStatus);
};

const getCfPaymentId = (paymentEntities = [], orderResponse = {}) => {
  const firstPayment = paymentEntities[0] || {};
  const paymentId = firstPayment.cfPaymentId
    || firstPayment.paymentId
    || orderResponse?.cfOrder?.cfPaymentId
    || orderResponse?.cfOrder?.paymentId
    || null;
  return typeof paymentId === 'string' ? paymentId : null;
};

const getPaymentMethod = (paymentEntities = [], orderResponse = {}) => {
  const firstPayment = paymentEntities[0] || {};
  const method = firstPayment.paymentMethod
    || firstPayment.payment_method
    || orderResponse?.cfOrder?.paymentMethod
    || orderResponse?.cfOrder?.payment_method
    || 'cashfree';
  return typeof method === 'string' ? method : 'cashfree';
};

const buildWallpaperOrderId = () => {
  const ts = Date.now();
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `WP-${ts}-${randomPart}`;
};

export const createWallpaperCashfreeOrder = async ({ wallpaperId, userId, userName, userEmail, userPhone, amount, returnBaseUrl }) => {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid wallpaper amount');
  }

  const wallpaper = await Wallpaper.findById(wallpaperId);
  if (!wallpaper || !wallpaper.isActive) {
    throw new Error('Wallpaper not found');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const config = getCashfreeConfig();
  const orderId = buildWallpaperOrderId();
  const customerDetails = new CFCustomerDetails();
  customerDetails.customerId = String(userId || orderId);
  customerDetails.customerName = userName || user.username || 'Clutch Zone User';
  customerDetails.customerEmail = userEmail || 'wallpaper@clutchzone.in';
  customerDetails.customerPhone = String(userPhone || '9999999999').replace(/\D/g, '').slice(0, 10);

  const orderRequest = new CFOrderRequest();
  orderRequest.orderId = orderId;
  orderRequest.orderAmount = Number(parsedAmount.toFixed(2));
  orderRequest.orderCurrency = 'INR';
  orderRequest.customerDetails = customerDetails;
  orderRequest.orderNote = 'Clutch Zone Wallpaper Store Purchase';
  orderRequest.orderTags = {
    source: 'wallpaper-store',
    channel: 'wallpaper',
  };

  const returnUrl = buildReturnUrl(orderId, returnBaseUrl);
  const orderMeta = new CFOrderMeta();
  orderMeta.returnUrl = returnUrl;
  orderRequest.orderMeta = orderMeta;
  orderRequest.order_meta = orderRequest.order_meta || {};
  orderRequest.order_meta.return_url = returnUrl;

  const purchase = await WallpaperPurchase.findOne({ userId, wallpaperId, paymentStatus: 'SUCCESS' });
  if (purchase) {
    return {
      success: true,
      alreadyPurchased: true,
      orderId: purchase.orderId,
      paymentSessionId: purchase.paymentSessionId,
      amount: Number(purchase.amount || wallpaper.price),
      currency: purchase.currency || 'INR',
      environment: isTestEnvironment() ? 'TEST' : 'LIVE',
      returnUrl,
    };
  }

  const existingPending = await WallpaperPurchase.findOne({ userId, wallpaperId, paymentStatus: 'PENDING' });
  if (existingPending) {
    return {
      success: true,
      orderId: existingPending.orderId,
      paymentSessionId: existingPending.paymentSessionId,
      amount: Number(existingPending.amount || wallpaper.price),
      currency: existingPending.currency || 'INR',
      environment: isTestEnvironment() ? 'TEST' : 'LIVE',
      returnUrl,
    };
  }

  const purchaseRecord = await WallpaperPurchase.create({
    orderId,
    userId,
    wallpaperId,
    amount: parsedAmount,
    currency: 'INR',
    paymentStatus: 'PENDING',
    provider: 'cashfree',
    paymentMethod: 'cashfree',
  });

  const response = await paymentGateway.orderCreate(config, orderRequest);
  const order = response?.cfOrder || response?.order || response;
  const paymentSessionId = order?.paymentSessionId || order?.payment_session_id;

  if (!paymentSessionId) {
    purchaseRecord.paymentStatus = 'FAILED';
    await purchaseRecord.save();
    throw new Error('Cashfree did not return a payment session id');
  }

  purchaseRecord.paymentSessionId = paymentSessionId;
  purchaseRecord.cfOrderId = order?.orderId || orderId;
  purchaseRecord.paymentStatus = 'PENDING';
  await purchaseRecord.save();

  return {
    success: true,
    orderId: order?.orderId || orderId,
    paymentSessionId,
    amount: Number(parsedAmount.toFixed(2)),
    currency: 'INR',
    environment: isTestEnvironment() ? 'TEST' : 'LIVE',
    returnUrl,
  };
};

const buildReturnUrl = (orderId, returnBaseUrl) => {
  const configured = process.env.WALLPAPER_CASHFREE_RETURN_URL || returnBaseUrl || process.env.WALLPAPER_PAYMENT_RETURN_URL;
  if (configured) {
    if (configured.includes('{order_id}')) {
      return configured.replace('{order_id}', encodeURIComponent(orderId));
    }
    if (configured.includes('?')) {
      return `${configured}&order_id=${encodeURIComponent(orderId)}`;
    }
    return `${configured}?order_id=${encodeURIComponent(orderId)}`;
  }

  const host = process.env.PUBLIC_BASE_URL || process.env.FRONTEND_URL || 'http://localhost:5000';
  return `${host.replace(/\/$/, '')}/api/wallpaper/payment/return?order_id=${encodeURIComponent(orderId)}`;
};

export const verifyWallpaperCashfreePayment = async ({ orderId }) => {
  const config = getCashfreeConfig();
  const purchase = await WallpaperPurchase.findOne({ orderId }).populate('wallpaperId');

  if (!purchase) {
    throw new Error('Wallpaper purchase order not found');
  }

  const result = await paymentGateway.getOrder(config, orderId);
  const order = result?.cfOrder || result?.order || result;
  let paymentEntities = result?.cfPaymentsEntities || order?.payments || [];

  if (!Array.isArray(paymentEntities) && order?.payments && typeof order.payments === 'object') {
    const paymentsResult = await paymentGateway.getPaymentsForOrder(config, orderId);
    paymentEntities = paymentsResult?.cfPaymentsEntities || [];
  }

  const paymentStatus = getStatusFromPayload(result, paymentEntities);
  const cfPaymentId = getCfPaymentId(paymentEntities, order);
  const paymentMethod = getPaymentMethod(paymentEntities, order);

  if (isSuccessfulPaymentStatus(paymentStatus)) {
    if (purchase.paymentStatus === 'SUCCESS') {
      return {
        success: true,
        status: 'success',
        alreadyPaid: true,
        orderId,
      };
    }

    const user = await User.findById(purchase.userId);
    if (!user) {
      throw new Error('User not found while unlocking wallpaper library');
    }

    const wallpaper = await Wallpaper.findById(purchase.wallpaperId);
    if (!wallpaper || !wallpaper.isActive) {
      throw new Error('Wallpaper not found while unlocking library');
    }

    const alreadyOwned = (user.wallpaperLibrary || []).some((entry) => {
      const existingId = entry.wallpaperId?.toString ? entry.wallpaperId.toString() : String(entry.wallpaperId);
      return existingId === String(wallpaper._id);
    });

    if (!alreadyOwned) {
      user.wallpaperLibrary = user.wallpaperLibrary || [];
      user.wallpaperLibrary.push({
        wallpaperId: wallpaper._id,
        title: wallpaper.title,
        category: wallpaper.category,
        price: wallpaper.price,
        previewImage: wallpaper.previewImage,
        purchasedAt: new Date(),
      });
      await user.save();
    }

    purchase.paymentStatus = 'SUCCESS';
    purchase.cfPaymentId = cfPaymentId || purchase.cfPaymentId;
    purchase.paymentMethod = paymentMethod || purchase.paymentMethod;
    purchase.paidAt = new Date();
    await purchase.save();

    return {
      success: true,
      status: 'success',
      orderId,
      amount: Number(purchase.amount || 0),
      wallpaperId: String(wallpaper._id),
    };
  }

  if (!isPendingPaymentStatus(paymentStatus)) {
    purchase.paymentStatus = 'FAILED';
    purchase.cfPaymentId = cfPaymentId || purchase.cfPaymentId;
    purchase.paymentMethod = paymentMethod || purchase.paymentMethod;
    await purchase.save();
    return {
      success: false,
      status: 'failed',
      orderId,
      message: 'Wallet purchase could not be confirmed',
    };
  }

  return {
    success: false,
    status: 'pending',
    orderId,
    message: 'Payment is still pending',
  };
};

export const processWallpaperCashfreeWebhook = async ({ payload, signature, rawBody }) => {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET;

  if (webhookSecret && signature) {
    const expectedSignature = crypto.createHmac('sha256', webhookSecret).update(rawBody || '').digest('hex');
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid Cashfree webhook signature');
    }
  }

  const eventPayload = payload?.data || payload;
  const orderId = eventPayload?.orderId
    || eventPayload?.order_id
    || eventPayload?.order?.orderId
    || eventPayload?.order?.order_id
    || payload?.orderId
    || payload?.order_id;

  if (!orderId) {
    throw new Error('Cashfree webhook payload did not include an order id');
  }

  const paymentStatus = normalizeStatus(
    eventPayload?.paymentStatus
    || eventPayload?.payment_status
    || eventPayload?.orderStatus
    || eventPayload?.order_status
    || payload?.paymentStatus
    || payload?.payment_status
    || payload?.status
  );

  const purchase = await WallpaperPurchase.findOne({ orderId });
  if (!purchase) {
    return {
      success: false,
      ignored: true,
      orderId,
      message: 'Order is not a wallpaper purchase',
    };
  }

  const cfPaymentId = eventPayload?.cfPaymentId
    || eventPayload?.paymentId
    || payload?.cfPaymentId
    || payload?.paymentId
    || null;

  const paymentMethod = eventPayload?.paymentMethod
    || eventPayload?.payment_method
    || payload?.paymentMethod
    || payload?.payment_method
    || 'cashfree';

  if (isSuccessfulPaymentStatus(paymentStatus)) {
    const result = await verifyWallpaperCashfreePayment({ orderId });
    if (result.success) {
      purchase.cfPaymentId = cfPaymentId || purchase.cfPaymentId;
      purchase.paymentMethod = paymentMethod || purchase.paymentMethod;
      purchase.paymentStatus = 'SUCCESS';
      await purchase.save();
      return { success: true, orderId, status: 'success', message: 'Wallpaper purchase committed' };
    }
  }

  purchase.paymentStatus = paymentStatus === 'FAILED' ? 'FAILED' : purchase.paymentStatus;
  purchase.cfPaymentId = cfPaymentId || purchase.cfPaymentId;
  purchase.paymentMethod = paymentMethod || purchase.paymentMethod;
  await purchase.save();

  return { success: true, orderId, status: 'processed' };
};
