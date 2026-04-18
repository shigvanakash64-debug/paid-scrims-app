# Clutch Zone - OneSignal Push Notifications Integration

## Overview

This document covers the complete OneSignal push notification system integrated into the Clutch Zone gaming backend. The system enables real-time event-based notifications for match creation, player joins, withdrawals, and user retention campaigns.

---

## 📋 Table of Contents

1. [Setup Guide](#setup-guide)
2. [API Endpoints](#api-endpoints)
3. [Notification Types](#notification-types)
4. [Cron Jobs](#cron-jobs)
5. [Code Examples](#code-examples)
6. [Best Practices](#best-practices)

---

## Setup Guide

### 1. Prerequisites

- Node.js backend running
- MongoDB database
- OneSignal account (free tier available)

### 2. OneSignal Setup

#### Create a OneSignal App

1. Go to [OneSignal Dashboard](https://dashboard.onesignal.com)
2. Sign up or log in
3. Create a new app and select your app type
4. Navigate to **Settings → Keys & IDs**
5. Copy your:
   - **App ID**
   - **REST API Key** (Basic Auth)

#### Add to .env File

```env
ONESIGNAL_APP_ID=your_app_id_here
ONESIGNAL_REST_API_KEY=your_rest_api_key_here
```

### 3. Database Setup

The User model has been enhanced with:

```javascript
// OneSignal Push Notification Integration
onesignalPlayerId: {
  type: String,
  default: null
},
notificationPreferences: {
  matchNotifications: Boolean,    // Match-related notifications
  walletNotifications: Boolean,   // Wallet/withdrawal notifications
  systemNotifications: Boolean    // System announcements
}
```

#### Apply Migration

No migration needed - the schema updates automatically on next user creation.

---

## API Endpoints

### Notification Registration

#### Register OneSignal Player ID

**Endpoint:** `POST /auth/notifications/register-push`

**Headers:**
```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "application/json"
}
```

**Request Body:**
```json
{
  "onesignalPlayerId": "player_id_from_onesignal_sdk"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Push notification ID registered successfully",
  "user": {
    "id": "user_id",
    "username": "player_name",
    "onesignalPlayerId": "player_id_from_onesignal_sdk"
  }
}
```

---

#### Update Notification Preferences

**Endpoint:** `PUT /auth/notifications/preferences`

**Request Body:**
```json
{
  "matchNotifications": true,
  "walletNotifications": true,
  "systemNotifications": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification preferences updated",
  "preferences": {
    "matchNotifications": true,
    "walletNotifications": true,
    "systemNotifications": true
  }
}
```

---

### Wallet Operations

#### Request Withdrawal

**Endpoint:** `POST /wallet/withdraw`

**Request Body:**
```json
{
  "amount": 500,
  "upi": "username@bankname"
}
```

**Notification Sent:**
- **To:** User who requested withdrawal
- **Title:** "💸 Withdrawal Pending"
- **Message:** "Your withdrawal request of ₹500 is being processed."

---

#### Get Wallet Balance

**Endpoint:** `GET /wallet/balance`

**Response:**
```json
{
  "success": true,
  "balance": 5000,
  "pendingWithdrawals": [],
  "recentTransactions": []
}
```

---

### Match Operations

#### Create Match

**Endpoint:** `POST /match/create`

**Request Body:**
```json
{
  "mode": "1v1",
  "type": "Headshot",
  "entry": 50
}
```

**Notifications Sent:**
- **To:** All active users with sufficient balance
- **Title:** "🔥 New Match Available"
- **Message:** "Player created a 1v1 match — join now and compete!"

---

#### Join/Accept Match

**Endpoint:** `POST /match/accept`

**Request Body:**
```json
{
  "matchId": "match_id_here"
}
```

**Notifications Sent:**

1. **To:** Match creator
   - **Title:** "⚡ Opponent Joined"
   - **Message:** "PlayerName joined your match — start now!"

2. **To:** All players (if match becomes full)
   - **Title:** "🎮 Match Ready"
   - **Message:** "All players joined! Match is ready — start playing!"

---

## Notification Types

### 1. Match Notifications (`matchNotifications`)

| Event | Title | Message | Recipient |
|-------|-------|---------|-----------|
| Match Created | 🔥 New Match Available | New match created! Join now and compete. | Active Users |
| Player Joined | ⚡ Opponent Joined | Player joined your match — start now! | Match Creator |
| Match Full | 🎮 Match Ready | Match is full — start playing! | All Players |
| Match Started | 🏁 Match Started | Your match has started. Good luck! | All Players |

### 2. Wallet Notifications (`walletNotifications`)

| Event | Title | Message | Recipient |
|-------|-------|---------|-----------|
| Withdrawal Pending | 💸 Withdrawal Pending | Your withdrawal request of ₹X is being processed. | User |
| Balance Updated | 💰 Balance Updated | ₹X added to your wallet. New balance: ₹Y | User |

### 3. System Notifications (`systemNotifications`)

| Event | Title | Message | Recipient |
|-------|-------|---------|-----------|
| Available Matches | 🔥 X Matches Waiting | There are X matches waiting. Join now! | Active Users |
| Retention Campaign | 🔥 Come Back | Come back — matches are live 🔥 | Inactive Users (24h+) |

---

## Cron Jobs

### Automatic Notification Jobs

#### 1. Broadcast Notification Job

- **Schedule:** Every 10 minutes
- **Purpose:** Notify active players about available matches
- **Criteria:**
  - Users not banned
  - Users with balance ≥ 0
  - Last active within 7 days
  - OneSignal ID registered

**Log Output:**
```
[CRON - BROADCAST] Found 5 waiting matches, sending notifications
[CRON - BROADCAST] Sent notifications to 150 active users
```

#### 2. Retention Notification Job

- **Schedule:** Every 6 hours
- **Purpose:** Bring back inactive users
- **Criteria:**
  - Users not banned
  - Last active > 24 hours ago
  - Wallet balance > 0
  - OneSignal ID registered

**Log Output:**
```
[CRON - RETENTION] Checking for inactive users (24+ hours)
[CRON - RETENTION] Sent notifications to 45 inactive users
```

### Manual Testing

To manually trigger notification jobs:

```bash
# In your Node.js console or admin endpoint
await sendBroadcastNotification("Test Title", "Test Message");
await sendRetentionNotification(24);
```

---

## Code Examples

### Client Setup (React/JavaScript)

#### 1. Initialize OneSignal SDK

```javascript
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignal.sw.js"></script>
<script>
  window.OneSignal = window.OneSignal || [];
  OneSignal.push(function() {
    OneSignal.init({
      appId: "YOUR_ONESIGNAL_APP_ID",
    });
  });
</script>
```

#### 2. Register Player ID on Login

```javascript
async function registerPushNotifications() {
  try {
    const playerId = await OneSignal.getPlayerId();
    
    const response = await axios.post(
      '/api/auth/notifications/register-push',
      { onesignalPlayerId: playerId },
      {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`
        }
      }
    );

    console.log('Push notifications registered:', response.data);
  } catch (error) {
    console.error('Failed to register push notifications:', error);
  }
}

// Call this after login
registerPushNotifications();
```

#### 3. Subscribe to Notifications

```javascript
// Listen for incoming notifications
OneSignal.on('notificationDisplay', function(event) {
  console.log('Notification displayed:', event.notification.data);
  // Update UI with notification badge
  updateNotificationBadge();
});

OneSignal.on('notificationClicked', function(event) {
  const notification = event.notification;
  
  // Handle click action based on notification type
  if (notification.data.eventType === 'match_created') {
    navigateToMatches();
  } else if (notification.data.eventType === 'player_joined') {
    navigateToMatch(notification.data.matchId);
  }
});
```

### Backend Usage

#### 1. Using the Notification Service

```javascript
import {
  sendNotification,
  sendBroadcastNotification,
  sendRetentionNotification,
  registerPlayerNotificationId,
  sendMatchEventNotification,
} from './services/notificationService.js';

// Send to specific players
await sendNotification(
  ['player_id_1', 'player_id_2'],
  'Match Title',
  'Match message'
);

// Broadcast to all active users
await sendBroadcastNotification(
  '🔥 Title',
  'Message text',
  { minBalance: 100 }
);

// Retention campaign
await sendRetentionNotification(24); // 24 hours inactive
```

#### 2. Creating Custom Event Notifications

```javascript
// When a match is completed
const result = await User.findById(winnerId);

if (result.onesignalPlayerId) {
  await sendNotification(
    [result.onesignalPlayerId],
    '🏆 Match Won!',
    `You won ₹${prizeAmount}!`,
    {
      type: 'success',
      priority: 10,
      data: {
        eventType: 'match_won',
        matchId: match._id.toString(),
        prizeAmount
      }
    }
  );
}
```

---

## Best Practices

### 1. User Consent

✅ **Always ask for permission** before registering OneSignal ID:

```javascript
// Request notification permission
const permission = await Notification.requestPermission();
if (permission === 'granted') {
  registerPushNotifications();
}
```

❌ **Don't:** Register without user consent

### 2. Notification Frequency

| Notification Type | Max Frequency | Buffer Time |
|-------------------|---------------|-------------|
| Match Related | 20/day | 5 minutes |
| Wallet Related | 10/day | 10 minutes |
| Retention | 2/week | 12 hours |

### 3. Segmentation

Always segment notifications:

```javascript
// ✅ Good: Target specific users
await User.find({
  onesignalPlayerId: { $exists: true, $ne: null },
  isBanned: false,
  'wallet.balance': { $gte: 100 }
});

// ❌ Bad: Send to everyone
await User.find({ onesignalPlayerId: { $exists: true } });
```

### 4. Error Handling

```javascript
const result = await sendNotification(playerIds, title, message);

if (result.success) {
  console.log(`Sent to ${result.recipients} users`);
} else {
  console.error('Notification failed:', result.error);
  // Log to monitoring service
  logError(result.error);
}
```

### 5. Testing

```javascript
// Test notification service
const testResult = await sendNotification(
  ['test_player_id'],
  '🧪 Test Notification',
  'This is a test message'
);

if (testResult.success) {
  console.log('✅ Notifications working');
} else {
  console.error('❌ Check OneSignal credentials');
}
```

---

## Troubleshooting

### Issue: Notifications Not Received

**Check:**

1. OneSignal credentials in `.env`
   ```bash
   echo $ONESIGNAL_APP_ID
   echo $ONESIGNAL_REST_API_KEY
   ```

2. User has registered OneSignal ID
   ```javascript
   const user = await User.findById(userId);
   console.log(user.onesignalPlayerId);
   ```

3. Notification preferences enabled
   ```javascript
   const user = await User.findById(userId);
   console.log(user.notificationPreferences);
   ```

4. OneSignal SDK loaded on client
   ```javascript
   console.log(window.OneSignal);
   ```

### Issue: "Unauthorized" Error from OneSignal

**Solution:**
- Verify `ONESIGNAL_REST_API_KEY` is correct
- Check it starts with the correct prefix
- Regenerate key in OneSignal dashboard if needed

### Issue: Player ID Not Registered

**Solution:**
```javascript
// Manual registration
await registerPlayerNotificationId(userId, onesignalPlayerId);

// Or register on login
OneSignal.on('subscriptionChange', function(event) {
  if (event.to.subscriptionStatus) {
    registerPushNotifications();
  }
});
```

---

## Monitoring & Analytics

### OneSignal Dashboard

1. Go to **Analytics** in OneSignal dashboard
2. View:
   - Delivery rate
   - Click-through rate
   - Unsubscribe rate

### Server Logs

Monitor cron job execution:

```javascript
// Check cron job status
console.log('[CRON] Broadcast notifications: Active');
console.log('[CRON - BROADCAST] Sent to 150 users');
console.log('[CRON - RETENTION] Sent to 45 users');
```

### Custom Analytics Endpoint

```javascript
// Add this to admin routes
app.get('/api/admin/notifications/stats', async (req, res) => {
  const users = await User.countDocuments({
    onesignalPlayerId: { $exists: true, $ne: null }
  });
  
  res.json({
    totalUsersWithNotifications: users,
    activeUsers: await User.countDocuments({
      lastActivity: { $gte: new Date(Date.now() - 24*60*60*1000) }
    })
  });
});
```

---

## API Reference Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/auth/notifications/register-push` | Register OneSignal ID |
| PUT | `/auth/notifications/preferences` | Update preferences |
| POST | `/wallet/withdraw` | Request withdrawal (sends notification) |
| GET | `/wallet/balance` | Get wallet details |
| POST | `/match/create` | Create match (broadcasts to users) |
| POST | `/match/accept` | Join match (notifies creator) |

---

## Support & Resources

- [OneSignal Documentation](https://documentation.onesignal.com)
- [Web Push API Guide](https://documentation.onesignal.com/docs/web-push-setup)
- [OneSignal REST API](https://documentation.onesignal.com/reference)
- Server logs: Check console output for `[CRON]` and `[NOTIFICATION]` tags

---

**Last Updated:** April 2026
**Version:** 1.0
