# Admin API - Testing Guide

## Quick curl Examples for Testing

### Setup
```bash
# Save your admin token to a variable
export TOKEN="your_jwt_token_here"
export API="http://localhost:5000/api"
```

---

## Dashboard Stats

### Get Dashboard Overview
```bash
curl -X GET "$API/admin/stats" \
  -H "Authorization: Bearer $TOKEN"
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "activeMatches": 5,
    "totalUsers": 42,
    "pendingPayments": 2,
    "disputes": 1,
    "todayRevenue": 150.50,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

---

## Matches Management

### List All Matches
```bash
curl -X GET "$API/admin/matches?status=ongoing&limit=20&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `status` - Filter: all, payment_pending, verified, ongoing, completed, disputed, cancelled
- `limit` - Page size (default: 50)
- `page` - Page number (default: 1)

### Verify Payment for Player A
```bash
curl -X POST "$API/admin/matches/MATCH_ID/verify-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "player": "A",
    "screenshotUrl": "https://example.com/screenshot.jpg"
  }'
```

### Verify Payment for Player B
```bash
curl -X POST "$API/admin/matches/MATCH_ID/verify-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "player": "B",
    "screenshotUrl": "https://example.com/screenshot.jpg"
  }'
```

### Start a Match
```bash
curl -X POST "$API/admin/matches/MATCH_ID/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "ROOM123",
    "password": "pass456"
  }'
```

### Cancel a Match (Refund Both Players)
```bash
curl -X POST "$API/admin/matches/MATCH_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Technical issue"
  }'
```

---

## Disputes

### List Open Disputes
```bash
curl -X GET "$API/admin/disputes?limit=20&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Resolve Dispute (Award to Player A)
```bash
curl -X POST "$API/admin/matches/MATCH_ID/resolve-dispute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winner": "A"
  }'
```

### Resolve Dispute (Award to Player B)
```bash
curl -X POST "$API/admin/matches/MATCH_ID/resolve-dispute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "winner": "B"
  }'
```

---

## Users

### Search Users
```bash
curl -X GET "$API/admin/users?search=john&limit=25&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Query Parameters:**
- `search` - Username search (partial match)
- `limit` - Page size (default: 25)
- `page` - Page number (default: 1)

### Ban a User
```bash
curl -X POST "$API/admin/users/USER_ID/ban" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ban": true,
    "reason": "Cheating detected"
  }'
```

### Unban a User
```bash
curl -X POST "$API/admin/users/USER_ID/ban" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "ban": false,
    "reason": "Appeal approved"
  }'
```

### Adjust User Wallet
```bash
curl -X POST "$API/admin/users/USER_ID/adjust-wallet" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "reason": "Compensation for technical issue"
  }'
```

### Get User Profile
```bash
curl -X GET "$API/admin/users/USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Payments

### Get Pending Payments
```bash
curl -X GET "$API/admin/payments/pending" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Withdrawals

### List Pending Withdrawals
```bash
curl -X GET "$API/admin/withdrawals?status=pending" \
  -H "Authorization: Bearer $TOKEN"
```

**Status Options:** pending, approved, rejected, all

### Approve Withdrawal
```bash
curl -X POST "$API/admin/withdrawals/WITHDRAWAL_ID/approve" \
  -H "Authorization: Bearer $TOKEN"
```

### Reject Withdrawal (Refunds User)
```bash
curl -X POST "$API/admin/withdrawals/WITHDRAWAL_ID/reject" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Insufficient balance verification"
  }'
```

---

## Activity Logs

### Get All Logs
```bash
curl -X GET "$API/admin/logs?limit=50&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

### Filter Logs by Type
```bash
curl -X GET "$API/admin/logs?type=match&limit=50&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Type Options:** match, payment, user, withdrawal, dispute, all

### Filter Logs by Level
```bash
curl -X GET "$API/admin/logs?level=error&limit=50&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

**Level Options:** success, warning, error, info, all

### Filter by Both Type and Level
```bash
curl -X GET "$API/admin/logs?type=payment&level=error&limit=50&page=1" \
  -H "Authorization: Bearer $TOKEN"
```

---

## Legacy Admin Endpoints

### Get Timeout Statistics
```bash
curl -X GET "$API/admin/timeout-stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Trust Score Statistics
```bash
curl -X GET "$API/admin/trust-stats" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Suspicious Users
```bash
curl -X GET "$API/admin/suspicious-users?limit=50&minTrustScore=50" \
  -H "Authorization: Bearer $TOKEN"
```

### Adjust Trust Score
```bash
curl -X POST "$API/admin/adjust-trust-score" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID",
    "adjustment": -10,
    "reason": "Suspicious behavior"
  }'
```

---

## Testing Workflow

### Scenario: Complete Match Verification + Start

**1. View pending matches:**
```bash
curl -X GET "$API/admin/matches?status=payment_pending" \
  -H "Authorization: Bearer $TOKEN"
```

**2. Verify Player A payment:**
```bash
curl -X POST "$API/admin/matches/MATCH_ID/verify-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"player": "A", "screenshotUrl": "https://..."}'
```

**3. Verify Player B payment:**
```bash
curl -X POST "$API/admin/matches/MATCH_ID/verify-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"player": "B", "screenshotUrl": "https://..."}'
```

**4. Start the match:**
```bash
curl -X POST "$API/admin/matches/MATCH_ID/start" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"roomId": "ROOM123", "password": "pass456"}'
```

**5. Check activity logs:**
```bash
curl -X GET "$API/admin/logs?type=match&limit=10" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario: Handle Dispute

**1. List open disputes:**
```bash
curl -X GET "$API/admin/disputes" \
  -H "Authorization: Bearer $TOKEN"
```

**2. Resolve in favor of Player A:**
```bash
curl -X POST "$API/admin/matches/MATCH_ID/resolve-dispute" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"winner": "A"}'
```

**3. Verify winner received prize:**
```bash
curl -X GET "$API/admin/users/PLAYER_A_ID" \
  -H "Authorization: Bearer $TOKEN"
```

---

### Scenario: Handle Bad Actor

**1. Find suspicious user:**
```bash
curl -X GET "$API/admin/suspicious-users?limit=50&minTrustScore=30" \
  -H "Authorization: Bearer $TOKEN"
```

**2. Review user details:**
```bash
curl -X GET "$API/admin/users/USER_ID" \
  -H "Authorization: Bearer $TOKEN"
```

**3. Ban the user:**
```bash
curl -X POST "$API/admin/users/USER_ID/ban" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ban": true, "reason": "Multiple chargebacks detected"}'
```

**4. Refund if match in progress:**
```bash
curl -X POST "$API/admin/matches/MATCH_ID/cancel" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "User banned for fraud"}'
```

---

## Error Handling Examples

### 401 Unauthorized (Missing Token)
```json
{
  "error": "Unauthorized"
}
```

**Fix:** Include Authorization header with valid JWT token

### 403 Forbidden (Not Admin)
```json
{
  "error": "Admin access required"
}
```

**Fix:** User must have `role: 'admin'` in their JWT token

### 404 Not Found
```json
{
  "error": "Match not found"
}
```

**Fix:** Verify the ID exists in the database

### 400 Bad Request
```json
{
  "error": "Missing required fields: reason"
}
```

**Fix:** Include all required fields in request body

---

## Response Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | Success | Operation completed |
| 400 | Bad Request | Missing/invalid params |
| 401 | Unauthorized | Missing/invalid token |
| 403 | Forbidden | Not admin user |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Database/validation error |

---

## Tips for Testing

1. **Save credentials safely:**
   ```bash
   export TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   export API="http://localhost:5000/api"
   ```

2. **Pretty print JSON responses:**
   ```bash
   curl ... | python -m json.tool
   ```

3. **Check response headers:**
   ```bash
   curl -I -X GET "$API/admin/stats" \
     -H "Authorization: Bearer $TOKEN"
   ```

4. **Debug with verbose output:**
   ```bash
   curl -v -X GET "$API/admin/stats" \
     -H "Authorization: Bearer $TOKEN"
   ```

5. **Test in Postman:**
   - Import these examples into Postman
   - Set collection-level Authorization header
   - Use {{TOKEN}} variable for reusability
   - Save response data for future testing

---

## Common Issues & Solutions

### "Admin access required" 
- Check user has `role: 'admin'` in MongoDB
- Re-login to refresh token
- Verify JWT_SECRET matches between client and server

### "Match not found"
- Verify MATCH_ID is correct
- Check match exists in admin/matches list
- Ensure you're using the MongoDB _id, not display ID

### "User not found"
- Verify USER_ID is correct
- Check user exists in admin/users search
- Ensure using MongoDB _id

### CORS errors
- Verify frontend and backend domains match
- Check CORS middleware configuration in server.js
- Add your development origin to CORS settings

### Timeout errors
- Ensure MongoDB connection is active
- Check database indexes are created
- Verify no slow queries are running

---

**Happy testing!** 🚀
