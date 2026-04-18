import User from '../models/User.js';
import { sendNotification } from '../services/notificationService.js';

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
      amount,
      description: `Withdrawal request to ${upi}`,
      timestamp: new Date(),
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
};
