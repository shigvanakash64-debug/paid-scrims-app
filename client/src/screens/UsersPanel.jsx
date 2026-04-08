import { useState, useEffect } from 'react';
import axios from 'axios';
import { UserCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const UsersPanel = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, page]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/users?search=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || []);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      console.error('fetchUsers error', err);
      setError('Unable to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleBanUnban = async (userId, isBanned) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/toggle-ban`, { userId, ban: !isBanned }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('toggleBan error', err);
      alert('Failed to update user status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustBalance = async (userId) => {
    const amount = prompt('Enter amount to add/subtract (negative for subtract):');
    if (amount === null) return;
    const parsedAmount = parseFloat(amount);
    if (Number.isNaN(parsedAmount)) {
      alert('Please enter a valid number');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/users/${userId}/adjust-wallet`, {
        amount: parsedAmount,
        reason: 'Admin balance adjustment'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchUsers();
    } catch (err) {
      console.error('adjustUserWallet error', err);
      alert('Failed to adjust wallet balance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = (user) => {
    setSelectedUser(user);
  };

  const visibleUsers = users.map((user) => ({
    id: user._id,
    username: user.username,
    walletBalance: user.wallet?.balance ?? 0,
    trustScore: user.trustScore ?? 0,
    status: user.isBanned ? 'Banned' : 'Active',
    matchCount: user.matchesPlayed ?? 0,
    isBanned: user.isBanned,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-sm text-[#EF4444] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (selectedUser) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="text-[#A1A1A1] hover:text-white text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{selectedUser.username}</h1>
            <p className="text-sm text-[#A1A1A1] mt-1">User details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <p className="text-xs text-[#A1A1A1]">WALLET</p>
            <p className="text-2xl font-bold text-[#FF6A00] mt-2">₹{selectedUser.walletBalance}</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <p className="text-xs text-[#A1A1A1]">TRUST SCORE</p>
            <p className="text-2xl font-bold text-[#22C55E] mt-2">{selectedUser.trustScore}⭐</p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <p className="text-xs text-[#A1A1A1]">STATUS</p>
            <p className={`text-lg font-bold mt-2 ${selectedUser.status === 'Active' ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
              {selectedUser.status}
            </p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
            <p className="text-xs text-[#A1A1A1]">TOTAL MATCHES</p>
            <p className="text-2xl font-bold text-white mt-2">{selectedUser.matchCount}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {visibleUsers.length} total users • {visibleUsers.filter((u) => u.status === 'Active').length} active
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search username..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setPage(1);
          }}
          className="flex-1 bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none"
        />
        <div className="flex gap-2">
          {['all', 'Active', 'Banned'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setFilterStatus(status);
                setPage(1);
              }}
              className={`px-4 py-3 rounded-lg font-semibold text-sm transition ${
                filterStatus === status
                  ? 'bg-[#FF6A00] text-black'
                  : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {visibleUsers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleUsers
            .filter((user) => filterStatus === 'all' || user.status === filterStatus)
            .map((user) => (
              <UserCard
                key={user.id}
                username={user.username}
                walletBalance={user.walletBalance}
                trustScore={user.trustScore}
                status={user.status}
                matchCount={user.matchCount}
                onBan={() => handleBanUnban(user.id, user.isBanned)}
                onAdjustBalance={() => handleAdjustBalance(user.id)}
                onViewHistory={() => handleViewHistory(user)}
              />
            ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center">
          <p className="text-[#A1A1A1]">No users found</p>
        </div>
      )}
    </div>
  );
};
