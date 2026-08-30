# Battle Royale (BR) System Implementation Guide

## Overview
This document outlines the complete BR paid scrim system implementation within Clutch Zone. The BR system is completely separate from the existing CS (Counter-Strike) system and does NOT modify any CS functionality.

## Architecture Summary

### Backend Components

#### Models
1. **BRMatch.js** - Stores BR match configuration
   - matchName, entryFee, scrimType, perKillReward
   - timerDuration, roomId, roomPassword
   - currentPlayers (0-50), maxPlayers (fixed at 50)
   - status (OPEN, FULL, CLOSED, COMPLETED)

2. **BRParticipant.js** - Stores participant registrations
   - userId, brMatchId, inGameName
   - entryFee, status (registered/cancelled)
   - slotNumber (1-50), registrationTimestamp

#### Controllers
1. **brMatchController.js** - BR match management
   - `createBRMatch()` - Admin only
   - `getBRMatch()` - Public
   - `listBRMatches()` - Public (with security filtering)
   - `updateBRMatch()` - Admin only
   - `closeBRMatch()` - Admin only
   - `getBRMatchParticipants()` - Admin only

2. **brParticipantController.js** - Participant actions
   - `initiateBRJoin()` - Step 1: Wallet deduction
   - `confirmBRRegistration()` - Step 2: In-game name entry
   - `getBRRoomCredentials()` - Only for registered participants
   - `getBRParticipants()` - Participant list
   - `checkBRRegistration()` - Registration status check

#### Routes (brRoutes.js)
All routes are prefixed with `/api/br-match/` and `/api/br-participant/`

**Admin Routes:**
- `POST /create` - Create BR match
- `PATCH /:matchId` - Update match
- `POST /:matchId/close` - Close match
- `GET /:matchId/participants-admin` - List participants (admin)

**User Routes:**
- `GET /list` - List all BR matches
- `GET /:matchId` - Get match details
- `POST /:matchId/join` - Step 1 of joining (wallet deduction)
- `POST /:matchId/confirm` - Step 2 of joining (confirm registration)
- `GET /:matchId/room` - Get room credentials (registered only)
- `GET /:matchId` - Get participants list
- `GET /:matchId/check-registration` - Check if user is registered

### Frontend Components

#### User Components
1. **BRMatchCard.jsx** - Display individual BR match
   - Shows: name, entry fee, players, scrim type, per-kill reward, timer
   - Actions: JOIN or View Details (if already registered)

2. **BRJoinFlow.jsx** - 2-step join modal
   - Step 1: Show match info, deduct fee button
   - Step 2: Enter in-game name, confirm button

3. **BRDetailView.jsx** - Match detail modal
   - Full match info, room credentials (if registered), participants list
   - Copy button for room ID/password

4. **BRMatchSection.jsx** - Main BR section
   - Display list of BR matches
   - Filter by status (OPEN, FULL, CLOSED, ALL)
   - Integrate into existing UI under "My Match", "Live Opponent" sections

#### Admin Components
1. **AdminBRMatchPanel.jsx** - Admin dashboard for BR matches
   - Create new BR match form
   - List of matches with status
   - Edit room ID/password
   - View participants
   - Close match

### Wallet Integration
The BR system uses the existing Clutch Zone wallet system:
- Entry fee deducted from `user.wallet.balance`
- Transaction recorded with type: 'fee'
- Atomic operation to prevent double-charging
- No Cashfree integration for BR (only for wallet deposits)

## Joining Flow

```
User sees BR Match card
  ↓
Clicks JOIN
  ↓
Frontend opens BRJoinFlow modal (Step 1)
  ↓
Backend validates:
  - Match exists and is OPEN/not FULL
  - User not already registered
  - Wallet has sufficient balance
  ↓
Backend deducts entry fee from wallet
  ↓
Frontend moves to Step 2 (in-game name entry)
  ↓
User enters in-game name and clicks CONFIRM
  ↓
Backend validates:
  - Match still accepting entries
  - Slot still available
  - User not already registered (duplicate check)
  ↓
Backend creates BRParticipant record
  ↓
Backend increments match.currentPlayers
  ↓
If currentPlayers reaches 50, status → FULL
  ↓
User sees room credentials (Room ID + Password)
  ↓
Join successful!
```

## Security Measures

1. **Backend Validation**
   - All wallet checks performed on backend
   - Entry fee amount verified against match config
   - Player count atomically protected (no race condition)
   - Slot assignment verified on backend

2. **Room Credentials Access**
   - Room ID/Password only returned to registered participants
   - API checks if user is registered before returning credentials
   - Unregistered users get 403 error

3. **Duplicate Prevention**
   - Composite unique index on (userId, brMatchId)
   - Double-click protection via validation
   - Slot not occupied until registration complete

4. **Admin Access Control**
   - Only admin users can create BR matches
   - Only admin can close matches
   - Only admin can view participant list
   - Middleware verifies `req.isAdmin` flag

## Database Indexes

**BRParticipant:**
- Unique composite index: `{ userId: 1, brMatchId: 1 }`
- Regular index: `{ brMatchId: 1, slotNumber: 1 }`

**BRMatch:**
- Index on status: `{ status: 1 }`
- Index on creation date: `{ createdAt: -1 }`

## API Response Examples

### Create BR Match (Admin)
```
POST /api/br-match/create
{
  "matchName": "BR Tournament #001",
  "entryFee": 20,
  "scrimType": "Only Fist",
  "perKillReward": 10,
  "timerDuration": 30,
  "roomId": "123456789",
  "roomPassword": "ABC123"
}

Response:
{
  "success": true,
  "match": {
    "_id": "...",
    "matchName": "BR Tournament #001",
    "status": "OPEN",
    "currentPlayers": 0,
    "maxPlayers": 50,
    ...
  }
}
```

### List BR Matches
```
GET /api/br-match/list

Response:
{
  "success": true,
  "matches": [
    {
      "_id": "...",
      "matchName": "BR Tournament #001",
      "entryFee": 20,
      "currentPlayers": 15,
      "maxPlayers": 50,
      "status": "OPEN",
      "isRegistered": false,
      // Room details NOT included if not registered
    },
    ...
  ]
}
```

### Join BR Match (Step 1)
```
POST /api/br-participant/:matchId/join

Response:
{
  "success": true,
  "message": "Entry fee deducted successfully. Please enter your in-game name to complete registration.",
  "entryFeeDeducted": 20,
  "walletBalanceAfter": 80
}
```

### Confirm BR Registration (Step 2)
```
POST /api/br-participant/:matchId/confirm
{
  "inGameName": "Akash123"
}

Response:
{
  "success": true,
  "message": "Registration completed successfully!",
  "participant": {
    "inGameName": "Akash123",
    "slotNumber": 16,
    "matchName": "BR Tournament #001"
  },
  "match": {
    "currentPlayers": 16,
    "status": "OPEN"
  }
}
```

### Get Room Credentials (Registered Only)
```
GET /api/br-participant/:matchId/room

Response (if registered):
{
  "success": true,
  "roomId": "123456789",
  "roomPassword": "ABC123",
  "inGameName": "Akash123",
  "scrimType": "Only Fist",
  "perKillReward": 10
}

Response (if not registered):
{
  "error": "You are not a registered participant for this match"
}
```

## Integration Points

### With Existing UI
1. The BR section appears alongside "My Match" and "Live Opponent"
2. Uses same styling/theme as existing Clutch Zone UI
3. Same wallet display and balance check
4. Same notification/alert system

### With Admin Dashboard
1. New "BR Match" tab in admin dashboard
2. Appears after "Users" tab
3. Create BR match form
4. Match management (list, edit, close)
5. Participant viewing

### Preserved Systems
- CS match system completely untouched
- Wallet system reused (no separate BR wallet)
- Authentication and authorization unchanged
- Notification system available for BR events
- Admin panel structure maintained

## Testing Checklist

- [ ] Admin can create BR match
- [ ] Normal user cannot create BR match (403 error)
- [ ] User with insufficient wallet balance cannot join
- [ ] User with sufficient balance can join (Step 1)
- [ ] Entry fee is deducted from wallet
- [ ] User can complete Step 2 with in-game name
- [ ] Player count increases after confirmation
- [ ] Same user cannot register twice
- [ ] Room credentials visible only to registered user
- [ ] Unregistered user cannot access room credentials (403 error)
- [ ] Match marks FULL when 50 players registered
- [ ] FULL match prevents new joins
- [ ] Admin can close match
- [ ] Closed match prevents new joins
- [ ] Timer does NOT auto-close match
- [ ] Participants list shows slot numbers and names
- [ ] Race condition test: 2 users try to claim last slot (only 1 succeeds)
- [ ] Existing CS system works exactly as before
- [ ] Wallet deposit (Cashfree) works as before

## Files Added

### Backend
- `server/models/BRMatch.js`
- `server/models/BRParticipant.js`
- `server/controllers/brMatchController.js`
- `server/controllers/brParticipantController.js`
- `server/routes/brRoutes.js`

### Frontend
- `client/src/components/BRMatchCard.jsx`
- `client/src/components/BRJoinFlow.jsx`
- `client/src/components/BRDetailView.jsx`
- `client/src/components/BRMatchSection.jsx`
- `client/src/screens/AdminBRMatchPanel.jsx`

### Styling
- Appended to `client/src/App.css` (BR component styles)

### Integration
- Updated `server/server.js` (imported brRoutes, mounted endpoints)

## Next Steps for Integration

1. **Import BRMatchSection in main screen:**
   ```jsx
   import BRMatchSection from './components/BRMatchSection';
   
   // In HomeScreen or appropriate location:
   <BRMatchSection user={user} />
   ```

2. **Add BR panel to AdminDashboard:**
   ```jsx
   import AdminBRMatchPanel from './screens/AdminBRMatchPanel';
   
   // Add navigation tab for BR Match
   // Render AdminBRMatchPanel when selected
   ```

3. **Update Admin navigation:**
   - Add "BR Match" link in admin panel navigation
   - Place after "Users" tab

4. **Test all endpoints:**
   - Use Postman or API testing tool
   - Test both authenticated and unauthenticated requests
   - Verify all error cases

5. **Deploy:**
   - Push changes to production
   - Monitor error logs
   - Verify wallet transactions recorded correctly
   - Confirm no CS system issues

## Support & Troubleshooting

### Issue: Entry fee not deducted
- Check: Is wallet balance being fetched correctly?
- Check: Is the backend update being saved with `await user.save()`?
- Check: Transaction record created in wallet.transactions array?

### Issue: User can register twice
- Check: Is BRParticipant unique index on (userId, brMatchId)?
- Check: Is duplicate check happening before creation?

### Issue: Room credentials visible to unregistered users
- Check: Is backend verifying participant status before returning credentials?
- Check: Frontend not storing/caching room credentials?

### Issue: Match doesn't show as FULL when 50 players
- Check: Is match.currentPlayers being incremented?
- Check: Is status update to FULL happening after increment?
- Check: Is updated match being saved?

---

**Last Updated:** 2025-08-30
**Version:** 1.0
**Status:** Ready for Integration
