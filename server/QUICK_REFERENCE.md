# ⚡ OneSignal Notifications - Quick Reference

## 🚀 Quick Start Commands

### 1️⃣ Check if Notifications Configured

```bash
curl http://localhost:4000/api/debug/notifications
```

**Expected output should show:**
- `appIdSet: true`
- `restApiKeySet: true`
- `configComplete: true`

---

### 2️⃣ Send Test Notification

```bash
curl -X POST http://localhost:4000/api/debug/test-notification
```

**Expected output:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "notificationId": "uuid-here",
    "recipients": 1
  }
}
```

**Check your device** - Notification should appear in 2-5 seconds

---

### 3️⃣ Register Player ID (After User Login)

Replace `YOUR_JWT_TOKEN` with real token:

```bash
curl -X POST http://localhost:4000/api/auth/notifications/register-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onesignalPlayerId": "player_id_from_onesignal_sdk"}'
```

---

### 4️⃣ Update User Notification Preferences

```bash
curl -X PUT http://localhost:4000/api/auth/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "matchNotifications": true,
    "walletNotifications": true,
    "systemNotifications": true
  }'
```

---

### 5️⃣ Create Match (Should Trigger Notifications)

```bash
curl -X POST http://localhost:4000/api/match/create \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "1v1",
    "type": "Headshot",
    "entry": 50
  }'
```

**Server logs should show:**
```
✅ OneSignal Notification Sent
📤 Preparing notification: "🔥 New Match Available"
```

---

### 6️⃣ Request Withdrawal (Should Trigger Notifications)

```bash
curl -X POST http://localhost:4000/api/wallet/withdraw \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "upi": "username@bankname"
  }'
```

**Device gets:** "💸 Withdrawal Pending"

---

### 7️⃣ Get Wallet Balance

```bash
curl -X GET http://localhost:4000/api/wallet/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

### 8️⃣ Get Transaction History

```bash
curl -X GET http://localhost:4000/api/wallet/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📱 Client-Side Integration

### Add OneSignal SDK to HTML

```html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignal.sw.js"></script>
```

### Initialize OneSignal in React

```javascript
import OneSignal from 'react-onesignal';

useEffect(() => {
  OneSignal.init({
    appId: 'YOUR_ONESIGNAL_APP_ID'
  });
}, []);
```

### Register Player ID After Login

```javascript
async function registerNotifications(authToken) {
  try {
    const playerId = await OneSignal.getPlayerId();
    
    const response = await axios.post(
      '/api/auth/notifications/register-push',
      { onesignalPlayerId: playerId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Notifications registered');
  } catch (error) {
    console.error('❌ Failed:', error);
  }
}
```

---

## 🔧 Setup Checklist

```bash
# 1. Create .env file (if not exists)
cp server/.env.example server/.env

# 2. Edit .env with OneSignal credentials
nano server/.env
# Add:
# ONESIGNAL_APP_ID=your_app_id
# ONESIGNAL_REST_API_KEY=your_rest_api_key

# 3. Restart server
npm start

# 4. Verify config
curl http://localhost:4000/api/debug/notifications

# 5. Test notification
curl -X POST http://localhost:4000/api/debug/test-notification
```

---

## 🐛 Common Issues & Fixes

### Issue: "No valid player IDs provided"

**Cause:** No users have registered OneSignal player IDs

**Fix:**
```javascript
// On client after login
const playerId = await OneSignal.getPlayerId();
await axios.post('/api/auth/notifications/register-push', 
  { onesignalPlayerId: playerId },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

### Issue: "OneSignal credentials not configured"

**Cause:** .env missing or ONESIGNAL_APP_ID/REST_API_KEY not set

**Fix:**
```bash
# 1. Check if .env exists
ls -la server/.env

# 2. If not, create it
cat > server/.env << EOF
ONESIGNAL_APP_ID=your_app_id
ONESIGNAL_REST_API_KEY=your_rest_api_key
EOF

# 3. Restart server
npm start
```

---

### Issue: "Unauthorized: Invalid REST API Key"

**Cause:** REST API Key is invalid or incomplete

**Fix:**
```bash
# 1. Go to https://dashboard.onesignal.com
# 2. Settings → Keys & IDs
# 3. Copy full REST API Key (not truncated)
# 4. Update .env
ONESIGNAL_REST_API_KEY=full_key_here

# 5. Restart
npm start
```

---

### Issue: Notifications disabled for user

**Cause:** User has notification preferences set to false

**Fix:**
```bash
# Enable all notifications
curl -X PUT http://localhost:4000/api/auth/notifications/preferences \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "matchNotifications": true,
    "walletNotifications": true,
    "systemNotifications": true
  }'
```

---

## 📊 Debug Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/debug/notifications` | Check config & users |
| POST | `/api/debug/test-notification` | Send test notification |
| POST | `/api/auth/notifications/register-push` | Register player ID |
| PUT | `/api/auth/notifications/preferences` | Update preferences |

---

## 🎯 Notification Types

| Event | Title | Message |
|-------|-------|---------|
| Match Created | 🔥 New Match Available | New match created! Join now and compete. |
| Player Joined | ⚡ Opponent Joined | PlayerName joined your match — start now! |
| Match Full | 🎮 Match Ready | All players joined! Match is ready — start playing! |
| Withdrawal | 💸 Withdrawal Pending | Your withdrawal request of ₹X is being processed. |
| Balance Added | 💰 Balance Updated | ₹X added to your wallet. New balance: ₹Y |
| Matches Available | 🔥 X Matches Waiting | There are X matches waiting for players. Join now! |
| Retention | 🔥 Come Back | Come back — matches are live 🔥 |

---

## 📈 Cron Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Broadcast | Every 10min | Notify active users about available matches |
| Retention | Every 6hours | Notify inactive users (24h+) to come back |

---

## 🔗 Useful Links

- [OneSignal Dashboard](https://dashboard.onesignal.com)
- [OneSignal API Docs](https://documentation.onesignal.com/reference)
- [Web Push Setup](https://documentation.onesignal.com/docs/web-push-setup)

---

## 💡 Tips

✅ **Always restart server after changing `.env`**

```bash
npm start
```

✅ **Check server logs for errors:**

```bash
# Look for [NOTIFICATION], [CRON], ❌ symbols
npm start 2>&1 | grep -E "\[|✅|❌"
```

✅ **Test on different devices:**
- Mobile browser
- Desktop browser  
- App notification

✅ **Monitor OneSignal Dashboard:**
- Go to Notifications section
- Check delivery status
- View error logs

---

**Version:** 1.0
**Last Updated:** April 18, 2026
