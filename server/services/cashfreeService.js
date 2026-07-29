import crypto from 'crypto';
import {
  CFConfig,
  CFEnvironment,
  CFPaymentGateway,
  CFOrderRequest,
  CFCustomerDetails,
  CFOrderMeta,
} from 'cashfree-pg-sdk-nodejs';
import PaymentDeposit from '../models/PaymentDeposit.js';
import User from '../models/User.js';
import { sendNotification } from './notificationService.js';

const API_VERSION = process.env.CASHFREE_API_VERSION || '2022-09-01';
const paymentGateway = new CFPaymentGateway();

const isTestEnvironment = () => String(process.env.CASHFREE_ENV || '').toUpperCase() === 'TEST';

const getCashfreeEnvironment = () => (isTestEnvironment() ? CFEnvironment.SANDBOX : CFEnvironment.PRODUCTION);

export const getCashfreeConfig = () => {
  const clientId = process.env.CASHFREE_CLIENT_ID;
  const clientSecret = process.env.CASHFREE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Cashfree credentials are not configured');
  }

  return new CFConfig(getCashfreeEnvironment(), API_VERSION, clientId, clientSecret, 180000, null);
};

const normalizeStatus = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.toUpperCase();
};

const SUCCESS_PAYMENT_STATUSES = new Set(['SUCCESS', 'PAID', 'COMPLETED', 'SETTLED', 'APPROVED', 'CAPTURED', 'CONFIRMED']);
const PENDING_PAYMENT_STATUSES = new Set(['PENDING', 'ACTIVE', 'INITIATED', 'CREATED', 'PROCESSING', 'ATTEMPTED', 'NOT_ATTEMPTED', 'IN_PROGRESS', 'WAITING']);

const isSuccessfulPaymentStatus = (value) => SUCCESS_PAYMENT_STATUSES.has(normalizeStatus(value));
const isPendingPaymentStatus = (value) => {
  const normalized = normalizeStatus(value);
  return !normalized || PENDING_PAYMENT_STATUSES.has(normalized);
};
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const buildOrderId = (userId, amount) => {
  const safeUserPart = String(userId || 'wallet').replace(/[^a-zA-Z0-9]/g, '').slice(-8) || 'wallet';
  const safeAmountPart = String(Math.round(Number(amount || 0))).replace(/[^0-9]/g, '');
  return `CZ-${safeUserPart}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeAmountPart}`;
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

const normalizeString = (value, fallback = null) => {
  return typeof value === 'string' ? value : fallback;
};

const finalizeDeposit = async ({ orderId, paymentStatus, cfPaymentId, paymentMethod, userId }) => {
  const depositRecord = await PaymentDeposit.findOne({ orderId });

  console.log('[Cashfree] finalizeDeposit called', { orderId, paymentStatus, cfPaymentId, paymentMethod, userId });

  if (!depositRecord) {
    throw new Error('No deposit record found for the supplied Cashfree order');
  }

  console.log('[Cashfree] Found PaymentDeposit record', {
    orderId: depositRecord.orderId,
    paymentSessionId: depositRecord.paymentSessionId,
    amount: depositRecord.amount,
    paymentStatus: depositRecord.paymentStatus,
    userId: depositRecord.userId,
  });

  if (isSuccessfulPaymentStatus(paymentStatus)) {
    if (depositRecord.paymentStatus === 'SUCCESS') {
      console.log('[Cashfree] Deposit already credited, skipping wallet update');
      const user = await User.findById(depositRecord.userId || userId);
      if (!user) {
        throw new Error('User not found while checking existing wallet credit');
      }

      return {
        success: true,
        alreadyCredited: true,
        status: 'success',
        message: 'Deposit already credited to wallet.',
        orderId,
        amount: Number(depositRecord.amount || 0),
        walletBalance: Number(user.wallet.balance || 0),
        transactionId: depositRecord._id?.toString() || null,
      };
    }

    const user = await User.findById(depositRecord.userId || userId);
    if (!user) {
      throw new Error('User not found while crediting wallet');
    }

    console.log('[Cashfree] Updating user wallet', {
      userId: user._id,
      currentBalance: user.wallet.balance,
      depositAmount: depositRecord.amount,
    });

    user.wallet.balance += Number(depositRecord.amount || 0);
    user.wallet.transactions.push({
      type: 'deposit',
      amount: Number(depositRecord.amount || 0),
      description: 'Wallet deposit via Cashfree',
      timestamp: new Date(),
    });

    await user.save();

    console.log('[Cashfree] Wallet updated successfully', {
      userId: user._id,
      newBalance: user.wallet.balance,
    });

    const normalizedCfPaymentId = normalizeString(cfPaymentId, depositRecord.cfPaymentId || null);
    const normalizedPaymentMethod = normalizeString(paymentMethod, depositRecord.paymentMethod || 'cashfree');

    depositRecord.paymentStatus = 'SUCCESS';
    depositRecord.cfPaymentId = normalizedCfPaymentId;
    depositRecord.paymentMethod = normalizedPaymentMethod;
    depositRecord.verifiedAt = new Date();
    await depositRecord.save();

    console.log('[Cashfree] Deposit record updated', {
      orderId: depositRecord.orderId,
      paymentStatus: depositRecord.paymentStatus,
      cfPaymentId: depositRecord.cfPaymentId,
      paymentMethod: depositRecord.paymentMethod,
    });

    if (user.onesignalPlayerId && user.notificationPreferences.walletNotifications) {
      await sendNotification(
        [user.onesignalPlayerId],
        '💰 Deposit successful',
        `₹${depositRecord.amount} has been added to your wallet.`,
        {
          type: 'success',
          priority: 9,
          data: {
            eventType: 'deposit_success',
            amount: depositRecord.amount,
            provider: 'cashfree',
          },
        }
      );
    }

    user.notifications.push({
      type: 'success',
      message: `₹${depositRecord.amount} deposited successfully to your wallet via Cashfree.`,
      relatedMatch: null,
    });

    await user.save();

    return {
      success: true,
      status: 'success',
      message: 'Deposit confirmed and wallet updated.',
      orderId,
      amount: Number(depositRecord.amount || 0),
      walletBalance: Number(user.wallet.balance || 0),
      transactionId: depositRecord._id?.toString() || null,
    };
  }

  depositRecord.paymentStatus = paymentStatus;
  depositRecord.cfPaymentId = cfPaymentId || depositRecord.cfPaymentId;
  depositRecord.paymentMethod = paymentMethod || depositRecord.paymentMethod;
  await depositRecord.save();

  return {
    success: false,
    status: paymentStatus.toLowerCase(),
    message: 'Payment is not complete yet.',
    orderId,
  };
};

export const createCashfreeOrder = async ({ amount, userId, userName, userEmail, userPhone }) => {
  const parsedAmount = Number(amount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    throw new Error('Invalid deposit amount');
  }

  const config = getCashfreeConfig();
  const orderId = buildOrderId(userId, parsedAmount);

  const customerDetails = new CFCustomerDetails();
  customerDetails.customerId = String(userId || orderId);
  customerDetails.customerName = userName || 'Clutch Zone User';
  customerDetails.customerEmail = userEmail || 'placeholder@clutchzone.in';
  customerDetails.customerPhone = String(userPhone || '9999999999').replace(/\D/g, '').slice(0, 10);

  const orderRequest = new CFOrderRequest();
  orderRequest.orderId = orderId;
  orderRequest.orderAmount = Number(parsedAmount.toFixed(2));
  orderRequest.orderCurrency = 'INR';
  orderRequest.customerDetails = customerDetails;
  orderRequest.orderNote = 'Clutch Zone wallet deposit';
  orderRequest.orderTags = {
    source: 'clutch-zone',
    channel: 'wallet',
  };

  // Optionally include a return URL so Cashfree redirects back to our frontend page
  // The return URL must carry the order_id so the frontend can verify the payment.
  const configuredReturn = process.env.CASHFREE_RETURN_URL;
  if (configuredReturn) {
    try {
      const returnUrl = configuredReturn.includes('{order_id}')
        ? configuredReturn.replace('{order_id}', encodeURIComponent(orderId))
        : configuredReturn.includes('?')
          ? `${configuredReturn}&order_id=${encodeURIComponent(orderId)}`
          : `${configuredReturn}?order_id=${encodeURIComponent(orderId)}`;

      const orderMeta = new CFOrderMeta();
      orderMeta.returnUrl = returnUrl;
      orderRequest.orderMeta = orderMeta;
      orderRequest.order_meta = orderRequest.order_meta || {};
      orderRequest.order_meta.return_url = returnUrl;
    } catch (e) {
      // ignore if SDK object shape differs
      console.warn('[Cashfree] Could not set return URL on order request', e.message || e);
    }
  }

  const depositRecord = await PaymentDeposit.create({
    userId,
    orderId,
    amount: parsedAmount,
    paymentStatus: 'PENDING',
    paymentMethod: 'cashfree',
  });

  const response = await paymentGateway.orderCreate(config, orderRequest);
  const order = response?.cfOrder || response?.order || response;
  const paymentSessionId = order?.paymentSessionId || order?.payment_session_id;

  if (!paymentSessionId) {
    depositRecord.paymentStatus = 'FAILED';
    await depositRecord.save();
    throw new Error('Cashfree did not return a payment session id');
  }

  depositRecord.paymentSessionId = paymentSessionId;
  depositRecord.paymentStatus = 'PENDING';
  await depositRecord.save();

  return {
    success: true,
    orderId: order?.orderId || orderId,
    paymentSessionId,
    amount: Number(parsedAmount.toFixed(2)),
    currency: 'INR',
    environment: isTestEnvironment() ? 'TEST' : 'LIVE',
  };
};

export const verifyCashfreePayment = async ({ orderId, userId }) => {
  const config = getCashfreeConfig();
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await paymentGateway.getOrder(config, orderId);
    console.log('[Cashfree] getOrder result', {
      orderId,
      rawResult: result ? { keys: Object.keys(result) } : null,
    });

    const order = result?.cfOrder || result?.order || result;
    let paymentEntities = result?.cfPaymentsEntities || order?.payments || [];

    if (!Array.isArray(paymentEntities) && order?.payments && typeof order.payments === 'object') {
      const paymentsResult = await paymentGateway.getPaymentsForOrder(config, orderId);
      paymentEntities = paymentsResult?.cfPaymentsEntities || [];
      console.log('[Cashfree] getPaymentsForOrder result', {
        orderId,
        paymentsCount: Array.isArray(paymentEntities) ? paymentEntities.length : 0,
      });
    }

    const paymentStatus = getStatusFromPayload(result, paymentEntities);
    const cfPaymentId = getCfPaymentId(paymentEntities, order);
    const paymentMethod = getPaymentMethod(paymentEntities, order);

    console.log('========== CASHFREE DEBUG ==========' );
    console.log(JSON.stringify(result, null, 2));
    console.log('Parsed Status:', paymentStatus);
    console.log('====================================');

    console.log('[Cashfree] verifyCashfreePayment parsed', {
      orderId,
      paymentStatus,
      cfPaymentId,
      paymentMethod,
      paymentEntitiesCount: Array.isArray(paymentEntities) ? paymentEntities.length : 0,
      attempt,
    });

    if (isSuccessfulPaymentStatus(paymentStatus)) {
      return finalizeDeposit({
        orderId,
        paymentStatus,
        cfPaymentId,
        paymentMethod,
        userId,
      });
    }

    if (!isPendingPaymentStatus(paymentStatus) || attempt === maxAttempts) {
      return finalizeDeposit({
        orderId,
        paymentStatus,
        cfPaymentId,
        paymentMethod,
        userId,
      });
    }

    console.log('[Cashfree] Payment still pending, retrying verification', {
      orderId,
      attempt,
      paymentStatus,
    });

    await wait(1500);
  }

  return {
    success: false,
    status: 'pending',
    message: 'Cashfree did not confirm payment yet.',
    orderId,
  };
};

export const processCashfreeWebhook = async ({ payload, signature, rawBody }) => {
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

  return finalizeDeposit({
    orderId,
    paymentStatus,
    cfPaymentId,
    paymentMethod,
    userId: null,
  });
};
