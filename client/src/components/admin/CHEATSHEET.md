# Admin Dashboard - Cheat Sheet

## 🚀 Quick Import

```jsx
// Full Dashboard
import { AdminLayout } from '@/components/admin';

// Individual Screens  
import { 
  AdminDashboard,
  LiveMatches,
  PaymentsPanel,
  DisputesPanel,
  UsersPanel,
  WithdrawalsPanel,
  LogsPanel
} from '@/screens';

// Components
import { 
  StatCard,
  MatchCard,
  PaymentStatusCard,
  DisputeCard,
  UserCard,
  WithdrawalCard,
  LogCard
} from '@/components/admin';
```

---

## 📋 Screen Overview

| Screen | Purpose | Key Actions | Hot Key |
|--------|---------|-------------|---------|
| 📊 Dashboard | Overview stats | View latest activity | - |
| 🎮 Matches | Manage matches | Open, cancel | - |
| 💳 Payments | Verify payments | Approve, reject | - |
| ⚠️ Disputes | Resolve disputes | Mark winner | - |
| 👤 Users | Manage users | Ban, adjust balance | - |
| 💸 Withdrawals | Process withdrawals | Approve, reject | - |
| 📜 Logs | View activity | Filter, search | - |

---

## 🎨 Colors (Tailwind Classes)

```
#0B0B0B  → bg-[#0B0B0B]  text-[#0B0B0B]  border-[#0B0B0B]
#111111  → bg-[#111111]  text-[#111111]  border-[#111111]
#1F1F1F  → bg-[#1F1F1F]  text-[#1F1F1F]  border-[#1F1F1F]
#FF6A00  → bg-[#FF6A00]  text-[#FF6A00]  border-[#FF6A00]
#FFFFFF  → text-white    bg-white
#A1A1A1  → text-[#A1A1A1] bg-[#A1A1A1]
#22C55E  → text-[#22C55E] bg-[#022c0b]  ← Success
#F59E0B  → text-[#F59E0B] bg-[#2A2A1F]  ← Warning
#EF4444  → text-[#EF4444] bg-[#3d1c1c]  ← Danger
```

---

## 🧩 Component Props Quick Reference

### StatCard
```jsx
<StatCard
  label="Matches"
  value={12}
  icon="🎮"
  trend={20}     // Optional
/>
```

### MatchCard  
```jsx
<MatchCard
  matchId={1025}
  playerA="name"
  playerB="name"
  mode="Valorant"
  entry="5v5"
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
  player="username"
  isPaid={false}
  screenshotUrl="url"
  onApprove={() => {}}
  onReject={() => {}}
  isLoading={false}
/>
```

### DisputeCard
```jsx
<DisputeCard
  matchId={1022}
  playerA="name"
  playerB="name"
  screenshotA="url"
  screenshotB="url"
  onResolve={(winner) => {}}  // 'A' or 'B'
  isLoading={false}
/>
```

### UserCard
```jsx
<UserCard
  username="name"
  walletBalance={2500}
  trustScore={4.8}
  status="Active"  // Active|Banned
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
  username="name"
  amount={5000}
  method="UPI"  // UPI|Bank Transfer
  details="account@upi"
  requestedAt="2:30 PM"
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
  action="Action Name"
  details="What happened"
  user="admin"
/>
```

---

## 📏 Common Tailwind Classes Used

```
Typography:
  font-bold, font-semibold, font-medium
  text-xs, text-sm, text-base, text-lg, text-2xl, text-3xl
  uppercase, tracking-wider

Spacing:
  p-4, p-6, p-8
  px-3, py-2, px-4
  gap-2, gap-3, gap-4, gap-6
  space-y-2, space-y-3, space-y-4

Layout:
  flex, grid
  grid-cols-1, grid-cols-2, grid-cols-3, grid-cols-5
  sm:, md:, lg:  ← Responsive
  h-screen, max-h-screen, overflow-y-auto

Borders:
  border, rounded, rounded-lg
  border-[#1F1F1F]  ← Always this color

States:
  hover:, focus:, disabled:, transition
```

---

## 🔄 State Management Pattern

```jsx
// Fetch data
const [data, setData] = useState([]);

// Loading state
const [loading, setLoading] = useState(false);

// Handle action
const handleAction = async () => {
  setLoading(true);
  try {
    await apiCall();
    // Update UI
    setData([...]);
  } catch (err) {
    alert(err.message);
  } finally {
    setLoading(false);
  }
};

// Disable button while loading
<button disabled={loading}>
  {loading ? '⏳...' : 'Action'}
</button>
```

---

## 🎯 Status Match States

```
'waiting'           → gray    (not ready)
'matched'           → orange  (players matched)
'payment_pending'   → orange  (waiting for payment)
'verified'          → orange  (verified, ready)
'ongoing'           → orange  (in progress)
'completed'         → green   (done, paid)
'cancelled'         → red     (cancelled)
```

---

## 🧬 File Organization

```
Import Components:
  from '@/components/admin'

Import Screens:
  from '@/screens'

Use AdminLayout for full dashboard:
  import { AdminLayout } from '@/components/admin'
  <AdminLayout />

Use AdminPanel for match controls:
  import { AdminPanel } from '@/components'
  <AdminPanel {...props} />
```

---

## 📱 Responsive Breakpoints

```
Mobile:   sm: (640px+)   - Hamburger menu
Tablet:   md: (768px+)   - 2 columns
Desktop:  lg: (1024px+)  - Full sidebar
```

---

## ✨ Common Patterns

### Loading State
```jsx
{isLoading ? (
  <div className="text-[#A1A1A1]">Loading...</div>
) : (
  <div>{data}</div>
)}
```

### Error State
```jsx
{error && (
  <div className="bg-[#3d1c1c] border border-[#EF4444] text-[#EF4444] p-4 rounded">
    {error}
  </div>
)}
```

### Empty State
```jsx
{items.length === 0 ? (
  <div className="bg-[#111111] border border-[#1F1F1F] rounded p-12 text-center">
    <p className="text-[#A1A1A1]">No items found</p>
  </div>
) : (
  <div>{items.map(...)}</div>
)}
```

### Button States
```jsx
<button
  onClick={handler}
  disabled={!ready || isLoading}
  className="...disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? '⏳ Processing...' : 'Action'}
</button>
```

---

## 🎨 Card Template

```jsx
<div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-3">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs text-[#A1A1A1]">LABEL</p>
      <p className="text-sm font-medium text-white mt-1">Content</p>
    </div>
    <span className="text-xs px-3 py-1 rounded bg-[#1F1F1F] text-[#A1A1A1]">
      Status
    </span>
  </div>

  <div className="flex gap-2">
    <button className="flex-1 bg-[#FF6A00] text-black px-3 py-2 rounded font-semibold text-sm">
      Action
    </button>
  </div>
</div>
```

---

## 🔌 API Call Pattern

```jsx
const handleAction = async () => {
  setLoading(true);
  try {
    const res = await fetch('/api/endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data })
    });
    
    if (!res.ok) throw new Error('Failed');
    
    const result = await res.json();
    setData(result);
    setMessage('✓ Success');
    setTimeout(() => setMessage(''), 2000);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

---

## 🎯 Action Button Colors

| Type | BG Color | Text Color | Hover |
|------|----------|-----------|-------|
| Primary | `#FF6A00` | black | opacity-90 |
| Secondary | border | `#A1A1A1` | `border-[#FF6A00]` |
| Danger | border | `#EF4444` | bg-[#3d1c1c] |
| Success | `#22C55E` | black | opacity-90 |

---

## 📊 Getting Data

```jsx
// From mock (current)
const [matches] = useState([...mockData]);

// From API (next)
useEffect(() => {
  fetch('/api/matches')
    .then(r => r.json())
    .then(setMatches);
}, []);

// With filters
const filtered = data.filter(item => {
  return filter === 'all' || item.status === filter;
});
```

---

**Pro Tip:** Use browser DevTools to inspect and copy Tailwind classes from existing components!
