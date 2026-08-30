# BR System - Complete Testing Guide

## Overview
This guide provides detailed instructions for testing the Battle Royale (BR) system implementation. All endpoints require proper authentication (JWT token) except for fetching match details.

## Prerequisites
1. Application running locally or on staging
2. API base URL: `http://localhost:5000` (or staging URL)
3. Admin account created and authenticated
4. Regular user account created and authenticated
5. Postman or curl for API testing

## Test Data

### Admin Account
- Username: `admin`
- Password: `adminpass123`
- Endpoint: `POST /api/auth/login`

### Regular User Account
- Username: `testuser`
- Password: `testpass123`
- Endpoint: `POST /api/auth/login`

---

## Test Suite 1: Authentication & Setup

### T1.1 - Admin Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "adminpass123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "username": "admin",
    "role": "admin"
  }
}
```

**Save the token as:** `ADMIN_TOKEN`

---

### T1.2 - Regular User Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGc...",
  "user": {
    "_id": "...",
    "username": "testuser",
    "wallet": {
      "balance": 100
    }
  }
}
```

**Save the token as:** `USER_TOKEN`
**Note user wallet balance for later tests**

---

## Test Suite 2: Admin BR Match Creation

### T2.1 - Create BR Match (Admin Only)
```bash
curl -X POST http://localhost:5000/api/br-match/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "matchName": "BR Tournament #001",
    "entryFee": 20,
    "scrimType": "Only Fist",
    "perKillReward": 10,
    "timerDuration": 30,
    "roomId": "123456789",
    "roomPassword": "ABC123"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "BR match created successfully",
  "match": {
    "_id": "...",
    "matchName": "BR Tournament #001",
    "entryFee": 20,
    "scrimType": "Only Fist",
    "perKillReward": 10,
    "timerDuration": 30,
    "roomId": "123456789",
    "roomPassword": "ABC123",
    "maxPlayers": 50,
    "currentPlayers": 0,
    "status": "OPEN"
  }
}
```

**Save the match ID as:** `MATCH_ID`

---

### T2.2 - Attempt to Create Match as Regular User (Should Fail)
```bash
curl -X POST http://localhost:5000/api/br-match/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "matchName": "Hacker Match",
    "entryFee": 10,
    "scrimType": "Only Fist",
    "perKillReward": 5,
    "timerDuration": 20,
    "roomId": "999999",
    "roomPassword": "HACK"
  }'
```

**Expected Response (403):**
```json
{
  "error": "Unauthorized. Admin access required."
}
```

✅ **Test Passed:** Regular users cannot create BR matches

---

## Test Suite 3: Public Match Listing

### T3.1 - List BR Matches (As Regular User)
```bash
curl -X GET "http://localhost:5000/api/br-match/list" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "matches": [
    {
      "_id": "$MATCH_ID",
      "matchName": "BR Tournament #001",
      "entryFee": 20,
      "currentPlayers": 0,
      "maxPlayers": 50,
      "scrimType": "Only Fist",
      "perKillReward": 10,
      "timerDuration": 30,
      "status": "OPEN",
      "isRegistered": false
      // NOTE: roomId and roomPassword NOT included
    }
  ],
  "count": 1
}
```

✅ **Test Passed:** Room credentials not exposed to unregistered users

---

### T3.2 - Filter Matches by Status
```bash
curl -X GET "http://localhost:5000/api/br-match/list?status=OPEN" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "matches": [
    // Only OPEN matches
  ],
  "count": 1
}
```

✅ **Test Passed:** Status filtering works

---

## Test Suite 4: User Join Flow - Step 1

### T4.1 - Check User Wallet Balance
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "user": {
    "wallet": {
      "balance": 100
    }
  }
}
```

**Note:** Balance should be at least 20 (entry fee)

---

### T4.2 - Initiate Join (Step 1 - Deduct Entry Fee)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Entry fee deducted successfully. Please enter your in-game name to complete registration.",
  "entryFeeDeducted": 20,
  "walletBalanceAfter": 80
}
```

✅ **Test Passed:** Entry fee deducted from wallet

---

### T4.3 - Verify Wallet Transaction
```bash
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "user": {
    "wallet": {
      "balance": 80,
      "transactions": [
        {
          "type": "fee",
          "amount": -20,
          "description": "BR Match entry fee: BR Tournament #001",
          "timestamp": "2025-08-30T10:30:00.000Z",
          "matchId": "$MATCH_ID"
        }
      ]
    }
  }
}
```

✅ **Test Passed:** Transaction recorded correctly

---

### T4.4 - Attempt to Join with Insufficient Balance (Should Fail)
**Setup:** Create another user with balance < 20

```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $POOR_USER_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "Insufficient wallet balance",
  "required": 20,
  "available": 5
}
```

✅ **Test Passed:** Insufficient balance blocked

---

## Test Suite 5: User Join Flow - Step 2

### T5.1 - Confirm Registration (Step 2 - Enter IGN)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{
    "inGameName": "Akash123"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Registration completed successfully!",
  "participant": {
    "inGameName": "Akash123",
    "slotNumber": 1,
    "matchName": "BR Tournament #001",
    "entryFee": 20
  },
  "match": {
    "currentPlayers": 1,
    "status": "OPEN"
  }
}
```

✅ **Test Passed:** Registration complete, slot assigned

---

### T5.2 - Verify Match Player Count Updated
```bash
curl -X GET "http://localhost:5000/api/br-match/list" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "matches": [
    {
      "_id": "$MATCH_ID",
      "currentPlayers": 1,  // Increased from 0
      "status": "OPEN"
    }
  ]
}
```

✅ **Test Passed:** Player count incremented

---

### T5.3 - Attempt Duplicate Registration (Should Fail)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "You are already registered for this match"
}
```

✅ **Test Passed:** Duplicate prevention works

---

## Test Suite 6: Room Credentials Access

### T6.1 - Get Room Credentials (As Registered User)
```bash
curl -X GET "http://localhost:5000/api/br-participant/$MATCH_ID/room" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "roomId": "123456789",
  "roomPassword": "ABC123",
  "inGameName": "Akash123",
  "scrimType": "Only Fist",
  "perKillReward": 10
}
```

✅ **Test Passed:** Room credentials visible to registered user

---

### T6.2 - Attempt to Get Room Credentials (As Unregistered User)
**Setup:** Use a different user who hasn't joined

```bash
curl -X GET "http://localhost:5000/api/br-participant/$MATCH_ID/room" \
  -H "Authorization: Bearer $OTHER_USER_TOKEN"
```

**Expected Response (403):**
```json
{
  "error": "You are not a registered participant for this match"
}
```

✅ **Test Passed:** Security: Unregistered users cannot access room credentials

---

## Test Suite 7: Slot Management

### T7.1 - Fill Match to 50 Players
**Setup:** Create 49 additional users and register them all (or use a script)

After 50th registration:
```bash
curl -X GET "http://localhost:5000/api/br-match/list" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "matches": [
    {
      "_id": "$MATCH_ID",
      "currentPlayers": 50,
      "maxPlayers": 50,
      "status": "FULL"  // Status changed to FULL
    }
  ]
}
```

✅ **Test Passed:** Status automatically changes to FULL

---

### T7.2 - Attempt to Join Full Match (Should Fail)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ANOTHER_USER_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "Match is full"
}
```

✅ **Test Passed:** Full match prevents new joins

---

## Test Suite 8: Race Condition Test

### T8.1 - Simultaneous Join Attempt (Last Slot)
**Setup:** Have a match with 49/50 players

**Action:** Send two simultaneous requests from different users to claim the last slot

**User A Request:**
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_A_TOKEN" \
  -d '{"inGameName": "Player50"}'
```

**User B Request (sent simultaneously):**
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_B_TOKEN" \
  -d '{"inGameName": "Player51"}'
```

**Expected Results:**
- One user gets 200 with slotNumber: 50, status: "FULL"
- Other user gets 400 with error: "Match is full. No more slots available."

✅ **Test Passed:** Atomic slot assignment, no race condition

---

## Test Suite 9: Admin Match Management

### T9.1 - Get Participants List (Admin Only)
```bash
curl -X GET "http://localhost:5000/api/br-match/$MATCH_ID/participants-admin" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "participants": [
    {
      "slotNumber": 1,
      "inGameName": "Akash123",
      "username": "testuser",
      "userId": "...",
      "registrationStatus": "registered",
      "entryFee": 20,
      "registrationTime": "2025-08-30T10:30:00.000Z"
    }
  ],
  "count": 1
}
```

✅ **Test Passed:** Admin can view participant details

---

### T9.2 - Update Room Credentials (Admin)
```bash
curl -X PATCH "http://localhost:5000/api/br-match/$MATCH_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "roomId": "987654321",
    "roomPassword": "UPDATED"
  }'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "BR match updated successfully",
  "match": {
    "_id": "$MATCH_ID",
    "roomId": "987654321",
    "roomPassword": "UPDATED"
  }
}
```

✅ **Test Passed:** Admin can update room details

---

### T9.3 - Verify Registered Users See Updated Credentials
```bash
curl -X GET "http://localhost:5000/api/br-participant/$MATCH_ID/room" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "roomId": "987654321",  // Updated
  "roomPassword": "UPDATED"  // Updated
}
```

✅ **Test Passed:** Updated credentials visible to participants

---

### T9.4 - Close Match (Admin)
```bash
curl -X POST "http://localhost:5000/api/br-match/$MATCH_ID/close" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "BR match closed successfully",
  "match": {
    "_id": "$MATCH_ID",
    "status": "CLOSED"
  }
}
```

✅ **Test Passed:** Match closed successfully

---

### T9.5 - Attempt to Join Closed Match (Should Fail)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/join" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_USER_TOKEN"
```

**Expected Response (400):**
```json
{
  "error": "Match is no longer accepting entries"
}
```

✅ **Test Passed:** Closed match prevents new joins

---

## Test Suite 10: Timer Verification

### T10.1 - Verify Timer Does NOT Auto-Close Match
**Setup:** 
1. Create a BR match with timerDuration: 1 (1 minute)
2. Wait 2 minutes for timer to reach 00:00

**Check match status:**
```bash
curl -X GET "http://localhost:5000/api/br-match/$MATCH_ID" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response (200):**
```json
{
  "success": true,
  "match": {
    "_id": "$MATCH_ID",
    "status": "OPEN",  // Still OPEN, NOT auto-closed
    "timerDuration": 1
  }
}
```

✅ **Test Passed:** Timer is informational only, does NOT auto-close

---

## Test Suite 11: Existing CS System Verification

### T11.1 - Verify CS Matches Still Work
```bash
curl -X GET http://localhost:5000/api/match/list \
  -H "Authorization: Bearer $USER_TOKEN"
```

**Expected Response:** Should return CS matches normally

✅ **Test Passed:** CS system unaffected

---

### T11.2 - Verify CS Wallet Deduction Still Works
```bash
curl -X POST http://localhost:5000/api/match/pay-wallet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"matchId": "$CS_MATCH_ID"}'
```

**Expected Response:** Should work normally

✅ **Test Passed:** CS wallet system unaffected

---

### T11.3 - Verify Cashfree Deposits Still Work
```bash
curl -X POST http://localhost:5000/api/wallet/deposit \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"amount": 100}'
```

**Expected Response:** Should create Cashfree order normally

✅ **Test Passed:** Cashfree integration unaffected

---

## Test Suite 12: Edge Cases

### T12.1 - Invalid In-Game Name (Too Long)
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"inGameName": "123456789012345678901234567890123456789012345678901"}' 
```

**Expected Response (400):**
```json
{
  "error": "In-game name must be between 1-50 characters"
}
```

✅ **Test Passed:** Validation works

---

### T12.2 - Empty In-Game Name
```bash
curl -X POST "http://localhost:5000/api/br-participant/$MATCH_ID/confirm" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d '{"inGameName": ""}'
```

**Expected Response (400):**
```json
{
  "error": "In-game name must be between 1-50 characters"
}
```

✅ **Test Passed:** Validation works

---

## Summary

**Total Tests:** 25+
**Pass Criteria:** All tests should pass for production readiness

### Critical Tests (Must Pass)
- ✅ Admin can create BR match
- ✅ Regular user cannot create BR match
- ✅ Entry fee deducted from wallet
- ✅ Room credentials secure (registered only)
- ✅ Duplicate join prevention
- ✅ Slot limit enforcement (50 max)
- ✅ Match status changes work
- ✅ Race condition handled
- ✅ CS system unaffected
- ✅ Timer informational only

### Command to Run All Tests
```bash
# Save this as test_br_system.sh
chmod +x test_br_system.sh
./test_br_system.sh
```

---

**Report Generated:** 2025-08-30
**BR System Status:** Ready for Testing
