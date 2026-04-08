// REFERENCE IMPLEMENTATION
// Shows how to integrate admin dashboard with real API calls and proper error handling

import { useState, useCallback, useEffect } from 'react';
import { AdminLayout } from './AdminLayout';

/**
 * Example: Complete Admin System with API Integration
 * 
 * This file demonstrates:
 * - Fetching real data
 * - Handling API errors
 * - Optimistic updates
 * - Loading states
 * - Real-time updates
 */

// ============================================================================
// API Service Layer (Create as separate file: utils/adminApi.js)
// ============================================================================

const adminApi = {
  // Matches
  async getMatches() {
    const res = await fetch('/api/admin/matches');
    return res.json();
  },

  async verifyPayment(matchId, player, screenshot) {
    const formData = new FormData();
    formData.append('player', player);
    formData.append('screenshot', screenshot);

    const res = await fetch(`/api/matches/${matchId}/verify-payment`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Payment verification failed');
    return res.json();
  },

  async startMatch(matchId, roomId, password) {
    const res = await fetch(`/api/matches/${matchId}/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, password })
    });
    if (!res.ok) throw new Error('Failed to start match');
    return res.json();
  },

  async cancelMatch(matchId, reason = '') {
    const res = await fetch(`/api/matches/${matchId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason })
    });
    if (!res.ok) throw new Error('Failed to cancel match');
    return res.json();
  },

  // Payments
  async getPendingPayments() {
    const res = await fetch('/api/admin/payments/pending');
    return res.json();
  },

  async approvePayment(paymentId) {
    const res = await fetch(`/api/payments/${paymentId}/approve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Payment approval failed');
    return res.json();
  },

  // Disputes
  async getDisputes() {
    const res = await fetch('/api/admin/disputes');
    return res.json();
  },

  async resolveDispute(matchId, winner, penalize = false) {
    const res = await fetch(`/api/matches/${matchId}/resolve-dispute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winner, penalize })
    });
    if (!res.ok) throw new Error('Failed to resolve dispute');
    return res.json();
  },

  // Users
  async getUsers(page = 1, search = '') {
    const params = new URLSearchParams({ page, search });
    const res = await fetch(`/api/admin/users?${params}`);
    return res.json();
  },

  async banUser(userId, banned = true) {
    const res = await fetch(`/api/users/${userId}/ban`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ banned })
    });
    if (!res.ok) throw new Error('Failed to ban user');
    return res.json();
  },

  async adjustWallet(userId, amount) {
    const res = await fetch(`/api/users/${userId}/adjust-wallet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    if (!res.ok) throw new Error('Wallet adjustment failed');
    return res.json();
  },

  // Withdrawals
  async getWithdrawals(status = 'pending') {
    const res = await fetch(`/api/admin/withdrawals?status=${status}`);
    return res.json();
  },

  async approveWithdrawal(withdrawalId) {
    const res = await fetch(`/api/withdrawals/${withdrawalId}/approve`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Withdrawal approval failed');
    return res.json();
  },

  // Logs
  async getLogs(type = 'all', level = 'all', page = 1) {
    const params = new URLSearchParams({ type, level, page });
    const res = await fetch(`/api/admin/logs?${params}`);
    return res.json();
  }
};

// ============================================================================
// Custom Hooks for Admin Operations
// ============================================================================

/**
 * Hook: useMatches
 * Fetches and manages match data with auto-refresh
 */
function useMatches(refreshInterval = null) {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMatches = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMatches();
      setMatches(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Auto-refresh if interval provided
  useEffect(() => {
    if (!refreshInterval) return;
    const interval = setInterval(fetchMatches, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval, fetchMatches]);

  return { matches, setMatches, loading, error, refetch: fetchMatches };
}

/**
 * Hook: useAdminAction
 * Handles async actions with proper error handling and optimistic updates
 */
function useAdminAction(apiCall) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiCall(...args);
        return result;
      } catch (err) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiCall]
  );

  return { execute, loading, error };
}

// ============================================================================
// Example: Enhanced AdminDashboard with Real Data
// ============================================================================

export function AdminDashboardWithAPI() {
  const { matches, loading: matchesLoading } = useMatches(5000); // Refresh every 5s

  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);

  // Fetch stats on mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await fetch('/api/admin/stats').then(r => r.json());
        setStats(data);
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // Every 10 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch logs
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await fetch('/api/admin/logs?page=1').then(r => r.json());
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch logs:', err);
      }
    };

    fetchLogs();
  }, []);

  if (matchesLoading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats with real data */}
      <div className="grid grid-cols-5 gap-4">
        {stats && (
          <>
            <StatCard label="Active Matches" value={stats.activeMatches} icon="🎮" />
            <StatCard label="Pending Payments" value={stats.pendingPayments} icon="💳" />
            <StatCard label="Disputes" value={stats.disputes} icon="⚠️" />
            <StatCard label="System Balance" value={`₹${stats.balance}`} icon="💰" />
            <StatCard label="Today Revenue" value={`₹${stats.todayRevenue}`} icon="📈" />
          </>
        )}
      </div>

      {/* Matches with real data */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Active Matches</h2>
        {matches.slice(0, 5).map(match => (
          <MatchCard key={match.id} {...match} />
        ))}
      </div>

      {/* Logs with real data */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
        {logs.slice(0, 5).map(log => (
          <LogCard key={log.id} {...log} />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example: Enhanced LiveMatches with Real Data & Optimal Updates
// ============================================================================

export function LiveMatchesWithAPI() {
  const { matches, setMatches, refetch } = useMatches(3000); // Refresh every 3s
  const [selectedMatch, setSelectedMatch] = useState(null);

  const handleCancelMatch = useCallback(async (matchId) => {
    if (!window.confirm('Cancel this match? Users will be refunded.')) return;

    // Optimistic update
    setMatches(prev =>
      prev.map(m => m.id === matchId ? { ...m, status: 'cancelled' } : m)
    );

    try {
      await adminApi.cancelMatch(matchId);
    } catch (err) {
      // Revert on error
      console.error(err);
      refetch();
      alert('Failed to cancel match: ' + err.message);
    }
  }, [setMatches, refetch]);

  if (selectedMatch) {
    return (
      <MatchRoomDetailWithAPI
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        onUpdate={(updated) => {
          setMatches(prev =>
            prev.map(m => m.id === updated.id ? updated : m)
          );
          setSelectedMatch(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Live Matches</h1>

      <div className="grid grid-cols-2 gap-4">
        {matches.map(match => (
          <MatchCard
            key={match.id}
            {...match}
            onOpen={() => setSelectedMatch(match)}
            onCancel={() => handleCancelMatch(match.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// Example: Enhanced MatchRoomDetail with Real API
// ============================================================================

export function MatchRoomDetailWithAPI({ match, onBack, onUpdate }) {
  const [roomData, setRoomData] = useState({ roomId: '', password: '' });
  const [payments, setPayments] = useState({
    playerA: match.paymentA,
    playerB: match.paymentB
  });

  // Approve payment hook
  const { execute: approvePayment, loading: approvingPayment } = useAdminAction(
    (player) => adminApi.verifyPayment(match.id, player)
  );

  // Start match hook
  const { execute: startMatch, loading: startingMatch } = useAdminAction(
    () => adminApi.startMatch(match.id, roomData.roomId, roomData.password)
  );

  const handleApprovePayment = async (player) => {
    try {
      await approvePayment(player);
      setPayments(prev => ({ ...prev, [player]: true }));
    } catch (err) {
      alert('Payment approval failed: ' + err.message);
    }
  };

  const handleStartMatch = async () => {
    try {
      const result = await startMatch();
      onUpdate({ ...match, status: 'ongoing' });
    } catch (err) {
      alert('Failed to start match: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Match #{match.id}</h1>

      {/* Payments Section with Real API */}
      <div className="grid grid-cols-2 gap-4">
        <PaymentStatusCard
          player={match.playerA}
          isPaid={payments.playerA}
          screenshotUrl={match.playerA_screenshot}
          onApprove={() => handleApprovePayment('playerA')}
          isLoading={approvingPayment}
        />
        <PaymentStatusCard
          player={match.playerB}
          isPaid={payments.playerB}
          screenshotUrl={match.playerB_screenshot}
          onApprove={() => handleApprovePayment('playerB')}
          isLoading={approvingPayment}
        />
      </div>

      {/* Start Match Section */}
      {payments.playerA && payments.playerB && (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-6">
          <h2 className="text-lg font-bold text-white mb-4">START MATCH</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              value={roomData.roomId}
              onChange={(e) => setRoomData({ ...roomData, roomId: e.target.value })}
              placeholder="Room ID"
              disabled={startingMatch}
              className="bg-[#0B0B0B] border border-[#1F1F1F] rounded px-3 py-3 text-white outline-none focus:border-[#FF6A00]"
            />
            <input
              type="text"
              value={roomData.password}
              onChange={(e) => setRoomData({ ...roomData, password: e.target.value })}
              placeholder="Password"
              disabled={startingMatch}
              className="bg-[#0B0B0B] border border-[#1F1F1F] rounded px-3 py-3 text-white outline-none focus:border-[#FF6A00]"
            />
          </div>
          <button
            onClick={handleStartMatch}
            disabled={!roomData.roomId || !roomData.password || startingMatch}
            className="w-full bg-[#FF6A00] text-black px-6 py-4 rounded-lg font-bold transition disabled:opacity-50"
          >
            {startingMatch ? '⏳ Starting...' : '🎮 START MATCH'}
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Export: Integrated Admin System
// ============================================================================

/**
 * Use this in App.jsx:
 * 
 * import { AdminDashboardWithAPI } from './components/admin/reference-implementation';
 * 
 * <Route path="/admin" element={<AdminDashboardWithAPI />} />
 */

export default {
  adminApi,
  useMatches,
  useAdminAction,
  AdminDashboardWithAPI,
  LiveMatchesWithAPI,
  MatchRoomDetailWithAPI
};
