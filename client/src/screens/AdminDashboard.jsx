import { useState, useEffect } from 'react';
import axios from 'axios';
import { StatCard, LogCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    activeMatches: 0,
    pendingPayments: 0,
    disputes: 0,
    systemBalance: 0,
    todayRevenue: 0,
  });

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem('clutchzone_token');
        const [statsResponse, logsResponse] = await Promise.all([
          axios.get(`${API_BASE}/admin/stats`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE}/admin/logs?limit=10`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        setStats(statsResponse.data.stats);
        setLogs(logsResponse.data.logs);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

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
          value={`₹${Number(stats.systemBalance || 0).toLocaleString()}`}
          icon="💰"
          color="#22C55E"
          trend={-5}
        />
        <StatCard
          label="Today Revenue"
          value={`₹${Number(stats.todayRevenue || 0).toLocaleString()}`}
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
          {loading ? (
            <div className="text-[#A1A1A1] text-center py-8">Loading activity...</div>
          ) : logs.length === 0 ? (
            <div className="text-[#A1A1A1] text-center py-8">No recent activity</div>
          ) : (
            logs.map((log) => (
              <LogCard
                key={log._id || log.id}
                timestamp={new Date(log.createdAt || log.timestamp || Date.now()).toLocaleTimeString()}
                level={log.level}
                action={log.action}
                details={log.details}
                user={log.user}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
