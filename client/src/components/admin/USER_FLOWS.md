# Admin Dashboard - User Flows & Actions

## 🎯 Main Workflows

### Flow 1: Verify & Start a Match (5 minutes)

```
1. Go to Live Matches
   ↓
2. Filter by "payment_pending" status
   ↓
3. Click "Open" on match card
   ↓
4. View Match Room Detail
   - See both players' info
   - View their payment screenshots
   ↓
5. Click "Approve" on Payment A
   ↓
6. Click "Approve" on Payment B
   ↓
7. "START MATCH" button appears
   ↓
8. Enter Room ID & Password
   ↓
9. Click "START MATCH"
   ↓
10. Match status changes to "ongoing"
    ↓
✓ DONE - Players can now play
```

---

### Flow 2: Resolve a Disputed Match (3 minutes)

```
1. Go to Disputes
   ↓
2. Review both players' proof screenshots
   (side-by-side comparison)
   ↓
3. Decide winner based on evidence
   ↓
4. Click either:
   - "Winner: Player A" → Pay A, refund B
   - "Winner: Player B" → Pay B, refund A
   ↓
5. Match marked as resolved
   ↓
✓ DONE - Funds distributed
```

---

### Flow 3: Verify Pending Payments (2 minutes each)

```
1. Go to Payments
   ↓
2. See list of pending verifications
   ↓
3. Review screenshot for authenticity
   ↓
4. Click either:
   - "Approve" → Payment verified
   - "Reject" → Player resubmits
   ↓
5. Move to next pending payment
   ↓
✓ DONE - Payment status updated
```

---

### Flow 4: Manage User Account (varies)

```
1. Go to Users
   ↓
2. Search for username or browse list
   ↓
3. Click user card for actions:

   Option A: View History
   - See all past matches
   - Check win/loss record
   - Review dispute in history

   Option B: Adjust Balance
   - Add funds (if underpaid)
   - Subtract (penalty)

   Option C: Ban/Unban
   - Suspend account (cheating, abuse)
   - Can unban later
   ↓
✓ DONE - User action applied
```

---

### Flow 5: Process Withdrawal Request (2 minutes)

```
1. Go to Withdrawals
   ↓
2. Filter by "pending" status
   ↓
3. Review withdrawal request
   - Amount
   - Payment method (UPI/Bank)
   - Account details
   ↓
4. Click either:
   - "Approve" → Process payout
   - "Reject" → Return funds to wallet
   ↓
5. Request status updates
   ↓
✓ DONE - Payout processed
```

---

### Flow 6: Monitor System Activity (ongoing)

```
1. Go to Logs OR Dashboard
   ↓
2. View recent activity feed:
   - Match events
   - Payment actions
   - Disputes opened/resolved
   - Withdrawals processed
   - Admin actions
   ↓
3. Filter by:
   - Event type (match, payment, etc)
   - Event level (info, success, warning, error)
   ↓
4. Search for specific events
   ↓
✓ DONE - System monitored
```

---

## 🎮 Screen-by-Screen Actions

### Dashboard
**Purpose:** Glance at current operations

| Element | How to Use | Result |
|---------|-----------|--------|
| Stat Cards | Read only | Know active match count, payments, etc |
| Activity Feed | Click on log entries | Deep dive into specific event |
| Quick Action Buttons | Click | Navigate to that screen |

---

### Live Matches
**Purpose:** Manage match lifecycle

| Button | When Available | What It Does |
|--------|----------------|-------------|
| Open | Always | Opens detailed match control panel |
| Cancel | Always (except ongoing) | Cancels match, refunds both players |
| Filter by Status | Always | Shows only matches with that status |

---

### Match Room Detail
**Purpose:** Complete match setup & verification

| Element | When Available | What It Does |
|---------|----------------|-------------|
| Approve (Payment A) | Before payment verified | Verify screenshot, mark paid |
| Approve (Payment B) | Before payment verified | Verify screenshot, mark paid |
| Room ID Input | After both approved | Enter room code |
| Password Input | After both approved | Enter room password |
| START MATCH | After both inputs filled | Begin match, set status to ongoing |
| Cancel Match | Always (except ongoing) | Abort match, refund players |
| Refund Both | Always (except ongoing) | Manual refund without match end |

---

### Payments
**Purpose:** Verify payment authenticity

| Button | When To Click | Result |
|--------|--------------|--------|
| Approve | Screenshot looks valid | Mark payment verified |
| Reject | Screenshot invalid/missing | Player resubmits |
| (View History) | Just info | See what was approved today |

---

### Disputes
**Purpose:** Resolve conflicting match outcomes

| Button | Meaning | Effect |
|--------|---------|--------|
| Winner: A | Player A proof looks real | Pay A, refund B |
| Winner: B | Player B proof looks real | Pay B, refund A |
| (Resolved History) | Just info | See past resolutions |

---

### Users
**Purpose:** Manage player accounts

| Action | How | Result |
|--------|-----|--------|
| Search | Type username | Filter list |
| History | Click "History" button | View all matches |
| Adjust Balance | Click "Adjust" → Enter amount | Add/subtract funds (negative = subtract) |
| Ban | Click "Ban" | Account suspended (status = Banned) |
| Unban | Click "Ban" again | Account reactivated |

---

### Withdrawals
**Purpose:** Approve/reject payout requests

| Button | When To Use | Result |
|--------|------------|--------|
| Approve | Bank details valid | Process payout |
| Reject | Suspicious account | Funds return to wallet |
| Filter Status | Navigate list | Show only pending/approved/rejected |

---

### Logs
**Purpose:** Audit system events

| Feature | How To Use | Purpose |
|---------|-----------|---------|
| Filter by Type | Click button | Show only match/payment/dispute/etc events |
| Filter by Level | Click button | Show only info/success/warning/error |
| Search Box | Type text | Find specific event |
| Timestamp | Read only | When event occurred |

---

## 🎯 Quick Reference: What Button Goes Where

### Green Buttons (Success/Positive Actions)
- ✓ Approve Payment
- ✓ Mark Winner
- ✓ Approve Withdrawal
- ✓ Verify Payment

### Orange Buttons (Primary/Important Actions)
- Open Match
- Start Match
- Ban User
- Adjust Balance
- Quick Actions on Dashboard

### Red Buttons (Dangerous/Negative Actions)
- Cancel Match
- Refund Both
- Reject Withdrawal
- Reject Payment
- Ban User

---

## ⚡ Speed Tips

### To Approve 5 Payments in 2 Minutes:
```
1. Go to Payments
2. For each card:
   - Look at screenshot (3 seconds)
   - Click Approve (1 second)
3. Done!
```

### To Start 3 Matches in 5 Minutes:
```
1. Go to Live Matches
2. Filter: payment_pending
3. For each match:
   - Click Open (1 second)
   - Click Approve A (1 second)
   - Click Approve B (1 second)
   - Enter room ID (5 seconds)
   - Enter password (5 seconds)
   - Click START (1 second)
   - Back to list (1 second)
4. Done!
```

---

## 🔍 When to Check Each Screen

| Time | Screen | Why |
|------|--------|-----|
| Morning | Dashboard | Check overnight stats |
| Morning | Withdrawals | Process overnight requests |
| During Day | Live Matches | Monitor active matches |
| During Day | Payments | Verify submission proofs |
| During Day | Disputes | Resolve conflicts quickly |
| Anytime | Logs | If something seems wrong |
| Evening | Dashboard | Final check of day |

---

## 📊 Understanding Each Screen's Data

### Dashboard
- **Active Matches**: Currently playing
- **Pending Payments**: Awaiting verification
- **Disputes**: Unresolved conflicts
- **System Wallet**: Platform's total balance
- **Today Revenue**: Commission earned today
- **Activity Feed**: Real-time event log

### Live Matches
- Status colors:
  - Gray = Not started
  - Orange = In progress
  - Green = Completed
  - Red = Cancelled
- Player A/B payment status (checkmark = paid)

### Match Room
- Shows when match was created
- Time elapsed
- If both payments verified
- Quick stats sidebar

### Payments
- Shows which match it's for
- Player name
- Upload timestamp
- Amount verified
- Screenshot for manual check

### Disputes
- Match ID of dispute
- Both players' names
- Their proof screenshots (what do they claim?)
- Your job: pick winner based on evidence

### Users
- Username
- Current wallet balance (total funds in account)
- Trust score (1-5 stars)
- Active/Banned status
- Total matches played

### Withdrawals
- User requesting withdrawal
- Amount requested
- Payment method (UPI = instant, Bank = 1-3 days)
- Their account details
- When they requested it

### Logs
- All system events in chronological order
- Color-coded by type and level
- Search to find specific issue
- Use for debugging/auditing

---

## 🚨 When to Take Action

### Immediate (Right Away)
- [ ] A player is complaining in chat
- [ ] A disputed match opened
- [ ] System balance suddenly drops
- [ ] Payment verification fails

### Today (Within Hours)
- [ ] 3+ pending payments
- [ ] 2+ active disputes
- [ ] Withdrawal requests pending

### Administrative (When Convenient)
- [ ] Review logs for patterns
- [ ] Check user trust scores
- [ ] Update user balances for contests
- [ ] Review daily revenue

---

## ✅ Daily Checklist

### Morning
- [ ] Check dashboard stats
- [ ] Review overnight logs
- [ ] Process pending withdrawals
- [ ] Check for disputes

### Throughout Day
- [ ] Verify incoming payments
- [ ] Open/start matches
- [ ] Resolve disputes within 10 mins
- [ ] Monitor active matches

### Evening
- [ ] Final check of stat dashboard
- [ ] Review day's logs
- [ ] Verify no stuck matches
- [ ] Screenshot/archive activity

---

## 🎮 Most Common Tasks (Time Required)

| Task | How Long | Frequency |
|------|----------|-----------|
| Verify payment | 30 sec | 10x/day |
| Start a match | 1 min | 20x/day |
| Resolve dispute | 2 min | 2-3x/day |
| Approve withdrawal | 1 min | 5-10x/day |
| Check logs | 5 min | 3x/day |
| Review dashboard | 1 min | 5x/day |
| Ban user | 30 sec | 1-2x/day |

---

## 🎯 Pro Tips

1. **Filter First:** Always filter before taking action (reduces options, faster decisions)
2. **Check Screenshots:** Most disputes are resolved by carefully comparing proof images
3. **Trust Pattern:** Regular players = higher trust score = faster approvals
4. **Batch Processing:** Do all payments at once, all disputes at once
5. **Mobile First:** Withdrawals/logs are read-only on mobile, perfect for commute

---

## 💡 Decision Matrix

### Payment Verification
```
Screenshot shows UPI confirmation?  → YES:  Approve ✓
Screenshot shows bank deposit?      → YES:  Approve ✓
Screenshot is unclear/blurry?       → NO:   Reject, ask resubmit
Screenshot shows wrong person?      → NO:   Ban user + Reject
```

### Dispute Resolution
```
Player A's screenshots = better quality?  → Winner: A
Player B's screenshots = better quality?  → Winner: B
Both same quality / unclear?              → Check logs + referee notes
```

### User Management
```
First time dispute?        → Don't ban, just resolve
Second dispute?            → Warn, adjust trust score
Third+ dispute or cheating → Ban + Refund victims
Abusive chat?              → Ban immediately
Never had issue?           → Trust increases score
```

---

**Remember:** Every action here affects real players and real money. Be fair, be quick, be consistent. ⚖️
