# Admin Dashboard Documentation

## Overview

A complete, production-ready Admin Dashboard for real-time operations control in the Paid Scrims app. This is a **financial + operations dashboard**, not a basic UI panel.

**Key Features:**
- Real-time match control
- Payment verification
- Dispute resolution
- User management & banning
- Withdrawal request handling
- System activity logs
- Responsive (desktop + mobile)
- Zero gradients, clean design
- Black + orange color scheme

---

## 📁 File Structure

```
client/src/
├── components/
│   ├── AdminPanel.jsx                    # Main export (dual-mode)
│   └── admin/
│       ├── AdminLayout.jsx               # Main router/layout
│       ├── AdminSidebar.jsx              # Navigation sidebar
│       ├── AdminComponents.jsx           # Reusable UI components
│       └── index.js                      # Exports
│
└── screens/
    ├── AdminDashboard.jsx                # Overview + stats
    ├── LiveMatches.jsx                   # Match list + filtering
    ├── MatchRoomDetail.jsx               # Match control center
    ├── PaymentsPanel.jsx                 # Payment verification
    ├── DisputesPanel.jsx                 # Dispute resolution
    ├── UsersPanel.jsx                    # User management
    ├── WithdrawalsPanel.jsx              # Withdrawal requests
    └── LogsPanel.jsx                     # System activity logs
```

---

## 🚀 Usage

### Option 1: Full Admin Dashboard (Desktop/Dedicated Admin Panel)

```jsx
import { AdminLayout } from '@/components/admin';

function AdminProtal({ user }) {
  // Check if user is admin
  if (user.role !== 'admin') return <Redirect />;
  
  return <AdminLayout />;
}
```

### Option 2: Match-Specific Admin Controls (In-Match)

Keep using `<AdminPanel>` with props for in-match verification:

```jsx
<AdminPanel
  players={players}
  verifiedUsers={verifiedUsers}
  onVerify={handleVerify}
  roomData={roomData}
  onRoomChange={handleRoomChange}
  onStartMatch={handleStart}
  // ... other props
/>
```

---

## 📋 Screen Reference

### 🏠 Dashboard
**Purpose:** Real-time overview of all operations

**Shows:**
- Active matches count
- Pending payments
- Open disputes
- System wallet balance
- Today's revenue
- Recent activity feed (expandable)

**Actions:**
- Quick navigation to Matches, Payments, Disputes

---

### 🎮 Live Matches
**Purpose:** Manage all ongoing and pending matches

**Features:**
- Filter by status (waiting, payment pending, verified, ongoing, completed, cancelled)
- Card view with player names, mode, entry, payment status
- Inline action buttons (Open, Cancel)

**Actions:**
- **Open**: Launches MatchRoomDetail
- **Cancel**: Cancels match (with refund)

---

### 🔧 Match Room Detail
**Purpose:** Core operations control for a single match

**Sections:**

#### Match Info
- Host / Opponent names
- Mode (Valorant, CSGO, etc)
- Entry type

#### Payment Verification
- Side-by-side payment cards
- Screenshot preview
- Approve/Reject buttons
- Status indicator (Verified/Pending)

#### Start Match (appears when both verified)
- Room ID input
- Password input
- START MATCH button
- Quick stats sidebar

#### Actions
- Cancel Match
- Refund Both

---

### 💳 Payments
**Purpose:** Verify player payment screenshots

**Shows:**
- Pending payment verifications
- Screenshot preview
- Approve/Reject buttons
- History of verified payments

---

### ⚠️ Disputes
**Purpose:** Resolve match outcome conflicts

**Shows:**
- Disputed match ID
- Both players' screenshot proofs
- Side-by-side comparison

**Actions:**
- Mark Winner (Player A or B)
- Auto-refund loser / Pay winner
- History of resolved disputes

---

### 👤 Users
**Purpose:** Manage player accounts

**Features:**
- Search by username
- Filter (Active / Banned)
- Wallet balance display
- Trust score (1-5⭐)
- Match count

**Actions:**
- View Match History (detailed breakdown)
- Adjust Wallet (add/subtract funds)
- Ban/Unban user

**Detailed View:** Shows recent matches with results

---

### 💸 Withdrawals
**Purpose:** Process player withdrawal requests

**Features:**
- Filter (Pending / Approved / Rejected)
- User info + amount
- Payment method (UPI / Bank Transfer)
- Account details
- Request timestamp

**Actions:**
- Approve (processes payout)
- Reject (returns funds to wallet)

**Stats:** Total per status (pending, approved, rejected)

---

### 📜 Logs
**Purpose:** Real-time system activity tracking

**Features:**
- Filter by event type (match, payment, dispute, withdrawal, user)
- Filter by level (info, success, warning, error)
- Search by action/details
- Timestamp + actor

**Log Types:**
- ✓ Match events (created, started, completed, cancelled)
- ✓ Payment actions (verified, failed, rejected)
- ✓ Disputes opened/resolved
- ✓ Withdrawals approved/rejected
- ✓ Admin actions (bans, balance adjustments)

---

## 🎨 Components Reference

### StatCard
```jsx
<StatCard
  label="Active Matches"
  value={12}
  icon="🎮"
  color="#FF6A00"
  trend={20}  // Optional: percentage trend
/>
```

### MatchCard
```jsx
<MatchCard
  matchId={1025}
  playerA="john_doe"
  playerB="alpha_pro"
  mode="Valorant"
  entry="5v5 Tournament"
  status="ongoing"  // waiting|matched|payment_pending|verified|ongoing|completed|cancelled
  paymentA={true}
  paymentB={false}
  onOpen={() => {}}
  onCancel={() => {}}
/>
```

### PaymentStatusCard
```jsx
<PaymentStatusCard
  player="john_doe"
  isPaid={false}
  screenshotUrl={url}
  onApprove={() => {}}
  onReject={() => {}}
  isLoading={false}
/>
```

### DisputeCard
```jsx
<DisputeCard
  matchId={1022}
  playerA="lucky_strike"
  playerB="king_of_games"
  screenshotA={urlA}
  screenshotB={urlB}
  onResolve={(winner) => {}}  // 'A' or 'B'
  isLoading={false}
/>
```

### UserCard
```jsx
<UserCard
  username="john_doe"
  walletBalance={2500}
  trustScore={4.8}
  status="Active"  // 'Active' or 'Banned'
  matchCount={23}
  onBan={() => {}}
  onAdjustBalance={() => {}}
  onViewHistory={() => {}}
/>
```

### WithdrawalCard
```jsx
<WithdrawalCard
  id={1}
  username="ninja_gamer"
  amount={5000}
  method="UPI"  // 'UPI' or 'Bank Transfer'
  details="ninja.gamer@upi"
  requestedAt="2:30 PM today"
  onApprove={() => {}}
  onReject={() => {}}
  isLoading={false}
/>
```

### LogCard
```jsx
<LogCard
  timestamp="2:45 PM"
  level="success"  // info|success|warning|error
  action="Payment Verified"
  details="john_doe payment verified for Match #1025"
  user="admin"
/>
```

---

## 🎯 Design System

### Colors
- **Background:** `#0B0B0B`
- **Card:** `#111111`
- **Border:** `#1F1F1F`
- **Primary (Orange):** `#FF6A00`
- **Text:** `#FFFFFF`
- **Secondary:** `#A1A1A1`
- **Success:** `#22C55E`
- **Warning:** `#F59E0B`
- **Danger:** `#EF4444`

### Typography
- **Headers:** Bold, large sizes
- **Labels:** Uppercase, tracking
- **Secondary:** `#A1A1A1` for dims
- **Monospace:** For IDs, account details

### Spacing
- No large empty spaces
- Dense information layout
- Cards: `p-4` / `p-6`
- Gaps: `gap-3` / `gap-4`

### Borders & Effects
- ✓ Flat borders only (`border-[#1F1F1F]`)
- ✗ NO gradients
- ✗ NO shadows
- ✗ NO animations beyond hover

---

## 🔌 API Integration

### Match Actions
```javascript
// Verify payment
POST /api/matches/{matchId}/verify-payment
{ player: 'A'|'B', screenshot: File }

// Start match
POST /api/matches/{matchId}/start
{ roomId: string, password: string }

// Cancel match
POST /api/matches/{matchId}/cancel
{ reason?: string }

// Resolve dispute
POST /api/matches/{matchId}/resolve-dispute
{ winner: 'A'|'B', penalize?: boolean }
```

### User Actions
```javascript
// Ban/unban user
POST /api/users/{userId}/ban
{ banned: boolean }

// Adjust wallet
POST /api/users/{userId}/adjust-wallet
{ amount: number }  // negative to subtract
```

### Withdrawal Actions
```javascript
// Approve withdrawal
POST /api/withdrawals/{id}/approve
{}

// Reject withdrawal
POST /api/withdrawals/{id}/reject
{ reason?: string }
```

---

## 📱 Responsive Behavior

### Desktop (lg: 1024px+)
- Fixed left sidebar (260px)
- Main content scrolls vertically
- 2-column match/card grids
- Full feature access

### Tablet (md: 768px+)
- Hamburger sidebar toggle
- 1-2 column grids
- Full functionality

### Mobile (sm: 640px+)
- Hamburger sidebar overlay
- Single column layout
- Stacked actions
- Sticky action buttons

---

## 🔐 Admin Auth

Add role checking in your auth context:

```jsx
// In UserContext or similar
const [user, setUser] = useState({
  id: '...',
  username: '...',
  role: 'admin' | 'user'  // ← Add this
});

// Then gate access:
{user.role === 'admin' && <AdminLayout />}
```

---

## 🎨 Customization

### Change Color Scheme
Replace all color codes globally:
```bash
#FF6A00 → your primary color
#0B0B0B → your background
```

### Add More Screens
1. Create new screen in `src/screens/NewScreen.jsx`
2. Add to SCREENS object in `AdminLayout.jsx`
3. Add to sidebar menu in `AdminSidebar.jsx`

### Modify Sidebar Menu
Edit the `menuItems` array in `AdminSidebar.jsx`

---

## ⚡ Performance Tips

- Screens use local state for demo data
- Replace with API calls:
  ```jsx
  const [matches, setMatches] = useState([]);
  
  useEffect(() => {
    fetchMatches().then(setMatches);
  }, []);
  ```

- Paginate large lists (logs, users)
- Use `useMemo` for filtered data
- Debounce search inputs

---

## 🐛 Testing

### Test Checklist
- [ ] All sidebar links work
- [ ] Filters/search are responsive
- [ ] Action buttons disable properly
- [ ] Mobile hamburger toggle works
- [ ] Forms validation
- [ ] Error states handled
- [ ] API calls error handling

---

## 📦 Dependencies

Uses only:
- React 18+
- Tailwind CSS 3+
- Standard HTML/CSS

No external UI libraries required. Everything is custom-built with Tailwind.

---

## 🚀 Next Steps

1. **Connect to API:** Replace mock data with real API calls
2. **Add Auth:** Check user role before rendering
3. **Implement Real-time:** Add WebSocket for live updates
4. **Add Pagination:** For large data sets
5. **Customize:** Adjust colors, add/remove screens as needed

---

**Remember:** This dashboard is designed for **speed** and **control**. Function over form. Every screen should feel like a power tool, not a toy.
