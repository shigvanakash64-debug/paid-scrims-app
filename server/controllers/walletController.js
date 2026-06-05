import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../models/User.js';
import { sendNotification } from '../services/notificationService.js';

const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    throw new Error('Razorpay credentials are not configured');
  }

  return new Razorpay({ key_id, key_secret });
};

const validateRazorpayConfig = (res) => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    res.status(500).json({ error: 'Razorpay credentials are not configured' });
    return false;
  }
  return true;
};

/**
 * POST /wallet/withdraw
 * User requests a withdrawal from their wallet
 */
export const requestWithdrawal = async (req, res) => {
  try {
    const { userId } = req.user;
    const { amount, upi } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid withdrawal amount' });
    }

    if (!upi || !upi.trim()) {
      return res.status(400).json({ error: 'UPI ID is required' });
    }

    // Get user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check balance
    if (user.wallet.balance < amount) {
      return res.status(400).json({
        error: 'Insufficient balance for withdrawal',
        currentBalance: user.wallet.balance,
      });
    }

    // Deduct amount from wallet immediately
    user.wallet.balance -= amount;

    // Create withdrawal request
    const withdrawalRequest = {
      amount,
      status: 'pending',
      requestedAt: new Date(),
      upi,
    };

    user.wallet.pendingWithdrawals.push(withdrawalRequest);

    // Add transaction record
    user.wallet.transactions.push({
      type: 'withdrawal',
      amount: -amount,
      description: `Withdrawal request to ${upi}`,
      timestamp: new Date(),
      matchId: null,
    });

    await user.save();

    // Send push notification to user
    if (user.onesignalPlayerId && user.notificationPreferences.walletNotifications) {
      await sendNotification(
        [user.onesignalPlayerId],
        '💸 Withdrawal Pending',
        `Your withdrawal request of ₹${amount} is being processed.`,
        {
          type: 'info',
          priority: 9,
          data: {
            eventType: 'withdrawal_requested',
            amount,
          },
        }
      );
    }

    // Also save to in-app notifications
    user.notifications.push({
      type: 'info',
      message: `Withdrawal request of ₹${amount} submitted. Pending admin approval.`,
      relatedMatch: null,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawalRequest._id,
      amount,
      status: 'pending',
      estimatedTime: '24-48 hours',
    });
  } catch (error) {
    console.error('Withdrawal Error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  }
};

/**
 * GET /wallet/balance
 * Get user's wallet balance
 */
export const getWalletBalance = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      success: true,
      balance: user.wallet.balance,
      pendingWithdrawals: user.wallet.pendingWithdrawals.filter(
        w => w.status === 'pending'
      ),
      recentTransactions: user.wallet.transactions.slice(-10),
    });
  } catch (error) {
    console.error('Get Wallet Balance Error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
};

export const submitDepositRequest = async (req, res) => {
  try {
    const { amount, utr, mobileLast4 } = req.body;
    const { userId } = req.user;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    const normalizedUtr = String(utr || '').trim().toUpperCase();
    const normalizedMobile = String(mobileLast4 || '').trim();

    if (!normalizedUtr || normalizedUtr.length < 6) {
      return res.status(400).json({ error: 'Please enter a valid UTR number' });
    }

    if (!normalizedMobile || normalizedMobile.length < 4) {
      return res.status(400).json({ error: 'Please enter the last 4 digits of the payer mobile number' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const duplicate = (user.wallet?.pendingDeposits || []).some((entry) =>
      entry.utr === normalizedUtr && ['pending', 'approved'].includes(entry.status)
    );

    if (duplicate) {
      return res.status(409).json({ error: 'This UTR has already been used for a pending or approved deposit' });
    }

    user.wallet.pendingDeposits = user.wallet.pendingDeposits || [];
    user.wallet.pendingDeposits.unshift({
      amount: Number(amount),
      utr: normalizedUtr,
      mobileLast4: normalizedMobile,
      status: 'pending',
      requestedAt: new Date(),
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: 'Deposit request submitted successfully. Await admin approval.',
      deposit: user.wallet.pendingDeposits[0],
    });
  } catch (error) {
    console.error('Submit Deposit Request Error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request' });
  }
};

export const getDepositHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await User.findById(userId).select('wallet.pendingDeposits');
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.status(200).json({
      success: true,
      deposits: (user.wallet?.pendingDeposits || []).sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt)),
    });
  } catch (error) {
    console.error('Get Deposit History Error:', error);
    res.status(500).json({ error: 'Failed to fetch deposit history' });
  }
};

export const createDepositOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Invalid deposit amount' });
    }

    if (!validateRazorpayConfig(res)) {
      return;
    }

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency: 'INR',
      receipt: `deposit_${Date.now()}`,
      payment_capture: 1,
    });

    res.status(201).json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error('Create Deposit Order Error:', error);
    res.status(500).json({ error: 'Failed to create deposit order' });
  }
};

export const confirmDeposit = async (req, res) => {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, amount } = req.body;
    const { userId } = req.user;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature || !amount) {
      return res.status(400).json({ error: 'Payment confirmation data is required' });
    }

    if (!validateRazorpayConfig(res)) {
      return;
    }

    const razorpay = getRazorpayInstance();
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.wallet.balance += Number(amount);
    user.wallet.transactions.push({
      type: 'deposit',
      amount: Number(amount),
      description: 'Wallet deposit via Razorpay',
      timestamp: new Date(),
    });

    await user.save();

    if (user.onesignalPlayerId && user.notificationPreferences.walletNotifications) {
      await sendNotification(
        [user.onesignalPlayerId],
        '💰 Deposit successful',
        `₹${amount} has been added to your wallet.`,
        {
          type: 'success',
          priority: 9,
          data: {
            eventType: 'deposit_success',
            amount,
          },
        }
      );
    }

    user.notifications.push({
      type: 'success',
      message: `₹${amount} deposited successfully to your wallet.`,
      relatedMatch: null,
    });
    await user.save();

    res.status(200).json({
      success: true,
      balance: user.wallet.balance,
      message: 'Deposit confirmed and wallet updated',
    });
  } catch (error) {
    console.error('Confirm Deposit Error:', error);
    res.status(500).json({ error: 'Failed to confirm deposit' });
  }
};

/**
 * POST /wallet/add-balance (Admin or Internal Use)
 * Add balance to user's wallet (for deposits, bonuses, refunds)
 */
export const addBalance = async (req, res) => {
  try {
    const { userId, amount, reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const previousBalance = user.wallet.balance;
    user.wallet.balance += amount;

    user.wallet.transactions.push({
      type: reason === 'match_win' ? 'match_win' : 'deposit',
      amount,
      description: reason || 'Balance added',
      timestamp: new Date(),
    });

    await user.save();

    // Send notification
    if (user.onesignalPlayerId && user.notificationPreferences.walletNotifications) {
      await sendNotification(
        [user.onesignalPlayerId],
        '💰 Balance Updated',
        `₹${amount} added to your wallet. New balance: ₹${user.wallet.balance}`,
        {
          type: 'success',
          priority: 9,
          data: {
            eventType: 'balance_added',
            amount,
            reason,
          },
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Balance added successfully',
      previousBalance,
      addedAmount: amount,
      newBalance: user.wallet.balance,
    });
  } catch (error) {
    console.error('Add Balance Error:', error);
    res.status(500).json({ error: 'Failed to add balance' });
  }
};

/**
 * GET /wallet/transactions
 * Get user's transaction history
 */
export const getTransactionHistory = async (req, res) => {
  try {
    const { userId } = req.user;
    const { limit = 20, skip = 0 } = req.query;

    const user = await User.findById(userId).select('wallet');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transactions = user.wallet.transactions
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(parseInt(skip), parseInt(skip) + parseInt(limit));

    res.status(200).json({
      success: true,
      total: user.wallet.transactions.length,
      transactions,
      totalBalance: user.wallet.balance,
    });
  } catch (error) {
    console.error('Get Transaction History Error:', error);
    res.status(500).json({ error: 'Failed to fetch transaction history' });
  }
};

export default {
  requestWithdrawal,
  getWalletBalance,
  addBalance,
  getTransactionHistory,
  submitDepositRequest,
  getDepositHistory,
  createDepositOrder,
  confirmDeposit,
};
