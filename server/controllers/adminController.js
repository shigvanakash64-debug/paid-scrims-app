import {
  manualTriggerResolution,
  getCronJobStatus,
  getCronStats,
} from "../utils/cronJobs.js";
import TrustScoreEngine from "../utils/trustScore.js";
import ScreenshotValidator from "../utils/screenshotValidation.js";
import User from "../models/User.js";
import Match from "../models/Match.js";

/**
 * Admin endpoint to manually trigger match timeout resolution
 * Useful for testing, debugging, or forcing resolution
 */
export const triggerTimeoutResolution = async (req, res) => {
  try {
    // Ideally, check if user is admin
    // if (!req.user.isAdmin) return res.status(403).json({ error: "Admin only" });

    const result = await manualTriggerResolution(User);

    res.status(200).json({
      success: true,
      message: "Manual timeout resolution triggered",
      data: result,
    });
  } catch (error) {
    console.error("triggerTimeoutResolution error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Check cron job status
 */
export const checkCronStatus = async (req, res) => {
  try {
    const status = getCronJobStatus();
    const stats = getCronStats();

    res.status(200).json({
      success: true,
      cron: {
        status,
        stats,
      },
    });
  } catch (error) {
    console.error("checkCronStatus error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get timeout statistics (how many matches are pending)
 */
export const getTimeoutStats = async (req, res) => {
  try {
    const now = new Date();

    // Count matches by status
    const stats = {
      result_pending: await Match.countDocuments({
        status: "result_pending",
        resultDeadline: { $exists: true },
      }),
      ongoing: await Match.countDocuments({
        status: "ongoing",
        resultDeadline: { $exists: true },
      }),
      expired: await Match.countDocuments({
        status: { $in: ["result_pending", "ongoing"] },
        resultDeadline: { $exists: true, $lte: now },
      }),
      completed: await Match.countDocuments({
        status: "completed",
      }),
      disputed: await Match.countDocuments({
        status: "disputed",
      }),
      cancelled: await Match.countDocuments({
        status: "cancelled",
      }),
    };

    res.status(200).json({
      success: true,
      timestamp: now,
      stats,
    });
  } catch (error) {
    console.error("getTimeoutStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get trust score statistics
 */
export const getTrustStats = async (req, res) => {
  try {
    const trustStats = await TrustScoreEngine.getTrustStats();
    const screenshotStats = await ScreenshotValidator.getScreenshotStats();

    res.status(200).json({
      success: true,
      trust: trustStats,
      screenshots: screenshotStats,
    });
  } catch (error) {
    console.error("getTrustStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: Adjust user's trust score manually
 */
export const adjustTrustScore = async (req, res) => {
  try {
    const { userId, adjustment, reason } = req.body;
    const adminId = req.userId;

    if (!userId || !adjustment || !reason) {
      return res.status(400).json({
        error: "userId, adjustment, and reason are required"
      });
    }

    const result = await TrustScoreEngine.adjustTrustScore(userId, adjustment, reason, adminId);

    res.status(200).json({
      success: true,
      message: "Trust score adjusted",
      data: result
    });
  } catch (error) {
    console.error("adjustTrustScore error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Admin: Ban or unban user
 */
export const toggleUserBan = async (req, res) => {
  try {
    const { userId, ban, reason } = req.body;
    const adminId = req.userId;

    if (!userId) {
      return res.status(400).json({ error: "userId is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (ban) {
      user.isBanned = true;
      user.banReason = reason || "Banned by admin";
      console.log(`[ADMIN-BAN] User ${user.username} banned by admin ${adminId}: ${reason}`);
    } else {
      user.isBanned = false;
      user.banReason = null;
      user.banExpiresAt = null;
      console.log(`[ADMIN-UNBAN] User ${user.username} unbanned by admin ${adminId}`);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${ban ? 'banned' : 'unbanned'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isBanned: user.isBanned,
        banReason: user.banReason
      }
    });
  } catch (error) {
    console.error("toggleUserBan error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get users with low trust scores or suspicious activity
 */
export const getSuspiciousUsers = async (req, res) => {
  try {
    const { limit = 50, minTrustScore = 50 } = req.query;

    const users = await User.find({
      $or: [
        { trustScore: { $lt: minTrustScore } },
        { isBanned: true },
        { 'suspiciousFlags.0': { $exists: true } }
      ]
    })
    .select('username email trustScore isBanned banReason suspiciousFlags matchesPlayed disputesRaised disputesLost')
    .sort({ trustScore: 1, updatedAt: -1 })
    .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error("getSuspiciousUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get detailed user profile for admin review
 */
export const getUserProfile = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId)
      .select('-password') // Exclude password
      .populate('wallet.transactions.matchId', 'entry status');

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get user's recent matches
    const recentMatches = await Match.find({
      players: userId
    })
    .populate('players', 'username')
    .populate('result.winner', 'username')
    .sort({ createdAt: -1 })
    .limit(10);

    res.status(200).json({
      success: true,
      user,
      recentMatches
    });
  } catch (error) {
    console.error("getUserProfile error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get dashboard stats - counts, revenue, etc.
 */
export const getDashboardStats = async (req, res) => {
  try {
    const calculateCommission = (entryFee) => {
      if (entryFee <= 30) return entryFee / 3;
      if (entryFee <= 50) return entryFee * 0.4;
      return entryFee * 0.3;
    };

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [activeMatches, totalUsers, pendingPayments, disputes] = await Promise.all([
      Match.countDocuments({ status: { $in: ['ongoing', 'matched', 'verified'] } }),
      User.countDocuments({ isBanned: false }),
      Match.countDocuments({ status: 'payment_pending' }),
      Match.countDocuments({ status: 'disputed' })
    ]);

    const completedMatches = await Match.find({ status: 'completed' }).select('entry');
    const systemBalance = completedMatches.reduce((sum, match) => sum + calculateCommission(match.entry), 0);

    const todayMatches = await Match.find({
      status: 'completed',
      completedAt: { $gte: todayStart }
    }).select('entry');
    const todayRevenue = todayMatches.reduce((sum, match) => sum + calculateCommission(match.entry), 0);

    res.status(200).json({
      success: true,
      stats: {
        activeMatches,
        totalUsers,
        pendingPayments,
        disputes,
        systemBalance,
        todayRevenue,
        timestamp: now
      }
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all matches for dashboard
 */
export const getAllMatches = async (req, res) => {
  try {
    const { status = null, limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const filter = status && status !== 'all' ? { status } : {};

    const matches = await Match.find(filter)
      .populate('players', 'username trustScore')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Match.countDocuments(filter);

    res.status(200).json({
      success: true,
      matches,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getAllMatches error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all pending payments requiring admin verification
 */
export const getAllPayments = async (req, res) => {
  try {
    const { status = 'payment_pending', limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const paymentFilter = status === 'all'
      ? { status: { $in: ['matched', 'payment_pending', 'verified'] } }
      : { status };

    const [paymentMatches, resultMatches, paymentTotal] = await Promise.all([
      Match.find(paymentFilter)
        .populate('players', 'username')
        .populate('paymentScreenshots.user', 'username')
        .sort({ updatedAt: -1 })
        .skip(parseInt(skip))
        .limit(parseInt(limit)),
      Match.find({ status: 'result_pending' })
        .populate('players', 'username')
        .populate('result.screenshots.user', 'username')
        .sort({ updatedAt: -1 }),
      Match.countDocuments(paymentFilter),
    ]);

    const payments = paymentMatches.map((match) => ({
      id: match._id,
      matchId: match._id,
      players: match.players.map((player) => player.username),
      paymentScreenshots: (match.paymentScreenshots || []).map((s) => ({
        user: s.user
          ? {
              id: s.user._id?.toString ? s.user._id.toString() : s.user.toString(),
              username: s.user.username || s.user._id?.toString?.() || s.user.toString(),
            }
          : null,
        image: s.image,
        uploadedAt: s.uploadedAt,
      })),
      screenshotUrl: match.paymentScreenshots?.[0]?.image || '',
      status: match.status,
      isPaid: match.status === 'verified',
      updatedAt: match.updatedAt,
    }));

    const resultSubmissions = resultMatches.map((match) => ({
      id: match._id,
      matchId: match._id,
      players: match.players.map((player) => player.username),
      mode: match.mode,
      type: match.type,
      entry: match.entry,
      status: match.status,
      resultDeadline: match.resultDeadline,
      submittedWinner: match.result.winner ? match.result.winner.toString() : null,
      resultScreenshots: (match.result.screenshots || []).map((s) => ({
        user: s.user ? { id: s.user._id?.toString(), username: s.user.username } : { id: s.user?.toString(), username: 'Unknown' },
        image: s.image,
        uploadedAt: s.uploadedAt,
      })),
      updatedAt: match.updatedAt,
    }));

    res.status(200).json({
      success: true,
      payments,
      resultSubmissions,
      pagination: {
        total: paymentTotal,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(paymentTotal / limit),
      },
    });
  } catch (error) {
    console.error("getAllPayments error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get admin activity logs derived from match and withdrawal updates
 */
export const getAdminLogs = async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const matches = await Match.find()
      .populate('players', 'username')
      .populate('result.winner', 'username')
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit));

    const matchEvents = matches.map((match) => {
      const players = (match.players || []).map((player) => player.username).join(' vs ');
      const winnerName = match.result?.winner?.username || null;
      let action = `Match #${match._id}`;
      let details = `Status changed to ${match.status}`;
      let level = 'info';
      let type = 'match';

      if (match.status === 'completed') {
        action = 'Match Completed';
        details = winnerName ? `Match #${match._id} completed. Winner: ${winnerName}` : `Match #${match._id} completed.`;
        level = 'success';
      } else if (match.status === 'disputed') {
        action = 'Dispute Opened';
        details = `Dispute opened for Match #${match._id} (${players})`;
        level = 'warning';
      } else if (match.status === 'payment_pending') {
        action = 'Payment Pending';
        details = `Match #${match._id} awaiting payment verification`;
        level = 'info';
      } else if (match.status === 'verified') {
        action = 'Payment Verified';
        details = `Match #${match._id} payments verified`;
        level = 'success';
      } else if (match.status === 'result_pending') {
        action = 'Result Pending';
        details = `Match #${match._id} awaiting result verification`;
        level = 'info';
      }

      return {
        id: match._id.toString(),
        timestamp: match.updatedAt,
        level,
        action,
        details,
        user: 'system',
        type,
      };
    });

    const withdrawals = await User.aggregate([
      { $unwind: '$wallet.pendingWithdrawals' },
      { $sort: { 'wallet.pendingWithdrawals.processedAt': -1 } },
      { $limit: parseInt(limit) },
      {
        $project: {
          username: '$username',
          amount: '$wallet.pendingWithdrawals.amount',
          status: '$wallet.pendingWithdrawals.status',
          processedAt: '$wallet.pendingWithdrawals.processedAt'
        }
      }
    ]);

    const withdrawalEvents = withdrawals.map((withdrawal) => ({
      id: `${withdrawal.username}-${withdrawal.processedAt?.toISOString() || new Date().toISOString()}`,
      timestamp: withdrawal.processedAt || new Date(),
      level: withdrawal.status === 'approved' ? 'success' : withdrawal.status === 'rejected' ? 'error' : 'info',
      action: withdrawal.status === 'approved' ? 'Withdrawal Approved' : withdrawal.status === 'rejected' ? 'Withdrawal Rejected' : 'Withdrawal Requested',
      details: `₹${withdrawal.amount} ${withdrawal.status} for ${withdrawal.username}`,
      user: 'system',
      type: 'withdrawal',
    }));

    const users = await User.find().sort({ updatedAt: -1 }).limit(parseInt(limit));
    const transactionEvents = users
      .flatMap((user) => {
        return (user.wallet?.transactions || [])
          .filter((transaction) => transaction.type === 'match_win')
          .map((transaction) => ({
            id: `${user.username}-${transaction.matchId}-win`,
            timestamp: transaction.timestamp,
            level: 'success',
            action: 'Match Payout',
            details: `₹${transaction.amount} paid to ${user.username} for match win`,
            user: 'system',
            type: 'payout',
          }));
      })
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit) / 3);

    const logs = [...matchEvents, ...withdrawalEvents, ...transactionEvents]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, parseInt(limit));

    res.status(200).json({ success: true, logs });
  } catch (error) {
    console.error('getAdminLogs error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Verify payment for a match
 */
export const verifyPayment = async (req, res) => {
  try {
    const { matchId } = req.params;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    match.status = 'verified';
    match.paymentA = true;
    match.paymentB = true;
    match.paymentVerifiedAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: 'Payment verified for match',
      match
    });
  } catch (error) {
    console.error("verifyPayment error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject payment for a match
 */
export const rejectPayment = async (req, res) => {
  try {
    const { matchId } = req.params;
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    match.status = 'payment_failed';
    match.paymentA = false;
    match.paymentB = false;
    match.paymentRejectedAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: 'Payment rejected for match',
      match
    });
  } catch (error) {
    console.error("rejectPayment error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Start a match
 */
export const startMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { roomId, password } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    match.status = 'ongoing';
    match.roomId = roomId;
    match.roomPassword = password;
    match.startedAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: "Match started",
      match
    });
  } catch (error) {
    console.error("startMatch error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Cancel a match
 */
export const cancelMatch = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { reason } = req.body;

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    // Refund both players
    if (match.paymentA) {
      const playerA = await User.findById(match.playerA);
      if (playerA) {
        playerA.wallet.balance += match.entry;
        await playerA.save();
      }
    }

    if (match.paymentB) {
      const playerB = await User.findById(match.playerB);
      if (playerB) {
        playerB.wallet.balance += match.entry;
        await playerB.save();
      }
    }

    match.status = 'cancelled';
    match.cancelReason = reason || 'Admin cancelled';
    match.cancelledAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: "Match cancelled and both players refunded",
      match
    });
  } catch (error) {
    console.error("cancelMatch error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all disputes
 */
export const getAllDisputes = async (req, res) => {
  try {
    const { status = 'open', limit = 50, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const filter = status && status !== 'all' ? { status } : {};

    const disputes = await Match.find({ status: 'disputed' })
      .populate('players', 'username trustScore')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Match.countDocuments({ status: 'disputed' });

    res.status(200).json({
      success: true,
      disputes,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getAllDisputes error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Resolve a dispute
 */
export const resolveDispute = async (req, res) => {
  try {
    const { matchId } = req.params;
    const { winner } = req.body; // 'A' or 'B'

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({ error: "Match not found" });
    }

    const winnerId = winner === 'A' ? match.playerA : match.playerB;
    const prize = match.entry * 2;

    // Pay winner and update match stats
    const winnerUser = await User.findById(winnerId);
    if (winnerUser) {
      winnerUser.wallet.balance += prize;
      winnerUser.matchesPlayed = (winnerUser.matchesPlayed || 0) + 1;
      winnerUser.matchesWon = (winnerUser.matchesWon || 0) + 1;
      await winnerUser.save();
    }

    const loserIds = match.players
      ? match.players.map((player) => player.toString()).filter((playerId) => playerId !== winnerId.toString())
      : [];

    if (loserIds.length > 0) {
      await User.updateMany(
        { _id: { $in: loserIds } },
        { $inc: { matchesPlayed: 1, matchesLost: 1 } }
      );
    }

    // Update match
    match.status = 'completed';
    match.result.winner = winnerId;
    match.result.resolvedBy = 'admin';
    match.completedAt = new Date();

    await match.save();

    res.status(200).json({
      success: true,
      message: `Dispute resolved in favor of Player ${winner}`,
      match
    });
  } catch (error) {
    console.error("resolveDispute error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Adjust user wallet
 */
export const adjustUserWallet = async (req, res) => {
  try {
    const { userId } = req.params;
    const { amount, reason } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.wallet.balance += amount;
    user.wallet.transactions.push({
      type: 'admin_adjustment',
      amount,
      reason,
      date: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: `User wallet adjusted by ${amount > 0 ? '+' : ''}${amount}`,
      user: {
        id: user._id,
        username: user.username,
        wallet: user.wallet.balance
      }
    });
  } catch (error) {
    console.error("adjustUserWallet error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all users with search
 */
export const getAllUsers = async (req, res) => {
  try {
    const { search = '', limit = 25, page = 1 } = req.query;
    const skip = (page - 1) * limit;

    const filter = search ? { username: { $regex: search, $options: 'i' } } : {};

    const users = await User.aggregate([
      { $match: filter },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'matches',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$$userId', '$players'] },
                    { $eq: ['$status', 'completed'] }
                  ]
                }
              }
            },
            { $count: 'count' }
          ],
          as: 'matchStats'
        }
      },
      {
        $addFields: {
          matchesPlayed: {
            $ifNull: [{ $arrayElemAt: ['$matchStats.count', 0] }, '$matchesPlayed']
          }
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          trustScore: 1,
          isBanned: 1,
          matchesPlayed: 1,
          matchesWon: 1,
          createdAt: 1,
          wallet: 1
        }
      }
    ]);

    const total = await User.countDocuments(filter);

    res.status(200).json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getAllUsers error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get all pending withdrawals
 */
export const getAllWithdrawals = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Aggregate to get users with pending withdrawals
    const withdrawals = await User.aggregate([
      {
        $match: {
          'wallet.pendingWithdrawals.status': status
        }
      },
      {
        $unwind: '$wallet.pendingWithdrawals'
      },
      {
        $match: {
          'wallet.pendingWithdrawals.status': status
        }
      },
      {
        $project: {
          _id: 0,
          withdrawalId: '$wallet.pendingWithdrawals._id',
          userId: '$_id',
          username: '$username',
          amount: '$wallet.pendingWithdrawals.amount',
          status: '$wallet.pendingWithdrawals.status',
          requestedAt: '$wallet.pendingWithdrawals.requestedAt',
          processedAt: '$wallet.pendingWithdrawals.processedAt',
          adminNote: '$wallet.pendingWithdrawals.adminNote'
        }
      },
      {
        $sort: { requestedAt: -1 }
      },
      {
        $skip: skip
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    const total = await User.aggregate([
      {
        $match: {
          'wallet.pendingWithdrawals.status': status
        }
      },
      {
        $unwind: '$wallet.pendingWithdrawals'
      },
      {
        $match: {
          'wallet.pendingWithdrawals.status': status
        }
      },
      {
        $count: 'total'
      }
    ]);

    res.status(200).json({
      success: true,
      withdrawals,
      pagination: {
        total: total[0]?.total || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil((total[0]?.total || 0) / limit)
      }
    });
  } catch (error) {
    console.error("getAllWithdrawals error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Approve a withdrawal request
 */
export const approveWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNote } = req.body;

    const user = await User.findOne({
      'wallet.pendingWithdrawals._id': withdrawalId,
      'wallet.pendingWithdrawals.status': 'pending'
    });

    if (!user) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    const withdrawal = user.wallet.pendingWithdrawals.id(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    if (user.wallet.balance < withdrawal.amount) {
      return res.status(400).json({ error: "Insufficient balance for withdrawal" });
    }

    // Update withdrawal status
    withdrawal.status = 'approved';
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = adminNote;

    // Deduct from balance
    user.wallet.balance -= withdrawal.amount;

    // Add transaction record
    user.wallet.transactions.push({
      type: 'withdrawal',
      amount: -withdrawal.amount,
      description: `Withdrawal approved - ${adminNote || ''}`,
      timestamp: new Date()
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal approved successfully",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt
      }
    });
  } catch (error) {
    console.error("approveWithdrawal error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Reject a withdrawal request
 */
export const rejectWithdrawal = async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { adminNote } = req.body;

    const user = await User.findOne({
      'wallet.pendingWithdrawals._id': withdrawalId,
      'wallet.pendingWithdrawals.status': 'pending'
    });

    if (!user) {
      return res.status(404).json({ error: "Withdrawal request not found" });
    }

    const withdrawal = user.wallet.pendingWithdrawals.id(withdrawalId);
    if (!withdrawal) {
      return res.status(404).json({ error: "Withdrawal not found" });
    }

    // Update withdrawal status
    withdrawal.status = 'rejected';
    withdrawal.processedAt = new Date();
    withdrawal.adminNote = adminNote;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Withdrawal rejected successfully",
      withdrawal: {
        id: withdrawal._id,
        amount: withdrawal.amount,
        status: withdrawal.status,
        processedAt: withdrawal.processedAt
      }
    });
  } catch (error) {
    console.error("rejectWithdrawal error:", error);
    res.status(500).json({ error: error.message });
  }
};
