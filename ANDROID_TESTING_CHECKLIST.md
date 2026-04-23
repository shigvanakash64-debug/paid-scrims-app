# Android Push Notification Testing Checklist

## 🚀 Pre-Deployment Checks

### 1. ✅ Verify HTTPS Deployment
```bash
# Check your production URL is HTTPS
https://paid-scrims-app.onrender.com ✅ (correct)
http://localhost:3000 ⚠️ (localhost only for dev)
```

**Browser Check:**
- Open DevTools
- Address bar should show 🔒 (lock icon)
- No "Not Secure" warnings

### 2. ✅ Verify Manifest.json
```bash
# In client/public/ you should have:
manifest.json ✓
OneSignalSDKWorkerUpdated.js ✓
```

**Browser Check:**
- Open DevTools → Network tab
- Reload page
- Filter: `manifest`
- Should see: `manifest.json` → 200 OK
- Should see: `OneSignalSDK*` files → 200 OK

### 3. ✅ Verify Service Workers
```bash
# In DevTools
DevTools → Application → Service Workers

Should see:
✓ OneSignalSDK.sw.js (active & running)
✓ No errors
```

---

## 🖥️ Desktop Chrome Testing (Baseline)

**Step 1: Setup Desktop Chrome**
```
1. Open DevTools (F12)
2. Console tab is ready
3. Network tab is ready
```

**Step 2: Login & Grant Permission**
```
1. Navigate to app
2. Click Login
3. Enter credentials
4. When prompted: "This site wants to show notifications" → Click ALLOW
5. Watch console for logs:
   ✅ "OneSignal initialized successfully"
   ✅ "Player ID captured: xxx..."
   ✅ "OneSignal Player ID registered successfully"
```

**Step 3: Check Console Logs**
```
Look for:
📱 Registering OneSignal Player ID: ...
✅ OneSignal Player ID registered successfully
📊 Notification Status:
   Username: your_username
   Has Player ID: ✅
   Player ID Preview: xxx...
```

**Step 4: Minimize/Background the App**
```
1. Open app in Chrome
2. Click Home button or Switch to another app
3. Send test notification from OneSignal Dashboard
4. Notification should appear in taskbar/notification center
5. Click notification → App should open to match page
```

---

## 📱 Android Chrome Testing

### **Phase 1: Initial Setup**

**Step 1: Prepare Android Device**
```
1. Clear Chrome data:
   Settings → Apps → Chrome → Clear Cache
   Settings → Apps → Chrome → Clear Data

2. Also clear site data:
   Settings → Apps → Chrome → Cookies, site permissions
```

**Step 2: Enable Remote Debugging**
```
On Android:
- Settings → About Phone → Developer Options (tap Build Number 7x)
- Enable "USB Debugging"

On PC:
- Connect Android via USB
- Chrome → chrome://inspect
- Allow access on Android when prompted
```

**Step 3: Open App in Chrome Mobile**
```
1. Open Chrome
2. Navigate to: https://paid-scrims-app.onrender.com
3. Wait for OneSignal to load (check console in inspect)
4. You should see notification permission prompt
5. Click ALLOW (do NOT click Deny or Skip)
```

**Step 4: Remote Debug Console Output**
```
1. On PC: chrome://inspect
2. Find your Android device
3. Click "Inspect" under Chrome tab
4. DevTools opens on PC showing Android console
5. Watch for:
   ✅ "OneSignal initialized successfully"
   ✅ "Player ID captured: xxx..."
   ✅ "OneSignal Player ID registered successfully"
```

**Step 5: Verify Player ID Registration**
```
In DevTools console on PC (showing Android):
- Look for: "📱 Registering OneSignal Player ID"
- Look for: "✅ OneSignal Player ID registered successfully"
- Look for: "📊 Notification Status: Has Player ID: ✅"

❌ If you see:
- "Player ID captured: undefined" → Permission failed
- "Has Player ID: ❌" → Backend didn't save it
```

### **Phase 2: Check OneSignal Dashboard**

**Step 1: Go to OneSignal Dashboard**
```
1. Log into OneSignal
2. Open your app
3. Navigate to: Audience → Subscribers
```

**Step 2: Look for Your Android Device**
```
You should see:
- Device showing "Web" platform
- Status: "Subscribed"
- Browser: "Chrome Mobile" or "Android"
- Last active: Recent timestamp

❌ If not there:
- Player ID wasn't sent to backend
- Check console for registration error
```

**Step 3: Filter by Method**
```
Sometimes helpful:
1. Click filters icon
2. Filter by: Platform = "Web"
3. Filter by: Status = "Subscribed"
4. Should see your device
```

### **Phase 3: Send Test Notification**

**Step 1: Create Notification**
```
1. Dashboard → Create → Notification
2. Choose: Web Push
3. Enter Title: "Test Android" 
4. Enter Message: "Does this work?"
5. Scheduling: Send Now
```

**Step 2: Choose Recipients (IMPORTANT)**
```
Option A (Easiest):
- Audience → All Subscribers
- Select your device manually if needed

Option B (Specific):
- Add Filter: Platform = Web
- Status = Subscribed
```

**Step 3: Send & Observe**
```
On Android:
- KEEP CHROME TAB OPEN
- Watch the screen for notification
- Should appear in system notification area
- Try clicking it → Should open app to Match screen

❌ If no notification:
- App might be in background too much
- Try: Keep tab focused on Android screen
- Try: Ensure Status Bar is visible
```

---

## 🔍 Debugging If Android Notifications Don't Appear

### **Checklist 1: Permission Issue**
```
❌ Symptoms: "Player ID captured: undefined"

Solution:
1. Go back to app home
2. Look for settings/permissions option
3. Manually request notification permission
4. Should show: "Notifications on" somewhere
5. Try again
```

### **Checklist 2: Player ID Not Saved**
```
❌ Symptoms: Device in OneSignal audience but no notification

Server logs should show:
  📱 [Push] Registering player ID for user xxx
  ✅ [Push] Player ID registered successfully

If not showing:
1. Check Network tab → /register-push endpoint
2. Should be POST with 200 status
3. Check response: { success: true }

If failed:
- Try logging out and back in
- Try different user account
```

### **Checklist 3: Service Worker Not Active**
```
❌ Symptoms: Player ID has value, but notifications don't come

Check:
1. DevTools → Application → Service Workers
2. Should see OneSignal worker
3. Should be "active & running"
4. No errors

If not there:
1. Hard refresh: Ctrl+Shift+R on Chrome
2. Wait 5 seconds for service worker to register
3. Check again
```

### **Checklist 4: Manifest Missing**
```
❌ Symptoms: Service worker won't register on Android

Check:
1. DevTools → Network tab
2. Search for "manifest.json"
3. Should be 200 OK
4. Search for "OneSignal"
5. Should see workers loading

If not:
1. Clear cache: Settings → Apps → Chrome → Clear Cache
2. Hard reload
```

### **Checklist 5: HTTPS Not Used**
```
❌ Symptoms: Everything works on desktop, nothing on Android

Solution:
1. Check URL: Must start with https://
2. Not http://
3. Not with ports unless localhost

Android browsers are stricter about HTTPS!
```

---

## ✅ Full Working Setup Checklist

- [ ] Site is HTTPS (or localhost)
- [ ] manifest.json loads (Network → 200 OK)
- [ ] OneSignal SDKs load (Network → 200 OK)
- [ ] Service Workers are active (DevTools → Application)
- [ ] Permission granted (notification allow clicked)
- [ ] Player ID captured (console: "Player ID captured: xxx...")
- [ ] Player ID registered (console: "... registered successfully")
- [ ] Device in OneSignal audience (Dashboard → Subscribers)
- [ ] Manual test notification sent (Dashboard → Send)
- [ ] Desktop Chrome receives notification ✅
- [ ] Android Chrome receives notification ✅

---

## 📊 Console Output Reference

### **Healthy Setup (Good Logs)**
```
✅ OneSignal initialized successfully
📱 Showing notification permission prompt...
🔔 Notification permission: ✅ Granted
📱 Player ID captured: 12345678-1234...
📬 OneSignal player ID ready, registering with backend...
📱 Registering OneSignal Player ID: 12345678...
📤 Preparing notification: "Opponent Joined"
   Players: 1 → Valid: 1
📡 Sending to OneSignal API...
✅ OneSignal Notification Sent: { title: "Opponent Joined", recipients: 1 }
📊 Notification Status:
   Username: testuser
   Has Player ID: ✅
   Player ID Preview: 12345678-1234-5...
```

### **Problem: Permission Denied**
```
🔔 Notification permission: ❌ Denied
⚠️ Notification permission not granted, skipping player ID registration
❌ SYMPTOMS: Nothing gets saved, Android will never work
FIX: Go back and click "Allow" when prompted
```

### **Problem: Player ID Not Captured**
```
📱 Player ID captured: undefined
⚠️ OneSignal Player ID not available yet
❌ SYMPTOMS: Device won't appear in OneSignal audience
FIX: Hard refresh, wait for service workers to load
```

### **Problem: Player ID Not Registered**
```
📱 Registering OneSignal Player ID: 12345678-1234...
⚠️ Failed to register OneSignal Player ID: Network Error
❌ SYMPTOMS: Device in audience but API key might be wrong
FIX: Check server .env has correct ONESIGNAL_REST_API_KEY
```

---

## 🆘 Still Not Working? Check This

1. **Is site HTTPS?** 
   - Android REQUIRES HTTPS
   - Localhost only works on desktop

2. **Is service worker loading?**
   - DevTools → Application → Service Workers
   - Should see OneSignal entry

3. **Is permission granted?**
   - Console should show: "Notification permission: ✅ Granted"
   - Not "❌ Denied"

4. **Is player ID captured?**
   - Console should show actual ID
   - Not "undefined"

5. **Is device in OneSignal?**
   - Dashboard → Audience → Subscribers
   - Filter by Web platform
   - Should see your device

6. **Are OneSignal credentials right?**
   - Server .env → ONESIGNAL_REST_API_KEY
   - Should be rest key, not app key
   - Starts with: `os_v2_`

If all above pass but still no notifications:
- Try different user account
- Try different Android device
- Check OneSignal logs for API errors
