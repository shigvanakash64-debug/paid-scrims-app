# 🚨 Notification Issue - Action Plan

## What We Found ❌

1. **Missing `.env` file** - OneSignal credentials not configured
2. **No debug visibility** - Couldn't see what was wrong
3. **No player ID validation** - Unknown which users had IDs registered
4. **Silent failures** - Errors not logged clearly

---

## What We Fixed ✅

### **1. Created Debug Endpoints**

```bash
# Check if everything is configured
GET http://localhost:4000/api/debug/notifications

# Send a test notification
POST http://localhost:4000/api/debug/test-notification
```

### **2. Added Enhanced Logging**

Now you'll see clear messages like:

```
═══════════════════════════════════════════════
📡 OneSignal Configuration Check:
   App ID: ✅ SET
   REST API Key: ✅ SET
═══════════════════════════════════════════════

📤 Preparing notification: "🔥 New Match Available"
   Players: 10 → Valid: 10
📡 Sending to OneSignal API...
✅ OneSignal Notification Sent: {
  title: "🔥 New Match Available",
  recipients: 10,
  notificationId: "notification-uuid"
}
```

### **3. Created `.env` File Template**

```bash
server/.env  (now exists with placeholders)
```

### **4. Created Troubleshooting Guide**

```bash
server/TROUBLESHOOTING.md  (Complete debugging guide)
```

---

## 🔧 DO THIS NOW - 4 Steps

### **Step 1: Add OneSignal Credentials to `.env`**

```bash
# Open server/.env and update:
ONESIGNAL_APP_ID=YOUR_REAL_APP_ID
ONESIGNAL_REST_API_KEY=YOUR_REAL_REST_API_KEY
```

**Where to get these:**
1. Go https://dashboard.onesignal.com
2. Click your app → Settings → Keys & IDs
3. Copy App ID and REST API Key
4. Paste into `.env` file

### **Step 2: Restart Server**

```bash
npm start
# or
node server.js
```

### **Step 3: Check Configuration**

```bash
curl http://localhost:4000/api/debug/notifications
```

**Look for:**
```json
{
  "oneSignal": {
    "appIdSet": true,           // ✅ Must be true
    "restApiKeySet": true,      // ✅ Must be true
    "configComplete": true
  }
}
```

### **Step 4: Ensure Users Register Player IDs**

Users must call this **AFTER LOGIN**:

```bash
curl -X POST http://localhost:4000/api/auth/notifications/register-push \
  -H "Authorization: Bearer JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onesignalPlayerId": "player_id_from_sdk"}'
```

**Or on client (React):**

```javascript
// After user logs in
const playerId = await OneSignal.getPlayerId();
await axios.post(
  '/api/auth/notifications/register-push',
  { onesignalPlayerId: playerId },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

---

## 🧪 Quick Test

After completing all 4 steps:

```bash
# Test notification
curl -X POST http://localhost:4000/api/debug/test-notification
```

**Check your phone/browser** - You should receive a notification within 2-5 seconds!

---

## 📊 Diagnostic Checklist

Use this to verify everything:

```
☐ OneSignal account created
☐ App ID copied to .env
☐ REST API Key copied to .env
☐ Server restarted
☐ /api/debug/notifications returns appIdSet: true
☐ /api/debug/notifications returns restApiKeySet: true
☐ Users registered player IDs (notificationPreferences not all false)
☐ /api/debug/test-notification sent successfully
☐ Device received test notification
```

---

## 🔍 Still Not Working?

Use the **debug endpoint** to identify the issue:

```bash
curl http://localhost:4000/api/debug/notifications
```

**The response will tell you exactly what's wrong:**

1. ❌ `appIdSet: false` → Add to .env
2. ❌ `restApiKeySet: false` → Add to .env
3. ❌ `withPlayerId: 0` → Users need to register player IDs
4. ✅ `systemNotifications: false` → User disabled notifications

See `TROUBLESHOOTING.md` for detailed fixes.

---

## 📁 New Files Created

```
server/.env                    ← Add your credentials here
server/TROUBLESHOOTING.md      ← Full debugging guide
server/.env (updated)          ← Already created
```

## 📝 Files Modified

```
server/services/notificationService.js  ← Better logging
server/server.js                        ← Debug endpoints
```

---

## 🎯 Expected Behavior

**When working correctly:**

- User creates match → All active users get: "🔥 New Match Available"
- Player joins → Creator gets: "⚡ Opponent Joined"
- Match full → All players get: "🎮 Match Ready"
- Withdrawal request → User gets: "💸 Withdrawal Pending"
- Every 10 min → Active users get: "🔥 X Matches Waiting"
- Every 6 hours → Inactive users get: "Come back — matches are live 🔥"

**Server logs show:**
```
✅ OneSignal Notification Sent
📤 Preparing notification
📡 Sending to OneSignal API
```

---

## 🚀 Next: Deploy to Production

After testing locally:

1. Add `.env` variables to production environment
2. Restart production server
3. Test with `/api/debug/notifications`
4. Monitor server logs for `[CRON]` tags

---

**Questions?** Check `TROUBLESHOOTING.md` for detailed solutions.

**Updated:** April 18, 2026
