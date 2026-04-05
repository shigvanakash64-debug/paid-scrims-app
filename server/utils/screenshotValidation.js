import crypto from 'crypto';
import Match from '../models/Match.js';

/**
 * Screenshot Validation Utility
 * Handles screenshot validation, duplicate detection, and metadata extraction
 */

class ScreenshotValidator {
  /**
   * Generate hash for screenshot buffer
   */
  static generateHash(buffer) {
    return crypto.createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Validate screenshot before upload
   */
  static async validateScreenshot(buffer, userId, matchId) {
    try {
      const hash = this.generateHash(buffer);

      // Check file size (max 5MB)
      if (buffer.length > 5 * 1024 * 1024) {
        return { valid: false, reason: 'File too large (max 5MB)' };
      }

      // Check if this is a duplicate in the match
      const match = await Match.findById(matchId);
      if (!match) {
        return { valid: false, reason: 'Match not found' };
      }

      if (match.hasDuplicateScreenshot(hash)) {
        match.validationFlags.duplicateDetected = true;
        await match.save();
        return { valid: false, reason: 'Duplicate screenshot detected' };
      }

      // Basic validation passed
      return {
        valid: true,
        hash,
        metadata: {
          fileSize: buffer.length,
          mimeType: this.detectMimeType(buffer),
          uploadedAt: new Date()
        }
      };
    } catch (error) {
      console.error('[SCREENSHOT-VALIDATION] Error validating screenshot:', error);
      return { valid: false, reason: 'Validation error' };
    }
  }

  /**
   * Detect MIME type from buffer
   */
  static detectMimeType(buffer) {
    // Check magic bytes
    if (buffer.length < 4) return 'application/octet-stream';

    const header = buffer.slice(0, 4);

    // JPEG
    if (header[0] === 0xFF && header[1] === 0xD8) {
      return 'image/jpeg';
    }

    // PNG
    if (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4E && header[3] === 0x47) {
      return 'image/png';
    }

    // GIF
    if (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) {
      return 'image/gif';
    }

    // WebP
    if (header[0] === 0x52 && header[1] === 0x49 && header[2] === 0x46 && header[3] === 0x46) {
      return 'image/webp';
    }

    return 'application/octet-stream';
  }

  /**
   * Extract image dimensions (basic implementation)
   * In production, you'd use a library like sharp or jimp
   */
  static async getImageDimensions(buffer) {
    // This is a simplified version. In production, use proper image processing library
    try {
      // For now, return placeholder dimensions
      // You should implement proper dimension extraction
      return { width: 1920, height: 1080 };
    } catch (error) {
      console.error('[SCREENSHOT-VALIDATION] Error getting dimensions:', error);
      return { width: 0, height: 0 };
    }
  }

  /**
   * Check for suspicious patterns in screenshots
   */
  static detectSuspiciousPatterns(metadata, userHistory) {
    const flags = [];

    // Check if user frequently uploads screenshots at the same time
    if (userHistory && userHistory.length > 0) {
      const recentUploads = userHistory.filter(upload =>
        Date.now() - upload.uploadedAt < 60000 // Within 1 minute
      );

      if (recentUploads.length > 2) {
        flags.push('rapid_uploads');
      }
    }

    // Check file size anomalies
    if (metadata.fileSize < 10000) { // Suspiciously small
      flags.push('unusually_small');
    }

    return flags;
  }

  /**
   * Admin function to flag screenshot as fake
   */
  static async flagAsFake(matchId, screenshotUserId, adminId) {
    try {
      const match = await Match.findById(matchId);
      if (!match) throw new Error('Match not found');

      // Find the screenshot
      const screenshot = match.result.screenshots.find(s =>
        s.user.toString() === screenshotUserId.toString()
      );

      if (!screenshot) throw new Error('Screenshot not found');

      // Mark as suspicious
      match.validationFlags.suspiciousActivity = true;
      match.validationFlags.adminReviewed = true;

      await match.save();

      // Update user's trust score
      const TrustScoreEngine = (await import('./trustScore.js')).default;
      await TrustScoreEngine.onFakeScreenshot(screenshotUserId);

      console.log(`[ADMIN-FLAG] Screenshot flagged as fake in match ${matchId} by admin ${adminId}`);

      return { success: true };
    } catch (error) {
      console.error('[SCREENSHOT-VALIDATION] Error flagging screenshot:', error);
      throw error;
    }
  }

  /**
   * Get screenshot statistics for admin dashboard
   */
  static async getScreenshotStats() {
    try {
      const stats = await Match.aggregate([
        {
          $group: {
            _id: null,
            totalScreenshots: { $sum: { $size: '$result.screenshots' } },
            matchesWithDuplicates: {
              $sum: { $cond: ['$validationFlags.duplicateDetected', 1, 0] }
            },
            matchesWithSuspicious: {
              $sum: { $cond: ['$validationFlags.suspiciousActivity', 1, 0] }
            },
            adminReviewed: {
              $sum: { $cond: ['$validationFlags.adminReviewed', 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalScreenshots: 0,
        matchesWithDuplicates: 0,
        matchesWithSuspicious: 0,
        adminReviewed: 0
      };
    } catch (error) {
      console.error('[SCREENSHOT-VALIDATION] Error getting stats:', error);
      return null;
    }
  }
}

export default ScreenshotValidator;