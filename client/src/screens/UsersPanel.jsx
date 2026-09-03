import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trash2 } from 'lucide-react';
import { UserCard } from '../components/admin/AdminComponents';
import { useUser } from '../contexts/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const UsersPanel = () => {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  const [filterStatus, setFilterStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [pendingDeleteUser, setPendingDeleteUser] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch, page]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/users?search=${encodeURIComponent(debouncedSearch)}&page=${page}&limit=50`, {
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

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
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

  const handleEditTitle = async (userId, currentTitle) => {
    const title = prompt('Enter player title (leave blank to remove):', currentTitle || '');
    if (title === null) return;
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.put(`${API_BASE}/admin/users/${userId}/title`, { title }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast(title.trim() ? 'Title updated' : 'Title removed');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update title', 'error');
    }
  };

  const handleDeleteUser = async (userId) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if (currentUserId && currentUserId.toString() === userId.toString()) {
      showToast('You cannot delete your own admin account.', 'error');
      setPendingDeleteUser(null);
      return;
    }

    setDeletingUserId(userId);
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.delete(`${API_BASE}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers((prevUsers) => prevUsers.filter((user) => user._id !== userId));
      setPagination((prevPagination) => {
        const nextTotal = Math.max((prevPagination.total || 0) - 1, 0);
        return {
          ...prevPagination,
          total: nextTotal,
          pages: Math.max(Math.ceil(nextTotal / (prevPagination.limit || 50)), 1)
        };
      });
      showToast(response.data.message || 'User deleted successfully.', 'success');
    } catch (err) {
      console.error('deleteUser error', err);
      showToast(err.response?.data?.error || 'Failed to delete user.', 'error');
    } finally {
      setDeletingUserId(null);
      setIsLoading(false);
      setPendingDeleteUser(null);
    }
  };

  const handleViewHistory = async (userId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const detailedUser = response.data.user;
      detailedUser.recentMatches = response.data.recentMatches || [];
      setSelectedUser(detailedUser);
    } catch (err) {
      console.error('viewHistory error', err);
      alert('Unable to load user history');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleUsers = users.map((user) => ({
    id: user._id,
    username: user.username,
    walletBalance: user.wallet?.balance ?? 0,
    trustScore: user.trustScore ?? 0,
    status: user.isBanned ? 'Banned' : 'Active',
    matchCount: user.matchesPlayed ?? 0,
    title: user.title || '',
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
            <p className="text-2xl font-bold text-[#FF6A00] mt-2">CZ{selectedUser.walletBalance}</p>
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

        <div className="rounded-2xl border border-[#1F1F1F] bg-[#111111] p-4">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Match History</h2>
              <p className="text-sm text-[#A1A1A1] mt-1">Recent matches for this user</p>
            </div>
            <button
              onClick={() => setSelectedUser(null)}
              className="text-sm text-[#A1A1A1] hover:text-white"
            >
              Back to users
            </button>
          </div>
          {selectedUser.recentMatches?.length ? (
            <div className="space-y-3">
              {selectedUser.recentMatches.map((match) => (
                <div key={match._id || match.id} className="rounded-xl bg-[#0B0B0B] p-4 border border-[#1F1F1F]">
                  <p className="text-sm text-[#A1A1A1]">Match #{match._id || match.id} • {match.mode || 'Unknown'}</p>
                  <p className="text-lg font-semibold text-white mt-2">
                    {match.players?.map((player) => player?.username || player).join(' vs ')}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-sm text-[#A1A1A1]">
                    <span className="rounded-full bg-[#1F1F1F] px-2 py-1">Status: {match.status}</span>
                    <span className="rounded-full bg-[#1F1F1F] px-2 py-1">Entry: CZ{match.entry || 0}</span>
                    {match.result?.winner && (
                      <span className="rounded-full bg-[#1F1F1F] px-2 py-1">Winner: {match.result.winner?.username || match.result.winner}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#A1A1A1]">No match history available for this user.</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {pagination.total || visibleUsers.length} total users • {visibleUsers.filter((u) => u.status === 'Active').length} active
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
        <>
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
                  title={user.title}
                  onBan={() => handleBanUnban(user.id, user.isBanned)}
                  onAdjustBalance={() => handleAdjustBalance(user.id)}
                  onViewHistory={() => handleViewHistory(user.id)}
                  onEditTitle={() => handleEditTitle(user.id, user.title)}
                  onDelete={() => {
                    const currentUserId = currentUser?._id || currentUser?.id;
                    if (currentUserId && currentUserId.toString() === user.id?.toString()) {
                      showToast('You cannot delete your own admin account.', 'error');
                      return;
                    }
                    setPendingDeleteUser(user);
                  }}
                  isDeleting={deletingUserId === user.id}
                  isDeleteDisabled={Boolean(currentUser && ((currentUser._id || currentUser.id)?.toString() === user.id?.toString()))}
                />
              ))}
          </div>

          {pagination.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 py-3">
              <p className="text-sm text-[#A1A1A1]">
                Page {pagination.page} of {pagination.pages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm text-[#A1A1A1] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((currentPage) => Math.min(pagination.pages, currentPage + 1))}
                  disabled={page >= pagination.pages}
                  className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm text-[#A1A1A1] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center">
          <p className="text-[#A1A1A1]">No users found</p>
        </div>
      )}

      {pendingDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[#1F1F1F] bg-[#111111] p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-[#3d1c1c] p-2 text-[#EF4444]">
                <Trash2 size={18} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Delete User</h3>
                <p className="text-sm text-[#A1A1A1]">This action cannot be undone.</p>
              </div>
            </div>

            <p className="mt-5 text-sm text-[#A1A1A1]">
              Are you sure you want to permanently delete <span className="font-semibold text-white">{pendingDeleteUser.username}</span>?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setPendingDeleteUser(null)}
                className="rounded-lg border border-[#1F1F1F] px-4 py-2 text-sm text-[#A1A1A1]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteUser(pendingDeleteUser.id)}
                disabled={deletingUserId === pendingDeleteUser.id}
                className="rounded-lg bg-[#EF4444] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deletingUserId === pendingDeleteUser.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`fixed bottom-4 right-4 z-50 rounded-lg border px-4 py-3 text-sm shadow-lg ${toast.type === 'error' ? 'border-[#EF4444] bg-[#3d1c1c] text-[#FECACA]' : 'border-[#22C55E] bg-[#022c0b] text-[#BBF7D0]'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

