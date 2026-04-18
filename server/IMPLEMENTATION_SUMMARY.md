# OneSignal Integration - Implementation Summary

## ✅ Completed Components

### 1. **User Model Enhancement** ✓
- Added `onesignalPlayerId` field to store OneSignal push notification IDs
- Added `notificationPreferences` object with:
  - `matchNotifications` (boolean)
  - `walletNotifications` (boolean)
  - `systemNotifications` (boolean)

**File:** `server/models/User.js`

---

### 2. **OneSignal Notification Service** ✓
Comprehensive reusable service with functions for:

#### Core Functions:
- `sendNotification(playerIds, title, message, options)` - Send to specific players
- `sendBroadcastNotification(title, message, options)` - Send to all active users
- `sendRetentionNotification(inactiveHours)` - Retention campaigns
- `registerPlayerNotificationId(userId, onesignalPlayerId)` - Register player
- `sendMatchEventNotification(eventType, data)` - Event-based notifications
- `updateLastActivity(userId)` - Track user engagement

**Features:**
- Axios for API calls
- Dual storage (OneSignal + in-app notifications)
- Smart filtering by user status/balance
- Error handling and logging
- Configurable priority & data payload

**File:** `server/services/notificationService.js`

---

### 3. **Match Controller Enhancements** ✓

#### `createMatch()` endpoint
- Validates user has sufficient balance
- Sends broadcast notification about new match
- Updates user's last activity
- Includes match details in notification data

#### `acceptMatch()` endpoint (enhanced)
- Notifies match creator when player joins
- Checks if match is now full, notifies all players
- Sends targeted OneSignal notifications
- Updates participant's activity timestamp

**File:** `server/controllers/matchController.js`

---

### 4. **Wallet Controller** ✓

#### `requestWithdrawal()`
- User requests withdrawal with UPI
- Validates balance and amount
- Sends push notification: "💸 Withdrawal Pending"
- Saves in-app notification

#### `getWalletBalance()`
- Returns user's current balance
- Shows pending withdrawals
- Recent transactions list

#### `addBalance()`
- Admin/internal endpoint
- Sends "💰 Balance Updated" notification
- Tracks transaction history

#### `getTransactionHistory()`
- Paginated transaction listing
- Filters by type (deposit, withdrawal, match_win, etc.)

**File:** `server/controllers/walletController.js`

---

### 5. **Wallet Routes** ✓
- `POST /wallet/withdraw` - Request withdrawal
- `GET /wallet/balance` - Get balance
- `GET /wallet/transactions` - Transaction history
- `POST /wallet/add-balance` - Add balance (admin)

All routes require authentication.

**File:** `server/routes/walletRoutes.js`

---

### 6. **Auth Routes & Controller Enhancements** ✓

#### New Endpoints:
- `POST /auth/notifications/register-push` - Register OneSignal ID
- `PUT /auth/notifications/preferences` - Update notification settings

#### Functions:
- `registerPushNotificationId()` - Store OneSignal player ID
- `updateNotificationPreferences()` - Update user preferences

**Files:**
- `server/routes/authRoutes.js`
- `server/controllers/authController.js`

---

### 7. **Cron Jobs** ✓

#### Broadcast Notification Job (Every 10 minutes)
```
Schedule: */10 * * * *
Purpose: Send match availability notifications
Targets: Active users with sufficient balance
```

#### Retention Notification Job (Every 6 hours)
```
Schedule: 0 */6 * * *
Purpose: Re-engage inactive users (24+ hours)
Targets: Non-banned users with wallet balance
```

**Features:**
- Asynchronous execution
- Error handling and logging
- Graceful start/stop
- Separate job instances

**File:** `server/utils/cronJobs.js`

---

### 8. **Environment Configuration** ✓
Added OneSignal configuration to `.env`:
```env
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
```

**File:** `server/.env.example`

---

### 9. **Server Integration** ✓
- Imported wallet routes in server.js
- Mounted at `/api/wallet`
- Rate limiting applied
- CORS configured

---

## 📊 Notification Flow Diagrams

### Match Creation Notification
```
User creates match
    ↓
Check balance
    ↓
Create Match document
    ↓
Send Broadcast
    ├─→ All active users: "🔥 New Match Available"
    └─→ Saved to in-app notifications
```

### Player Join Notification
```
Player joins match
    ↓
Add to match players
    ↓
Send to creator: "⚡ Opponent Joined"
    ↓
Check if match full
    ├─→ YES: Send to all players: "🎮 Match Ready"
    └─→ NO: Done
```

### Withdrawal Notification
```
User requests withdrawal
    ↓
Validate balance & amount
    ↓
Create withdrawal request
    ↓
Send: "💸 Withdrawal Pending"
    ├─→ OneSignal Push
    └─→ In-app notification
```

---

## 🔧 Configuration Checklist

- [ ] OneSignal account created
- [ ] App ID copied to `.env`
- [ ] REST API Key copied to `.env`
- [ ] MongoDB User model migrated (automatic)
- [ ] Wallet routes mounted in server
- [ ] Cron jobs initialized on server start
- [ ] Client OneSignal SDK integrated
- [ ] Push notification permission requested on login
- [ ] Player IDs registered via `/auth/notifications/register-push`

---

## 🚀 Quick Start API Examples

### 1. Register Push Notifications (After Login)
```bash
curl -X POST http://localhost:4000/api/auth/notifications/register-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onesignalPlayerId": "player_id_from_sdk"}'
```

### 2. Create a Match
```bash
curl -X POST http://localhost:4000/api/match/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"mode": "1v1", "type": "Headshot", "entry": 50}'
```

### 3. Join a Match
```bash
curl -X POST http://localhost:4000/api/match/accept \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"matchId": "match_id_here"}'
```

### 4. Request Withdrawal
```bash
curl -X POST http://localhost:4000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"amount": 500, "upi": "username@bankname"}'
```

### 5. Get Wallet Balance
```bash
curl -X GET http://localhost:4000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Client Implementation (React Example)

```javascript
// On app initialization
import { useEffect } from 'react';
import axios from 'axios';

export function useOneSignal() {
  useEffect(() => {
    // Initialize OneSignal
    window.OneSignal = window.OneSignal || [];
    OneSignal.push(function() {
      OneSignal.init({
        appId: process.env.REACT_APP_ONESIGNAL_APP_ID,
      });
    });

    // Handle login
    const handleLogin = async (token) => {
      try {
        // Get OneSignal player ID
        const playerId = await OneSignal.getPlayerId();
        
        // Register with backend
        await axios.post(
          '/api/auth/notifications/register-push',
          { onesignalPlayerId: playerId },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (error) {
        console.error('Failed to register push:', error);
      }
    };

    // Listen for notifications
    OneSignal.on('notificationDisplay', (event) => {
      console.log('Notification:', event.notification);
      // Update UI
    });

  }, []);
}
```

---

## 🔍 Testing Checklist

- [ ] User model saves `onesignalPlayerId` correctly
- [ ] Wallet withdrawal sends notification
- [ ] Match creation broadcasts to active users
- [ ] Match join sends notification to creator
- [ ] Match full notification sent to all players
- [ ] Cron job runs every 10 minutes for broadcast
- [ ] Cron job runs every 6 hours for retention
- [ ] In-app notifications saved alongside push
- [ ] User can update notification preferences
- [ ] Inactive users receive retention notifications

---

## 📈 Performance Considerations

**Batch Operations:**
- Notifications sent in parallel (async/await)
- User queries optimized with lean() for read-only
- Indexes on `onesignalPlayerId` and `lastActivity`

**Rate Limiting:**
- Match operations: 120/15min
- Wallet operations: 120/15min
- Auth operations: 10/1min

**Cron Job Optimization:**
- Broadcast job: 10min interval
- Retention job: 6hour interval
- Minimal database impact

---

## 🐛 Common Issues & Fixes

### Issue: "Invalid REST API Key"
**Solution:** Verify `ONESIGNAL_REST_API_KEY` in `.env` file

### Issue: Notifications not received
**Solution:** Check user has registered OneSignal ID: `user.onesignalPlayerId`

### Issue: Cron jobs not running
**Solution:** Check server logs for `[CRON]` tags, verify Node.js not in serverless environment

### Issue: Database migration errors
**Solution:** Drop and recreate `users` collection, or run migration script

---

## 📚 Files Created/Modified

### Created:
- ✅ `server/services/notificationService.js` (New)
- ✅ `server/controllers/walletController.js` (New)
- ✅ `server/routes/walletRoutes.js` (New)
- ✅ `server/ONESIGNAL_SETUP.md` (New)
- ✅ `IMPLEMENTATION_SUMMARY.md` (New - this file)

### Modified:
- ✅ `server/models/User.js` - Added OneSignal fields
- ✅ `server/controllers/matchController.js` - Added notifications
- ✅ `server/controllers/authController.js` - Added push registration
- ✅ `server/routes/authRoutes.js` - Added push endpoints
- ✅ `server/utils/cronJobs.js` - Added notification jobs
- ✅ `server/server.js` - Mounted wallet routes
- ✅ `server/.env.example` - Added OneSignal config

---

## 🎯 Next Steps

1. **Deploy:** Push changes to production
2. **Configure:** Set `ONESIGNAL_APP_ID` and `ONESIGNAL_REST_API_KEY` in production `.env`
3. **Test:** Send test notifications from OneSignal dashboard
4. **Monitor:** Check server logs for `[CRON]` execution
5. **Integrate:** Add OneSignal SDK to client app
6. **Launch:** Enable mobile and web push notifications

---

## 📞 Support

For issues or questions:
1. Check `ONESIGNAL_SETUP.md` for detailed documentation
2. Review OneSignal Dashboard for API logs
3. Check server console for `[NOTIFICATION]` or `[CRON]` logs
4. Verify `.env` configuration is complete

---

**Implementation Date:** April 18, 2026
**Status:** ✅ Complete and Ready for Testing
