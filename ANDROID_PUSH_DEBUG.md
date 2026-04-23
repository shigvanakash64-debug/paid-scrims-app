# Android Push Notification Testing Guide

## ✅ Prerequisites Check

### 1. **HTTPS Requirement** (MANDATORY)
- Your app MUST be served over HTTPS
- ✅ Vercel deployments are HTTPS by default
- ✅ Local development: Use `http://localhost` (allowed for testing)
- ❌ Android push will NOT work over plain HTTP

**Check your deployment URL:**
```
https://paid-scrims-app.onrender.com ✅ (good)
http://app.example.com ❌ (won't work on Android)
```

### 2. **Manifest.json** (CRITICAL)
- Verify manifest is linked in `index.html`: `<link rel="manifest" href="/manifest.json" />`
- Check it loads: Open DevTools → Network → search for `manifest.json`
- File should be at: `/public/manifest.json`

### 3. **Service Worker**
- Open DevTools → Application → Service Workers
- You should see at least one service worker registered
- OneSignal auto-creates: `https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js`

---

## 🧪 Android Testing Steps

### **On Android (Chrome Mobile)**

**Step 1: Clear Everything**
```
Settings → Apps → Chrome → Clear Cache
Settings → Apps → Chrome → Clear Data
```

**Step 2: Open Your App**
```
1. Open Chrome on Android
2. Go to: https://paid-scrims-app.onrender.com
3. Allow notifications when prompted ✅
4. KEEP TAB OPEN (don't close)
```

**Step 3: Check Subscription Status**
```
1. Open DevTools (Chrome Mobile): Remote Debug
   → chrome://inspect → Your Device
2. Check Console for logs:
   ✅ "OneSignal initialized successfully"
   ✅ "Player ID captured: xxx..."
   ✅ "Push subscription status: { isOptedIn: true }"
```

**Step 4: Verify in OneSignal Dashboard**
```
1. Log into OneSignal dashboard
2. Go to: Audience → Subscribers
3. Filter by platform: "Web"
4. Look for your Android user:
   ✅ Should show your device
   ✅ Platform: "Web"
   ✅ Status: "Subscribed"
   ❌ Not there? = Subscription failed
```

**Step 5: Send Manual Test Notification**
```
1. OneSignal Dashboard → Create Notification
2. Select: Web Push
3. Choose: Audience → "All Subscribers" (or filter by your device)
4. Enter Title & Message
5. Click "Send Now"
6. Watch your Android Chrome tab → notification should appear
```

---

## 🔍 Debugging Checklist

### **If you don't see subscription on Android:**

❌ **Problem: "Player ID captured: undefined"**
- Service Worker not registered
- Try: Refresh page, check network speed

❌ **Problem: "Push subscription status: { isOptedIn: false }"**
- User didn't grant permission
- Solution: Go back and allow notifications

❌ **Problem: Device not in OneSignal audience**
- Player ID wasn't sent to backend
- Check browser console for `📱 Registering OneSignal Player ID`
- If missing: Permission wasn't granted

❌ **Problem: Notification doesn't appear on Android**
- App was closed after granting permission (keep tab open!)
- Service Worker issue
- Try: Hard refresh (Cmd+Shift+R / Ctrl+Shift+R)

### **If Desktop Chrome works but Android doesn't:**

1. **Check manifest.json is loading:**
   - DevTools → Network tab
   - Search for `manifest.json`
   - Should return 200 OK

2. **Check Service Workers:**
   - Remote debug Android
   - `chrome://inspect`
   - DevTools → Application → Service Workers
   - Should see OneSignal worker

3. **Verify HTTPS:**
   - URL should start with `https://`
   - Not `http://`

---

## 📱 What Should Happen

### **On Android (Correct Setup)**

1. **Page loads** → OneSignal initializes
2. **Permission prompt** → User clicks "Allow"
3. **Player ID captured** → Logged in console
4. **Backend registers** → User → `onesignalPlayerId` updated
5. **Send notification** → OneSignal Dashboard
6. **Notification appears** → Even with tab in background

### **Common Issue: "User thinks they subscribed but didn't"**

Check in OneSignal Dashboard:
```
Audience → Subscribers

NO devices? 
→ User didn't actually subscribe (permission denied)
→ Show permission prompt again

YES your device shows up?
→ Subscription worked
→ Backend is receiving notifications correctly
→ Sending logic might be the issue
```

---

## 🔧 Backend Verification

Run this query on your server to check if player IDs are saving:

```bash
# In MongoDB
db.users.findOne({ _id: ObjectId("your-user-id") })

# Check if this field has a value:
{
  "onesignalPlayerId": "xxxxxxx-xxxx-xxxx..." ✅
}

# If it's null or missing → player ID not being registered
# If it has value → check OneSignal API key in .env
```

---

## 🚀 Production Checklist

- [ ] Site is served over HTTPS
- [ ] manifest.json is in /public
- [ ] manifest.json is linked in index.html
- [ ] OneSignal app ID is correct
- [ ] OneSignal REST API key is in server .env
- [ ] Service Workers are loading
- [ ] User can grant notification permission
- [ ] Player ID is showing in console
- [ ] Device appears in OneSignal audience
- [ ] Manual test notification works

---

## 📞 If Still Not Working

**Check these in order:**

1. **HTTPS?** No → Deploy to HTTPS first
2. **Manifest?** No manifest.json link → Add it
3. **Permission?** Not granted → Show prompt again
4. **Player ID?** Undefined → Service Worker issue
5. **Audience?** No devices → Player ID not sent to backend
6. **API Key?** Check OneSignal REST API key is correct
