import axios from 'axios';
import User from '../models/User.js';

const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;
const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;

let configValidated = false;

// ✅ LOG CONFIGURATION ON STARTUP (called after dotenv is loaded)
const validateConfig = () => {
  if (configValidated) return; // Only validate once
  configValidated = true;

  const hasAppId = !!ONESIGNAL_APP_ID;
  const hasRestKey = !!ONESIGNAL_REST_API_KEY;

  console.log('\n═══════════════════════════════════════════════');
  console.log('📡 OneSignal Configuration Check:');
  console.log(`   App ID: ${hasAppId ? '✅ SET' : '❌ MISSING'}`);
  console.log(`   REST API Key: ${hasRestKey ? '✅ SET' : '❌ MISSING'}`);
  console.log('═══════════════════════════════════════════════\n');

  if (!hasAppId || !hasRestKey) {
    console.warn(
      '⚠️  OneSignal credentials missing! Notifications will NOT be sent.'
    );
    console.warn('   Please add to .env file:');
    console.warn('   ONESIGNAL_APP_ID=your_app_id');
    console.warn('   ONESIGNAL_REST_API_KEY=your_rest_api_key');
  }
};

// Export validateConfig for external calling
export { validateConfig };

/**
 * Send notification to specific players via OneSignal
 * @param {Array<string>} playerIds - Array of OneSignal player IDs
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @param {Object} options - Additional options (actionButtons, data, etc.)
 * @returns {Promise<Object>} OneSignal API response
 */
export const sendNotification = async (playerIds, title, message, options = {}) => {
  // Validate config on first use
  validateConfig();
  try {
    // ✅ VALIDATION: Check if credentials are set
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error(
        '❌ OneSignal credentials not configured. Set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in .env'
      );
      return {
        success: false,
        error: 'OneSignal credentials missing. Add to .env file.',
      };
    }

    // Filter out null/undefined player IDs
    const validPlayerIds = playerIds.filter(id => id && id.trim());

    console.log(`📤 Preparing notification: "${title}"`);
    console.log(`   Players: ${playerIds.length} → Valid: ${validPlayerIds.length}`);
    console.log(`   Valid Player IDs:`, validPlayerIds);

    if (validPlayerIds.length === 0) {
      console.warn('⚠️  No valid player IDs provided for notification');
      return { success: false, message: 'No valid player IDs' };
    }

    // Also save notification to in-app notification center
    await Promise.all(
      playerIds.map(async (playerId) => {
        try {
          const user = await User.findOne({ onesignalPlayerId: playerId });
          if (user && user.notificationPreferences?.systemNotifications) {
            user.notifications.push({
              type: options.type || 'info',
              message: message,
              link: options.link || null,
              relatedMatch: options.matchId || null,
            });
            await user.save();
          }
        } catch (err) {
          console.error(`Error saving in-app notification for ${playerId}:`, err.message);
        }
      })
    );

    // Prepare OneSignal payload
    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_player_ids: validPlayerIds,
      headings: { en: title },
      contents: { en: message },
      url: options.url || undefined,
      big_picture: options.bigPicture || null,
      ios_attachments: options.iosAttachments || null,
      data: options.data || {},
      priority: options.priority || 10, // High priority
    };

    // Remove null values  
    Object.keys(payload).forEach(
      key => payload[key] === null && delete payload[key]
    );

    console.log(`📡 Sending to OneSignal API...`);
    console.log(`   URL: ${ONESIGNAL_API_URL}`);
    console.log(`   App ID: ${ONESIGNAL_APP_ID.substring(0, 8)}...`);

    // Send to OneSignal
    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      timeout: 5000,
    });

    console.log('✅ OneSignal Notification Sent:', {
      title,
      recipients: validPlayerIds.length,
      notificationId: response.data?.body?.id,
    });

    return {
      success: true,
      notificationId: response.data?.body?.id,
      recipients: validPlayerIds.length,
    };
  } catch (error) {
    console.error('❌ OneSignal Notification Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
    });

    // More detailed error messages
    if (error.response?.status === 401) {
      console.error('🔐 Authentication failed - Check ONESIGNAL_REST_API_KEY');
    } else if (error.response?.status === 400) {
      console.error('📋 Invalid request - Check payload format');
      console.error('Response:', error.response?.data);
    } else if (error.code === 'ECONNABORTED') {
      console.error('⏱️  Request timeout - OneSignal API not responding');
    }

    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Send notification to active users who can join matches
 * @param {string} title - Notification title
 * @param {string} message - Notification message
 * @returns {Promise<Object>} Result of notification send
 */
export const sendBroadcastNotification = async (title, message, options = {}) => {
  try {
    // Get active users with sufficient balance and not in a match
    const activeUsers = await User.find({
      onesignalPlayerId: { $exists: true, $ne: null },
      isBanned: false,
      'wallet.balance': { $gte: options.minBalance || 0 },
      lastActivity: {
        $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
      },
    }).select('onesignalPlayerId');

    const playerIds = activeUsers
      .map(user => user.onesignalPlayerId)
      .filter(id => id);

    if (playerIds.length === 0) {
      console.log('No active users found for broadcast');
      return { success: false, message: 'No active users' };
    }

    return sendNotification(playerIds, title, message, options);
  } catch (error) {
    console.error('❌ Broadcast Notification Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send notification to inactive users (retention campaign)
 * @param {number} inactiveHours - Hours of inactivity threshold (default: 24)
 * @returns {Promise<Object>} Result of notification send
 */
export const sendRetentionNotification = async (
  inactiveHours = 24
) => {
  try {
    const inactiveThreshold = new Date(
      Date.now() - inactiveHours * 60 * 60 * 1000
    );

    // Find inactive users
    const inactiveUsers = await User.find({
      onesignalPlayerId: { $exists: true, $ne: null },
      isBanned: false,
      lastActivity: { $lt: inactiveThreshold },
      'wallet.balance': { $gt: 0 }, // Only users with balance
    }).select('onesignalPlayerId');

    const playerIds = inactiveUsers
      .map(user => user.onesignalPlayerId)
      .filter(id => id);

    if (playerIds.length === 0) {
      console.log('No inactive users found for retention campaign');
      return { success: false, message: 'No inactive users' };
    }

    return sendNotification(
      playerIds,
      'Come Back to Clutch Zone',
      `Come back — matches are live 🔥 Your balance: Ready to compete!`,
      {
        type: 'info',
        priority: 9,
      }
    );
  } catch (error) {
    console.error('❌ Retention Notification Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Register or update a player's OneSignal ID
 * @param {string} userId - User's MongoDB ID
 * @param {string} onesignalPlayerId - OneSignal player ID
 * @returns {Promise<Object>} Updated user
 */
export const registerPlayerNotificationId = async (userId, onesignalPlayerId) => {
  try {
    if (!onesignalPlayerId) {
      return { success: false, error: 'OneSignal Player ID is required' };
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { onesignalPlayerId },
      { new: true }
    );

    console.log(`✅ Registered OneSignal ID for user ${userId}`);

    return {
      success: true,
      message: 'OneSignal ID registered successfully',
      user,
    };
  } catch (error) {
    console.error('❌ Register Player Notification ID Error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send targeted notification based on match event
 * @param {string} eventType - Type of event: 'match_created', 'player_joined', 'match_full', 'match_started'
 * @param {Object} data - Event data (playerIds, matchId, etc.)
 * @returns {Promise<Object>} Result of notification send
 */
export const sendMatchEventNotification = async (eventType, data) => {
  const { playerIds, matchCreatorId, creatorPlayerId, matchId } = data;

  const timestamps = {
    'match_created': new Date().toISOString(),
    'player_joined': new Date().toISOString(),
    'match_full': new Date().toISOString(),
    'match_started': new Date().toISOString(),
  };

  const eventConfig = {
    match_created: {
      title: '🔥 New Match Available',
      message: 'New match created! Join now and compete.',
      targetPlayers: playerIds,
    },
    player_joined: {
      title: '⚡ Opponent Joined',
      message: 'Someone joined your match — start now!',
      targetPlayers: [creatorPlayerId],
    },
    match_full: {
      title: '🎮 Match Ready',
      message: 'Match is full — start playing!',
      targetPlayers: playerIds,
    },
    match_started: {
      title: '🏁 Match Started',
      message: 'Your match has started. Good luck!',
      targetPlayers: playerIds,
    },
  };

  const config = eventConfig[eventType];
  if (!config) {
    console.error(`Unknown event type: ${eventType}`);
    return { success: false, error: 'Unknown event type' };
  }

  return sendNotification(config.targetPlayers, config.title, config.message, {
    matchId,
    type: 'success',
    priority: 10,
    data: {
      eventType,
      matchId,
      timestamp: timestamps[eventType],
    },
  });
};

/**
 * Update user's last activity timestamp
 * @param {string} userId - User's MongoDB ID
 * @returns {Promise<Object>} Result
 */
export const updateLastActivity = async (userId) => {
  try {
    await User.findByIdAndUpdate(userId, {
      lastActivity: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('❌ Update Last Activity Error:', error.message);
    return { success: false, error: error.message };
  }
};

export default {
  sendNotification,
  sendBroadcastNotification,
  sendRetentionNotification,
  registerPlayerNotificationId,
  sendMatchEventNotification,
  updateLastActivity,
};
