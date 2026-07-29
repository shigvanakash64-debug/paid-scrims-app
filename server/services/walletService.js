import User from '../models/User.js';
import PaymentDeposit from '../models/PaymentDeposit.js';
import Match from '../models/Match.js';
import { sendNotification } from './notificationService.js';
import { verifyCashfreePayment } from './cashfreeService.js';

const ensureNumber = (value) => Number(value || 0);

export const getUserWalletSnapshot = async (userId) => {
  const user = await User.findById(userId).select('wallet username');
  if (!user) {
    throw new Error('User not found');
  }

  return {
    userId: user._id,
    username: user.username,
    balance: ensureNumber(user.wallet?.balance || 0),
    bonusBalance: ensureNumber(user.wallet?.bonusBalance || 0),
    referralEarningsBalance: ensureNumber(user.wallet?.referralEarningsBalance || 0),
    pendingWithdrawals: user.wallet?.pendingWithdrawals || [],
    transactions: user.wallet?.transactions || [],
  };
};

export const createWalletDepositOrder = async ({ userId, amount, userName, userEmail, userPhone }) => {
  const { createCashfreeOrder } = await import('./cashfreeService.js');
  return createCashfreeOrder({ amount, userId, userName, userEmail, userPhone });
};

export const verifyWalletDeposit = async ({ userId, orderId, paymentSessionId }) => {
  let resolvedOrderId = orderId;

  if (!resolvedOrderId && paymentSessionId) {
    const deposit = await PaymentDeposit.findOne({ paymentSessionId });
    if (deposit) {
      resolvedOrderId = deposit.orderId;
    }
  }

  if (!resolvedOrderId) {
    throw new Error('orderId or paymentSessionId is required');
  }

  const result = await verifyCashfreePayment({ orderId: resolvedOrderId, userId });

  if (result.success) {
    const snapshot = await getUserWalletSnapshot(userId);
    return { ...result, wallet: snapshot };
  }

  return result;
};

export const requestWalletWithdrawal = async ({ userId, amount, upi, wallet = 'main' }) => {
  const parsedAmount = ensureNumber(amount);
  if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
    throw new Error('Minimum withdrawal amount is ₹100');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const selectedWallet = wallet === 'referral' ? 'referral' : 'main';
  const availableBalance = selectedWallet === 'referral'
    ? ensureNumber(user.wallet?.referralEarningsBalance || 0)
    : ensureNumber(user.wallet?.balance || 0);

  if (availableBalance < parsedAmount) {
    throw new Error('Insufficient balance for withdrawal');
  }

  const withdrawalRequest = {
    amount: parsedAmount,
    status: 'pending',
    requestedAt: new Date(),
    upi: upi.trim(),
    source: selectedWallet,
  };

  user.wallet.pendingWithdrawals.push(withdrawalRequest);
  await user.save();

  if (user.onesignalPlayerId && user.notificationPreferences?.walletNotifications) {
    await sendNotification(
      [user.onesignalPlayerId],
      '💸 Withdrawal Pending',
      `Your withdrawal request of ₹${parsedAmount} is being processed.`,
      {
        type: 'info',
        priority: 9,
        data: { eventType: 'withdrawal_requested', amount: parsedAmount },
      }
    );
  }

  user.notifications.push({
    type: 'info',
    message: `Withdrawal request of ₹${parsedAmount} submitted. Pending admin approval.`,
    relatedMatch: null,
  });
  await user.save();

  return withdrawalRequest;
};

export const approveWithdrawalRequest = async ({ withdrawalId, adminNote = '', adminId }) => {
  const user = await User.findOne({
    'wallet.pendingWithdrawals._id': withdrawalId,
    'wallet.pendingWithdrawals.status': 'pending',
  });

  if (!user) {
    throw new Error('Withdrawal request not found');
  }

  const withdrawal = user.wallet.pendingWithdrawals.id(withdrawalId);
  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  const totalWithdrawableBalance = ensureNumber(user.wallet?.balance || 0) + ensureNumber(user.wallet?.referralEarningsBalance || 0);
  if (totalWithdrawableBalance < withdrawal.amount) {
    throw new Error('Insufficient balance for withdrawal');
  }

  withdrawal.status = 'approved';
  withdrawal.processedAt = new Date();
  withdrawal.adminNote = adminNote;
  withdrawal.processedBy = adminId || null;

  let remainingAmount = withdrawal.amount;
  if (ensureNumber(user.wallet?.balance || 0) >= remainingAmount) {
    user.wallet.balance -= remainingAmount;
    remainingAmount = 0;
  } else {
    remainingAmount -= ensureNumber(user.wallet?.balance || 0);
    user.wallet.balance = 0;
    if (remainingAmount > 0) {
      user.wallet.referralEarningsBalance = Math.max(0, ensureNumber(user.wallet?.referralEarningsBalance || 0) - remainingAmount);
    }
  }

  user.wallet.transactions.push({
    type: 'withdrawal',
    amount: -withdrawal.amount,
    description: `Withdrawal approved${adminNote ? ` - ${adminNote}` : ''}`,
    status: 'completed',
    timestamp: new Date(),
  });

  await user.save();

  return {
    withdrawalId: withdrawal._id,
    amount: withdrawal.amount,
    status: withdrawal.status,
    processedAt: withdrawal.processedAt,
  };
};

export const rejectWithdrawalRequest = async ({ withdrawalId, adminNote = '' }) => {
  const user = await User.findOne({
    'wallet.pendingWithdrawals._id': withdrawalId,
    'wallet.pendingWithdrawals.status': 'pending',
  });

  if (!user) {
    throw new Error('Withdrawal request not found');
  }

  const withdrawal = user.wallet.pendingWithdrawals.id(withdrawalId);
  if (!withdrawal) {
    throw new Error('Withdrawal not found');
  }

  withdrawal.status = 'rejected';
  withdrawal.processedAt = new Date();
  withdrawal.adminNote = adminNote;
  await user.save();

  return {
    withdrawalId: withdrawal._id,
    amount: withdrawal.amount,
    status: withdrawal.status,
    processedAt: withdrawal.processedAt,
  };
};

export const getAdminWalletOverview = async () => {
  const [totalUsers, totalWalletBalance, pendingWithdrawals, liveMatches, depositsToday, withdrawalsToday, recentDeposits] = await Promise.all([
    User.countDocuments({}),
    User.aggregate([{ $group: { _id: null, total: { $sum: '$wallet.balance' } } }]),
    User.aggregate([{ $unwind: '$wallet.pendingWithdrawals' }, { $match: { 'wallet.pendingWithdrawals.status': 'pending' } }, { $count: 'count' }]),
    Match.countDocuments({ status: { $in: ['ongoing', 'result_pending', 'disputed'] } }),
    PaymentDeposit.aggregate([{ $match: { createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    User.aggregate([{ $unwind: '$wallet.pendingWithdrawals' }, { $match: { 'wallet.pendingWithdrawals.status': 'approved', 'wallet.pendingWithdrawals.processedAt': { $gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }, { $group: { _id: null, total: { $sum: '$wallet.pendingWithdrawals.amount' } } }]),
    PaymentDeposit.find().sort({ createdAt: -1 }).limit(5).populate('userId', 'username'),
  ]);

  return {
    totalUsers: totalUsers || 0,
    onlineUsers: 0,
    walletBalance: ensureNumber((totalWalletBalance[0] || {}).total || 0),
    todaysDeposits: ensureNumber((depositsToday[0] || {}).total || 0),
    todaysWithdrawals: ensureNumber((withdrawalsToday[0] || {}).total || 0),
    pendingWithdrawals: (pendingWithdrawals[0] || {}).count || 0,
    liveMatches,
    recentDeposits: recentDeposits.map((deposit) => ({
      id: deposit._id,
      username: deposit.userId?.username || 'Unknown',
      amount: deposit.amount,
      status: deposit.paymentStatus,
      createdAt: deposit.createdAt,
    })),
  };
};

export const listAdminWalletTransactions = async ({ page = 1, limit = 20, search = '', type = 'all', status = 'all' }) => {
  const query = {};
  if (search) {
    query.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { paymentStatus: { $regex: search, $options: 'i' } },
    ];
  }
  if (type !== 'all') {
    query.paymentMethod = type;
  }
  if (status !== 'all') {
    query.paymentStatus = status;
  }

  const [deposits, total] = await Promise.all([
    PaymentDeposit.find(query).populate('userId', 'username').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    PaymentDeposit.countDocuments(query),
  ]);

  return {
    transactions: deposits.map((deposit) => ({
      id: deposit._id,
      type: 'deposit',
      amount: deposit.amount,
      status: deposit.paymentStatus,
      paymentMethod: deposit.paymentMethod,
      orderId: deposit.orderId,
      paymentSessionId: deposit.paymentSessionId,
      cfPaymentId: deposit.cfPaymentId,
      user: deposit.userId ? { id: deposit.userId._id, username: deposit.userId.username } : null,
      createdAt: deposit.createdAt,
      updatedAt: deposit.updatedAt,
    })),
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
