import { useState } from 'react';
import { StatCard, LogCard } from '../components/admin/AdminComponents';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeMatches: 12,
    pendingPayments: 5,
    disputes: 2,
    systemBalance: 125000,
    todayRevenue: 45000,
  });

  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: '2:34 PM',
      level: 'success',
      action: 'Match Completed',
      details: 'Match #1024 completed successfully',
      user: 'system',
    },
    {
      id: 2,
      timestamp: '2:12 PM',
      level: 'success',
      action: 'Payment Verified',
      details: 'Player john_doe payment approved',
      user: 'admin',
    },
    {
      id: 3,
      timestamp: '1:58 PM',
      level: 'warning',
      action: 'Dispute Opened',
      details: 'Match #1022 disputed by player_a',
      user: 'system',
    },
    {
      id: 4,
      timestamp: '1:22 PM',
      level: 'info',
      action: 'Match Created',
      details: 'New match created: 1v1 Tournament Entry',
      user: 'system',
    },
    {
      id: 5,
      timestamp: '12:45 PM',
      level: 'success',
      action: 'Withdrawal Approved',
      details: 'Withdrawal of ₹5000 approved for user_123',
      user: 'admin',
    },
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">Real-time operations overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          label="Active Matches"
          value={stats.activeMatches}
          icon="🎮"
          color="#FF6A00"
        />
        <StatCard
          label="Pending Payments"
          value={stats.pendingPayments}
          icon="💳"
          color="#F59E0B"
          trend={20}
        />
        <StatCard
          label="Disputes"
          value={stats.disputes}
          icon="⚠️"
          color="#EF4444"
        />
        <StatCard
          label="System Balance"
          value={`₹${stats.systemBalance.toLocaleString()}`}
          icon="💰"
          color="#22C55E"
          trend={-5}
        />
        <StatCard
          label="Today Revenue"
          value={`₹${stats.todayRevenue.toLocaleString()}`}
          icon="📈"
          color="#FF6A00"
          trend={35}
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button className="bg-[#FF6A00] text-black px-6 py-4 rounded-lg font-semibold hover:opacity-90 transition">
          🎮 View Live Matches
        </button>
        <button className="border border-[#1F1F1F] text-white px-6 py-4 rounded-lg font-semibold hover:border-[#FF6A00] transition">
          💳 Verify Payments
        </button>
        <button className="border border-[#EF4444] text-[#EF4444] px-6 py-4 rounded-lg font-semibold hover:bg-[#3d1c1c] transition">
          ⚠️ Resolve Disputes
        </button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Recent Activity</h2>
        <div className="space-y-2">
          {logs.map((log) => (
            <LogCard
              key={log.id}
              timestamp={log.timestamp}
              level={log.level}
              action={log.action}
              details={log.details}
              user={log.user}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
