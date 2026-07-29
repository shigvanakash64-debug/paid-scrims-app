import User from '../models/User.js';
import PaymentDeposit from '../models/PaymentDeposit.js';
import { sendNotification } from '../services/notificationService.js';
import { createCashfreeOrder, verifyCashfreePayment } from '../services/cashfreeService.js';

const normalizeAmount = (value) => Number(value || 0);

export const requestWithdrawal = async (req, res) => {
  try {
    const userId = req.userId;
    const { amount, upi, wallet = 'main' } = req.body;
    const parsedAmount = normalizeAmount(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is ₹100' });
    }

    if (!upi || !upi.trim()) {
      return res.status(400).json({ error: 'UPI ID is required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const selectedWallet = wallet === 'referral' ? 'referral' : 'main';
    const availableBalance = selectedWallet === 'referral'
      ? Number(user.wallet?.referralEarningsBalance || 0)
      : Number(user.wallet?.balance || 0);

    if (availableBalance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance for withdrawal' });
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

    return res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawalRequest._id,
      amount: parsedAmount,
      status: 'pending',
      estimatedTime: '24-48 hours',
    });
  } catch (error) {
    console.error('Withdrawal Error:', error);
    return res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
};

export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      balance: Number(user.wallet?.balance || 0),
      bonusBalance: Number(user.wallet?.bonusBalance || 0),
      referralEarningsBalance: Number(user.wallet?.referralEarningsBalance || 0),
      totalWithdrawableBalance: Number(user.wallet?.balance || 0) + Number(user.wallet?.referralEarningsBalance || 0),
      pendingWithdrawals: (user.wallet?.pendingWithdrawals || []).filter((withdrawal) => withdrawal.status === 'pending'),
      recentTransactions: (user.wallet?.transactions || []).slice(-10),
    });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    return res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

export const getWalletSummary = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet username');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        username: user.username,
      },
      balance: Number(user.wallet?.balance || 0),
      bonusBalance: Number(user.wallet?.bonusBalance || 0),
      referralEarningsBalance: Number(user.wallet?.referralEarningsBalance || 0),
      recentTransactions: (user.wallet?.transactions || []).slice(-5),
    });
  } catch (error) {
    console.error('Get Wallet Summary Error:', error);
    return res.status(500).json({ error: 'Failed to fetch wallet summary' });
  }
};

export const getWithdrawalHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet.pendingWithdrawals');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const withdrawals = (user.wallet?.pendingWithdrawals || [])
      .slice()
      .sort((a, b) => new Date(b.requestedAt || b.processedAt || 0) - new Date(a.requestedAt || a.processedAt || 0));

    return res.status(200).json({ success: true, withdrawals });
  } catch (error) {
    console.error('Get Withdrawal History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch withdrawal history' });
  }
};

export const createCashfreeDepositOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    const parsedAmount = normalizeAmount(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const result = await createCashfreeOrder({
      amount: parsedAmount,
      userId: req.userId,
      userName: req.user?.username || 'Clutch Zone User',
      userEmail: req.user?.email || 'placeholder@clutchzone.in',
      userPhone: req.user?.phone || '9999999999',
    });

    return res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Create Cashfree Deposit Order Error:', error);
    return res.status(500).json({ error: error.message || 'Failed to create deposit order' });
  }
};

export const verifyCashfreeDeposit = async (req, res) => {
  try {
    const { orderId, paymentSessionId } = req.body || {};

    if (!orderId && paymentSessionId) {
      const deposit = await PaymentDeposit.findOne({ paymentSessionId });
      if (deposit) {
        orderId = deposit.orderId;
      }
    }

    if (!orderId) {
      return res.status(400).json({ error: 'orderId or paymentSessionId is required' });
    }

    const result = await verifyCashfreePayment({ orderId, userId: req.userId });

    if (!result.success) {
      return res.status(400).json({ success: false, status: result.status, message: result.message });
    }

    return res.status(200).json({ success: true, message: result.message, orderId, amount: result.amount });
  } catch (error) {
    console.error('Verify Cashfree Deposit Error:', error);
    return res.status(500).json({ error: error.message || 'Unable to verify payment' });
  }
};

export const addBalance = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;
    const parsedAmount = normalizeAmount(amount);

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousBalance = Number(user.wallet?.balance || 0);
    user.wallet.balance += parsedAmount;
    user.wallet.transactions.push({
      type: reason === 'match_win' ? 'match_win' : 'deposit',
      amount: parsedAmount,
      description: reason || 'Balance added',
      status: 'completed',
      timestamp: new Date(),
    });

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Balance added successfully',
      previousBalance,
      addedAmount: parsedAmount,
      newBalance: Number(user.wallet?.balance || 0),
    });
  } catch (error) {
    console.error('Add Balance Error:', error);
    return res.status(500).json({ error: 'Failed to add balance' });
  }
};

export const getTransactionHistory = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('wallet');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = (user.wallet?.transactions || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

    return res.status(200).json({
      success: true,
      total: transactions.length,
      transactions,
      totalBalance: Number(user.wallet?.balance || 0),
    });
  } catch (error) {
    console.error('Get Transaction History Error:', error);
    return res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

export default {
  requestWithdrawal,
  getWalletBalance,
  getWalletSummary,
  addBalance,
  getTransactionHistory,
  getWithdrawalHistory,
  createCashfreeDepositOrder,
  verifyCashfreeDeposit,
};
