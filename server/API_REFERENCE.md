# API Reference - Match Results

## Quick Start

### 1. Submit Result with Screenshot
```bash
curl -X POST http://localhost:5000/api/match/submit-result \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -F "matchId=<match_id>" \
  -F "winner=<user_id>" \
  -F "screenshot=@/path/to/screenshot.png"
```

**URL**: `POST /api/match/submit-result`

**Required Headers**:
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Form Data**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| matchId | String | Yes | MongoDB Match ID |
| winner | String | Yes | User ID of declared winner |
| screenshot | File | Yes | Image file (JPEG, PNG, GIF, WebP) |

**Response (Success - 200)**:
```json
{
  "success": true,
  "message": "Result submitted successfully",
  "matchStatus": "pending",
  "submittedCount": 1,
  "totalPlayers": 2,
  "matchId": "507f1f77bcf86cd799439011",
  "screenshotUrl": "https://res.cloudinary.com/demo/image/upload/v1680000000/scrim-results/abc123.jpg"
}
```

**Response (After 2 submissions - same winner)**:
```json
{
  "success": true,
  "message": "Result submitted successfully",
  "matchStatus": "completed",
  "submittedCount": 2,
  "totalPlayers": 2,
  "matchId": "507f1f77bcf86cd799439011",
  "screenshotUrl": "https://res.cloudinary.com/demo/image/upload/v1680000001/scrim-results/def456.jpg"
}
```

**Error Responses**:
```json
// 400 - Missing fields
{
  "error": "matchId and winner are required"
}

// 400 - No screenshot
{
  "error": "Screenshot is required"
}

// 400 - Duplicate submission
{
  "error": "You have already submitted a result for this match"
}

// 401 - No token
{
  "error": "No token provided"
}

// 403 - Not a participant
{
  "error": "Only match participants can submit results"
}

// 404 - Match not found
{
  "error": "Match not found"
}

// 500 - Upload failed
{
  "error": "Upload failed: Cloudinary error message"
}
```

---

### 2. Get Match Details
```bash
curl -X GET http://localhost:5000/api/match/507f1f77bcf86cd799439011
```

**URL**: `GET /api/match/:matchId`

**Response (200)**:
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "players": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "username": "player1",
      "email": "player1@example.com"
    },
    {
      "_id": "507f1f77bcf86cd799439013",
      "username": "player2",
      "email": "player2@example.com"
    }
  ],
  "entry": 5000,
  "status": "completed",
  "result": {
    "submittedBy": [
      "507f1f77bcf86cd799439012",
      "507f1f77bcf86cd799439013"
    ],
    "screenshots": [
      {
        "user": {
          "_id": "507f1f77bcf86cd799439012",
          "username": "player1"
        },
        "image": "https://res.cloudinary.com/demo/image/upload/v1680000000/scrim-results/abc123.jpg"
      },
      {
        "user": {
          "_id": "507f1f77bcf86cd799439013",
          "username": "player2"
        },
        "image": "https://res.cloudinary.com/demo/image/upload/v1680000001/scrim-results/def456.jpg"
      }
    ],
    "winner": {
      "_id": "507f1f77bcf86cd799439012",
      "username": "player1"
    },
    "decidedAt": "2026-04-06T15:30:00.000Z",
    "paidOut": true
  },
  "createdAt": "2026-04-06T14:00:00.000Z",
  "updatedAt": "2026-04-06T15:30:00.000Z"
}
```

**Error Responses**:
```json
// 404 - Match not found
{
  "error": "Match not found"
}

// 500 - Server error
{
  "error": "Server error: database connection failed"
}
```

---

### 3. Resolve Dispute (Admin)
```bash
curl -X POST http://localhost:5000/api/match/resolve-dispute \
  -H "Authorization: Bearer <ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "matchId": "507f1f77bcf86cd799439011",
    "winnerDecision": "507f1f77bcf86cd799439012"
  }'
```

**URL**: `POST /api/match/resolve-dispute`

**Required Headers**:
```
Authorization: Bearer <ADMIN_JWT_TOKEN>
Content-Type: application/json
```

**Request Body**:
```json
{
  "matchId": "507f1f77bcf86cd799439011",
  "winnerDecision": "507f1f77bcf86cd799439012"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Dispute resolved",
  "winner": "507f1f77bcf86cd799439012"
}
```

**Error Responses**:
```json
// 400 - Missing fields
{
  "error": "matchId and winnerDecision are required"
}

// 400 - Not disputed
{
  "error": "Match is not in disputed state"
}

// 404 - Match not found
{
  "error": "Match not found"
}
```

---

## Match Status Flow

```
┌─────────────┐
│   pending   │ User creates match
└──────┬──────┘
       │
       ├─→ submit result (1st player)
       │        │
       │        └─→ timeout: 5 minutes
       │
       ├─→ submit result (2nd player, same winner)
       │        │
       │        └─→ completed ✓ Pay user
       │
       └─→ submit result (2nd player, different winner)
                │
                └─→ disputed → Admin resolves → completed ✓
```

---

## File Upload Constraints

| Property | Value |
|----------|-------|
| Max Size | 5 MB |
| Allowed Types | JPEG, PNG, GIF, WebP |
| Storage | Cloudinary (folder: scrim-results) |
| Endpoint | `/api/match/submit-result` |
| Method | POST (multipart/form-data) |

---

## Important Notes

1. **JWT Token**: Obtained from authentication endpoint (not included in this system)
2. **Atomic Operations**: Payouts use MongoDB atomic updates to prevent race conditions
3. **File Handling**: Files stored in memory, not on disk
4. **Cloudinary Folder**: Images stored in `scrim-results/` folder in Cloudinary
5. **Auto-Resolve**: If opponent doesn't submit within 5 minutes, first submitter wins
6. **Platform Fee**: 10% of total pool deducted before winner payout

---

## Testing with Postman

### 1. Set up environment variables
```
BACKEND_URL = http://localhost:5000
AUTH_TOKEN = <your_jwt_token>
MATCH_ID = <test_match_id>
USER_ID = <test_user_id>
```

### 2. Test Submit Result
```
POST {{BACKEND_URL}}/api/match/submit-result
Headers: Authorization: Bearer {{AUTH_TOKEN}}
Body > form-data:
  matchId: {{MATCH_ID}}
  winner: {{USER_ID}}
  screenshot: (select image file)
```

### 3. Test Get Match
```
GET {{BACKEND_URL}}/api/match/{{MATCH_ID}}
```

### 4. Test Resolve Dispute
```
POST {{BACKEND_URL}}/api/match/resolve-dispute
Headers: Authorization: Bearer {{AUTH_TOKEN}}
Body > raw (JSON):
{
  "matchId": "{{MATCH_ID}}",
  "winnerDecision": "{{USER_ID}}"
}
```

---

## Webhook Integration (Optional)

After match completion, you may want to:
- Send email notification to winner
- Update leaderboard
- Trigger payout transaction
- Log result to analytics

Add webhook handler in `matchController.js`:
```javascript
// After marking paidOut = true
await triggerWebhook({
  event: 'match.completed',
  matchId,
  winner: winnerId,
  amount: winnerAmount
});
```

---

**API Version**: 1.0  
**Last Updated**: April 6, 2026
