# Admin Dashboard - Quick Start Guide

## 🎯 Integration Steps

### Step 1: Add Admin Route to App.jsx

```jsx
import { AdminLayout } from './components/admin';
import { useContext } from 'react';
import { UserContext } from './contexts/UserContext';

function App() {
  const { user } = useContext(UserContext);
  
  return (
    <Routes>
      {/* Existing routes */}
      <Route path="/home" element={<HomeScreen />} />
      <Route path="/match/:id" element={<MatchScreen />} />
      
      {/* NEW: Admin dashboard route */}
      {user?.role === 'admin' && (
        <Route path="/admin" element={<AdminLayout />} />
      )}
    </Routes>
  );
}

export default App;
```

### Step 2: Update UserContext

Add `role` field to user object:

```jsx
const [user, setUser] = useState({
  id: '...',
  username: '...',
  email: '...',
  role: 'admin' | 'user'  // ← ADD THIS
});
```

### Step 3: Add Admin Link to Navigation

```jsx
// In Header.jsx or BottomNav.jsx
{user.role === 'admin' && (
  <Link to="/admin" className="...">
    ⚙️ Admin
  </Link>
)}
```

### Step 4: Use AdminPanel for Match Controls (Optional)

The updated AdminPanel works in both modes:

```jsx
// Full Dashboard Mode (when no props)
<AdminPanel />

// In-Match Controls (with props)
<AdminPanel
  players={players}
  verifiedUsers={verifiedUsers}
  onVerify={handleVerify}
  // ... etc
/>
```

---

## 🚀 Running the Dashboard

1. Navigate to `/admin` (only visible to admins)
2. Browse through different screens via sidebar
3. Click on matches to view detailed control panel
4. Approve payments, resolve disputes, manage users

---

## 📊 Mock Data vs Real API

### Current State
All screens include **mock data** for testing:
- Sample matches, payments, users, disputes
- Local state management with `useState`
- Simulated API delays with `setTimeout`

### To Connect to Real API

Replace mock data with API calls:

```jsx
// Before (mock)
const [matches, setMatches] = useState([
  { id: 1025, playerA: 'john_doe', ... }
]);

// After (real API)
const [matches, setMatches] = useState([]);

useEffect(() => {
  fetch('/api/matches')
    .then(res => res.json())
    .then(data => setMatches(data))
    .catch(err => console.error(err));
}, []);
```

---

## 🎨 Component Hierarchy

```
AdminLayout
├── AdminSidebar (nav)
└── Main Content Area
    ├── AdminDashboard (stats + logs)
    ├── LiveMatches → MatchRoomDetail
    ├── PaymentsPanel (PaymentStatusCard[])
    ├── DisputesPanel (DisputeCard[])
    ├── UsersPanel → User Details
    ├── WithdrawalsPanel (WithdrawalCard[])
    └── LogsPanel (LogCard[])
```

---

## 🔌 Key Event Handlers to Implement

### Match Operations
```javascript
// approve payment
const handleApprovePayment = async (matchId, player) => {
  const response = await fetch(
    `/api/matches/${matchId}/verify-payment`,
    {
      method: 'POST',
      body: JSON.stringify({ player })
    }
  );
};

// start match
const handleStartMatch = async (matchId, roomId, password) => {
  const response = await fetch(
    `/api/matches/${matchId}/start`,
    {
      method: 'POST',
      body: JSON.stringify({ roomId, password })
    }
  );
};

// cancel match
const handleCancelMatch = async (matchId, reason) => {
  const response = await fetch(
    `/api/matches/${matchId}/cancel`,
    { method: 'POST', body: JSON.stringify({ reason }) }
  );
};
```

### User Operations
```javascript
// ban user
const handleBanUser = async (userId, banned) => {
  await fetch(`/api/users/${userId}/ban`, {
    method: 'POST',
    body: JSON.stringify({ banned })
  });
};

// adjust balance
const handleAdjustBalance = async (userId, amount) => {
  await fetch(`/api/users/${userId}/adjust-wallet`, {
    method: 'POST',
    body: JSON.stringify({ amount })
  });
};
```

### Withdrawal Operations
```javascript
// approve withdrawal
const handleApproveWithdrawal = async (withdrawalId) => {
  await fetch(`/api/withdrawals/${withdrawalId}/approve`, {
    method: 'POST'
  });
};

// reject withdrawal
const handleRejectWithdrawal = async (withdrawalId, reason) => {
  await fetch(`/api/withdrawals/${withdrawalId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason })
  });
};
```

---

## 📱 Screen-by-Screen Implementation

### Dashboard
- ✅ Stats cards (mock data)
- ✅ Activity logs (mock)
- ⏳ Connect to real stats API
  ```javascript
  GET /api/admin/stats → { activeMatches, pendingPayments, disputes, ... }
  GET /api/admin/activity-logs → { logs: [...] }
  ```

### Live Matches
- ✅ Match list with filtering
- ✅ Match cards with status
- ⏳ Connect to:
  ```javascript
  GET /api/matches → filter by status
  POST /api/matches/{id}/cancel
  ```

### Match Room Detail
- ✅ Payment verification UI
- ✅ Room credentials form
- ⏳ Connect to:
  ```javascript
  POST /api/matches/{id}/verify-payment
  POST /api/matches/{id}/start
  POST /api/matches/{id}/cancel
  ```

### Payments
- ✅ Payment verification UI
- ⏳ Connect to:
  ```javascript
  GET /api/payments/pending
  POST /api/payments/{id}/approve
  POST /api/payments/{id}/reject
  ```

### Disputes
- ✅ Dispute resolution UI
- ⏳ Connect to:
  ```javascript
  GET /api/disputes
  POST /api/disputes/{id}/resolve
  ```

### Users
- ✅ User list + search
- ✅ User details + history
- ⏳ Connect to:
  ```javascript
  GET /api/users
  POST /api/users/{id}/ban
  POST /api/users/{id}/adjust-wallet
  GET /api/users/{id}/matches
  ```

### Withdrawals
- ✅ Withdrawal request list
- ⏳ Connect to:
  ```javascript
  GET /api/withdrawals
  POST /api/withdrawals/{id}/approve
  POST /api/withdrawals/{id}/reject
  ```

### Logs
- ✅ Log list + filtering
- ⏳ Connect to:
  ```javascript
  GET /api/admin/logs
  ```

---

## 🧪 Testing Checklist

### UI/UX
- [ ] Sidebar navigation works on desktop
- [ ] Mobile hamburger menu works
- [ ] All filters responsive
- [ ] Search inputs work
- [ ] Action buttons disabled when appropriate
- [ ] Loading states visible

### Functionality
- [ ] Match filtering by status
- [ ] Payment approval flow
- [ ] Dispute resolution
- [ ] User search
- [ ] Withdrawal approval
- [ ] Log filtering/search

### Responsive
- [ ] Desktop (lg): Full sidebar visible
- [ ] Tablet (md): Hamburger menu works
- [ ] Mobile (sm): Single column layout

### Performance
- [ ] No unnecessary re-renders
- [ ] Filters are instant
- [ ] API calls debounced where needed
- [ ] Large lists paginated

---

## 🚨 Common Issues & Fixes

### Sidebar Not Showing
```jsx
// Check: Is container high enough?
<div className="flex h-screen bg-[#0B0B0B]">
  {/* Must have h-screen (100vh) */}
</div>
```

### Styles Not Applying
```
✓ Make sure Tailwind is configured
✓ Check that all color codes are correct (#0B0B0B, #FF6A00, etc)
✓ Classes must be in template strings, not variables
```

### Mobile Menu Not Closing
```jsx
// Ensure state is properly managed
const [sidebarOpen, setSidebarOpen] = useState(false);
// And properly reset on navigation
```

---

## 📚 Learn More

Full documentation: [ADMIN_DASHBOARD_README.md](./ADMIN_DASHBOARD_README.md)

---

##💡 Pro Tips

1. **Real-time Updates:** Add polling or WebSockets for live data
   ```jsx
   useEffect(() => {
     const interval = setInterval(fetchMatches, 2000);
     return () => clearInterval(interval);
   }, []);
   ```

2. **Optimistic Updates:** Update UI before API response
   ```jsx
   const handleApprove = (id) => {
     setPayments(prev => prev.filter(p => p.id !== id));
     api.approvePayment(id).catch(() => {
       // Revert on error
     });
   };
   ```

3. **Error Handling:** Show user-friendly errors
   ```jsx
   .catch(err => {
     setError(err.message);
     setTimeout(() => setError(''), 3000);
   });
   ```

4. **Loading States:** Disable buttons during requests
   ```jsx
   <button disabled={isLoading}>
     {isLoading ? '⏳ Processing...' : 'Approve'}
   </button>
   ```

---

**Ready to go?** Start by adding the route to App.jsx, then connect the API endpoints. The UI is production-ready! 🚀
