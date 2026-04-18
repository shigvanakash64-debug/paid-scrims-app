# 🔧 OneSignal Notifications - Troubleshooting Guide

## ⚠️ Quick Checklist

Use this to diagnose why notifications are NOT working:

```
Step 1: Check Configuration
Step 2: Check Users Have Player IDs
Step 3: Check User Preferences
Step 4: Test with Debug Endpoint
Step 5: Check Server Logs
```

---

## 🐛 Issue: No Notifications Coming

### **Checklist 1: OneSignal Credentials Not Set ❌**

**Symptoms:**
- Server logs show: "OneSignal credentials not configured"
- Console shows: "⚠️ OneSignal Configuration Check"

**Fix:**

1. **Check if .env file exists:**
```bash
ls -la server/.env
```

2. **If missing, create it:**
```bash
# Copy the example file
cp server/.env.example server/.env

# Edit the file and add your credentials
ONESIGNAL_APP_ID=your_real_app_id
ONESIGNAL_REST_API_KEY=your_real_rest_api_key
```

3. **Get credentials from OneSignal:**
   - Go to https://dashboard.onesignal.com
   - Click on your app
   - Go to **Settings → Keys & IDs**
   - Copy **App ID** and **REST API Key**
   - Paste into .env file

4. **Restart server:**
```bash
npm start
# or
node server.js
```

5. **Check logs** - Should see:
```
═══════════════════════════════════════════════
📡 OneSignal Configuration Check:
   App ID: ✅ SET
   REST API Key: ✅ SET
═══════════════════════════════════════════════
```

---

### **Checklist 2: No User Has OneSignal Player ID ❌**

**Symptoms:**
- Credentials are set ✅
- But notifications still not coming
- No player IDs registered

**How to check:**

1. **Access debug endpoint:**
```bash
curl http://localhost:4000/api/debug/notifications
```

**Look for:**
```json
{
  "users": {
    "total": 5,
    "withPlayerId": 0,           // ❌ This should be > 0
    "withoutPlayerId": 5,
    "percentageRegistered": "0%"
  }
}
```

**Fix - Users must register player ID:**

**On Client Side (React/Web):**

```javascript
// 1. Add OneSignal SDK to index.html
<script src="https://cdn.onesignal.com/sdks/web/v16/OneSignal.sw.js"></script>

// 2. After user login, register player ID
async function registerPushNotifications(authToken) {
  try {
    // Get player ID from OneSignal
    const playerId = await OneSignal.getPlayerId();
    
    console.log('OneSignal Player ID:', playerId);
    
    // Send to your backend
    const response = await axios.post(
      'http://localhost:4000/api/auth/notifications/register-push',
      { onesignalPlayerId: playerId },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Player ID registered:', response.data);
  } catch (error) {
    console.error('❌ Failed to register:', error);
  }
}

// Call this after login
registerPushNotifications(authToken);
```

**Backend API Call (Manual Test):**

```bash
# Replace TOKEN with actual JWT token
curl -X POST http://localhost:4000/api/auth/notifications/register-push \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"onesignalPlayerId": "player_id_from_onesignal_sdk"}'
```

---

### **Checklist 3: User Disabled Notifications ❌**

**Symptoms:**
- Player ID is registered ✅
- Credentials are set ✅
- Still no notifications

**Check Debug Endpoint:**

```bash
curl http://localhost:4000/api/debug/notifications
```

**Look for:**
```json
{
  "samples": {
    "usersWithIds": [
      {
        "username": "player1",
        "playerId": "abc123...",
        "matchNotifications": false,      // ❌ Check these!
        "walletNotifications": false,
        "systemNotifications": false
      }
    ]
  }
}
```

**Fix - Enable notifications:**

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

### **Checklist 4: OneSignal API Key Invalid 🔐**

**Symptoms:**
- Config is set ✅
- Player IDs registered ✅
- Server logs show: "Authentication failed - Check ONESIGNAL_REST_API_KEY"

**Error in logs:**
```
❌ OneSignal Notification Error: {
  message: "Unauthorized",
  status: 401,
  statusText: "Unauthorized",
  data: { errors: ["Unauthorized: Invalid REST API Key"] }
}
```

**Fix:**

1. **Verify REST API Key:**
   - Go to OneSignal Dashboard
   - Settings → Keys & IDs
   - Copy REST API Key again (full key, not truncated)

2. **Update .env:**
```env
ONESIGNAL_REST_API_KEY=YOUR_FULL_REST_API_KEY_HERE
```

3. **Restart server**

4. **Test:**
```bash
curl http://localhost:4000/api/debug/test-notification
```

---

### **Checklist 5: Invalid App ID 📱**

**Symptoms:**
- Server logs show: "Invalid request - Check payload format"
- Status: 400

**Error in logs:**
```
❌ OneSignal Notification Error: {
  message: "Bad Request",
  status: 400,
  data: { errors: ["Invalid app_id"] }
}
```

**Fix:**

1. **Check App ID format:**
   - Should be UUID: `12345678-1234-1234-1234-123456789012`
   - Check you copied full ID (not truncated)

2. **Get correct App ID:**
   - OneSignal Dashboard → Settings → Keys & IDs
   - Copy full App ID

3. **Update .env:**
```env
ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012
```

4. **Restart server**

---

## 🧪 Testing Notifications

### **Test 1: Check Configuration**

```bash
curl http://localhost:4000/api/debug/notifications
```

**Expected Response:**
```json
{
  "oneSignal": {
    "appIdSet": true,
    "restApiKeySet": true,
    "configComplete": true
  },
  "users": {
    "withPlayerId": 5,
    "percentageRegistered": "100%"
  }
}
```

---

### **Test 2: Send Test Notification**

```bash
curl -X POST http://localhost:4000/api/debug/test-notification
```

**Expected Response:**
```json
{
  "success": true,
  "result": {
    "success": true,
    "notificationId": "notification-uuid",
    "recipients": 1
  },
  "testUser": {
    "username": "testuser",
    "playerId": "abc123def456..."
  },
  "message": "Check your device for notification in a few seconds"
}
```

**What to check on your device:**
- ✅ Notification appears after a few seconds
- ✅ Title: "🧪 Test Notification"
- ✅ Message: "This is a test notification from Clutch Zone backend"

---

### **Test 3: Create Match (Real Test)**

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

**Server should log:**
```
📤 Preparing notification: "🔥 New Match Available"
   Players: 10 → Valid: 10
📡 Sending to OneSignal API...
   URL: https://onesignal.com/api/v1/notifications
   App ID: 12345678...
✅ OneSignal Notification Sent: {
  title: "🔥 New Match Available",
  recipients: 10,
  notificationId: "notification-uuid"
}
```

**Device should receive:** 
- 🔥 New Match Available

---

## 📊 Checking Server Logs

### **Look for these logs:**

**✅ Working Properly:**
```
✅ OneSignal Notification Sent
📤 Preparing notification
📡 Sending to OneSignal API
```

**❌ Problems:**
```
❌ OneSignal Notification Error
⚠️  OneSignal credentials not configured
⚠️  No valid player IDs provided
❌ Authentication failed
```

### **How to view logs (depending on deployment):**

**Local Development:**
```bash
npm start
```
Logs appear in console

**Production (Vercel):**
```bash
# View logs
vercel logs your-app-name
```

**Production (Heroku):**
```bash
heroku logs --tail --app your-app-name
```

**Production (Digital Ocean):**
```bash
# SSH into server
ssh root@your-server-ip

# View logs
tail -f /var/log/your-app.log
```

---

## 🚀 Full Setup Process (Start to Finish)

### **1. Create OneSignal App**

```
1. Go to https://onesignal.com
2. Click "Sign Up"
3. Create account with email
4. Create new app
5. Select platform (Web Push, Mobile, etc.)
6. Copy App ID and REST API Key
```

### **2. Update .env File**

```bash
cd server
cat > .env << EOF
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/paid-scrims
PORT=5000
AUTH_SECRET=your_secret
ONESIGNAL_APP_ID=12345678-1234-1234-1234-123456789012
ONESIGNAL_REST_API_KEY=abc123def456ghi789
NODE_ENV=production
EOF
```

### **3. Restart Server**

```bash
npm start
```

### **4. Verify Config**

```bash
curl http://localhost:4000/api/debug/notifications
```

### **5. Register Client**

Add OneSignal SDK to client and call:

```javascript
const response = await axios.post(
  '/api/auth/notifications/register-push',
  { onesignalPlayerId: playerId },
  { headers: { Authorization: `Bearer ${token}` } }
);
```

### **6. Test Notification**

```bash
curl -X POST http://localhost:4000/api/debug/test-notification
```

---

## 🆘 Still Not Working?

### **Debug Steps:**

1. **Check MongoDB:**
```bash
# Connect to MongoDB and check users
db.users.findOne({ username: "testuser" }, { onesignalPlayerId: 1 })

# Should show:
{ "_id": ObjectId(...), "onesignalPlayerId": "player_id_here" }
```

2. **Check Network:**
```bash
# Test OneSignal API directly
curl -X POST https://onesignal.com/api/v1/notifications \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic YOUR_REST_API_KEY" \
  -d '{
    "app_id": "YOUR_APP_ID",
    "include_player_ids": ["test_player_id"],
    "headings": {"en": "Test"},
    "contents": {"en": "Test message"}
  }'
```

3. **Enable Debug Logging:**

Add this to `notificationService.js`:

```javascript
console.log('📊 Payload being sent:', JSON.stringify(payload, null, 2));
console.log('Headers:', {
  'Content-Type': 'application/json',
  'Authorization': `Basic ${ONESIGNAL_REST_API_KEY.substring(0, 10)}...`
});
```

4. **Check OneSignal Dashboard:**
   - Go to OneSignal Dashboard
   - Check "Notifications" section
   - Look for "Delivery" logs
   - View error messages

---

## 📞 Getting More Help

**OneSignal Support:**
- Docs: https://documentation.onesignal.com
- API Ref: https://documentation.onesignal.com/reference
- Status: https://status.onesignal.com

**Common OneSignal Issues:**
- Invalid REST API Key → Regenerate in settings
- Invalid App ID → Copy from settings again
- No subscribers → Users must opt-in to push
- Rate limiting → Free tier has limits

---

## ✅ Success Indicators

When everything is working:

1. ✅ `/api/debug/notifications` shows:
   - `appIdSet: true`
   - `restApiKeySet: true`
   - `percentageRegistered: > 0%`

2. ✅ Server logs show:
   - `✅ OneSignal Notification Sent`
   - `recipients: X`

3. ✅ Device receives notification within 2-5 seconds

4. ✅ Cron jobs run:
   ```
   [CRON - BROADCAST] Sent notifications to X users
   [CRON - RETENTION] Sent notifications to X users
   ```

---

**Last Updated:** April 18, 2026
