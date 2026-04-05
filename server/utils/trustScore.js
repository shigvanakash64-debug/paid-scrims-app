import User from '../models/User.js';

/**
 * Trust Score Engine
 * Manages trust score calculations and updates
 */

class TrustScoreEngine {
  // Trust score change constants
  static SCORES = {
    VALID_MATCH_COMPLETION: 5,
    BOTH_AGREE_RESULT: 10,
    LOSE_DISPUTE: -15,
    CONFLICT_SUBMISSION: -10,
    FAKE_SCREENSHOT: -20,
    REPEATED_DISPUTES: -30
  };

  /**
   * Update trust score for valid match completion
   */
  static async onValidMatchCompletion(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      await user.updateTrustScore(this.SCORES.VALID_MATCH_COMPLETION, 'Valid match completion');
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for valid match completion:', error);
    }
  }

  /**
   * Update trust score when both players agree on result
   */
  static async onBothAgreeResult(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      await user.updateTrustScore(this.SCORES.BOTH_AGREE_RESULT, 'Both players agreed on result');
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for both agree result:', error);
    }
  }

  /**
   * Update trust score when user loses a dispute
   */
  static async onLoseDispute(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.disputesLost += 1;
      await user.updateTrustScore(this.SCORES.LOSE_DISPUTE, 'Lost dispute');
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for lost dispute:', error);
    }
  }

  /**
   * Update trust score for conflict submission (both claim win)
   */
  static async onConflictSubmission(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      await user.updateTrustScore(this.SCORES.CONFLICT_SUBMISSION, 'Conflict submission');
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for conflict submission:', error);
    }
  }

  /**
   * Update trust score for fake screenshot (admin flagged)
   */
  static async onFakeScreenshot(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      user.suspiciousFlags.push({ type: 'fake_screenshot' });
      await user.updateTrustScore(this.SCORES.FAKE_SCREENSHOT, 'Fake screenshot flagged');
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for fake screenshot:', error);
    }
  }

  /**
   * Update trust score for repeated disputes
   */
  static async onRepeatedDisputes(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return;

      // Check if user has raised multiple disputes recently
      const recentDisputes = user.disputesRaised;
      if (recentDisputes >= 3) {
        user.suspiciousFlags.push({ type: 'repeated_disputes' });
        await user.updateTrustScore(this.SCORES.REPEATED_DISPUTES, 'Repeated disputes');
      }
    } catch (error) {
      console.error('[TRUST-SCORE] Error updating for repeated disputes:', error);
    }
  }

  /**
   * Check if user can join a match based on trust score and entry fee
   */
  static async canJoinMatch(userId, entryFee) {
    try {
      const user = await User.findById(userId);
      if (!user) return { allowed: false, reason: 'User not found' };

      if (user.isBanned) {
        return { allowed: false, reason: 'User is banned' };
      }

      if (user.isTemporarilyBanned()) {
        return { allowed: false, reason: 'User is temporarily banned' };
      }

      if (!user.canJoinHighEntryMatch(entryFee)) {
        return { allowed: false, reason: 'Trust score too low for high-entry match' };
      }

      return { allowed: true };
    } catch (error) {
      console.error('[TRUST-SCORE] Error checking match join permission:', error);
      return { allowed: false, reason: 'System error' };
    }
  }

  /**
   * Get trust score statistics
   */
  static async getTrustStats() {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            averageTrustScore: { $avg: '$trustScore' },
            highTrustUsers: {
              $sum: { $cond: [{ $gte: ['$trustScore', 80] }, 1, 0] }
            },
            mediumTrustUsers: {
              $sum: {
                $cond: [
                  { $and: [{ $gte: ['$trustScore', 40] }, { $lt: ['$trustScore', 80] }] },
                  1,
                  0
                ]
              }
            },
            lowTrustUsers: {
              $sum: { $cond: [{ $lt: ['$trustScore', 40] }, 1, 0] }
            },
            bannedUsers: {
              $sum: { $cond: ['$isBanned', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalUsers: 0,
        averageTrustScore: 0,
        highTrustUsers: 0,
        mediumTrustUsers: 0,
        lowTrustUsers: 0,
        bannedUsers: 0
      };
    } catch (error) {
      console.error('[TRUST-SCORE] Error getting trust stats:', error);
      return null;
    }
  }

  /**
   * Admin function to manually adjust trust score
   */
  static async adjustTrustScore(userId, adjustment, reason, adminId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const oldScore = user.trustScore;
      const newScore = Math.max(0, Math.min(100, oldScore + adjustment));

      user.trustScore = newScore;

      // Log admin action
      console.log(`[ADMIN-TRUST] Admin ${adminId} adjusted ${user.username} trust score: ${oldScore} → ${newScore} (${adjustment > 0 ? '+' : ''}${adjustment}) - ${reason}`);

      await user.save();
      return { success: true, oldScore, newScore };
    } catch (error) {
      console.error('[TRUST-SCORE] Error adjusting trust score:', error);
      throw error;
    }
  }
}

export default TrustScoreEngine;