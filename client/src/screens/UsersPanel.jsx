import { useState } from 'react';
import { UserCard } from '../components/admin/AdminComponents';

export const UsersPanel = () => {
  const [users, setUsers] = useState([
    { id: 1, username: 'john_doe', walletBalance: 2500, trustScore: 4.8, status: 'Active', matchCount: 23 },
    { id: 2, username: 'alpha_pro', walletBalance: 5200, trustScore: 4.9, status: 'Active', matchCount: 45 },
    { id: 3, username: 'gamer_x', walletBalance: 1800, trustScore: 3.2, status: 'Active', matchCount: 12 },
    { id: 4, username: 'ninja_gamer', walletBalance: 8500, trustScore: 4.7, status: 'Active', matchCount: 67 },
    { id: 5, username: 'banned_user', walletBalance: 0, trustScore: 1.0, status: 'Banned', matchCount: 3 },
    { id: 6, username: 'lucky_strike', walletBalance: 3200, trustScore: 3.8, status: 'Active', matchCount: 19 },
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleBanUnban = async (userId) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: u.status === 'Active' ? 'Banned' : 'Active' } : u
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdjustBalance = async (userId) => {
    const amount = prompt('Enter amount to add/subtract (negative for subtract):');
    if (amount === null) return;

    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, walletBalance: Math.max(0, u.walletBalance + parseInt(amount)) }
            : u
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHistory = (user) => {
    setSelectedUser(user);
  };

  if (selectedUser) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSelectedUser(null)}
            className="text-[#A1A1A1] hover:text-white text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">{selectedUser.username}</h1>
            <p className="text-sm text-[#A1A1A1] mt-1">Match History</p>
          </div>
        </div>

        {/* User Stats */}
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

        {/* Match History */}
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white">Recent Matches</h2>
          <div className="space-y-2">
            {[
              { id: 1025, opponent: 'alpha_pro', result: 'Won', status: 'Ongoing', time: '2 mins ago' },
              { id: 1023, opponent: 'beast_mode', result: 'Won', status: 'Completed', time: '1 hour ago' },
              { id: 1020, opponent: 'swift_ninja', result: 'Lost', status: 'Completed', time: '3 hours ago' },
              { id: 1015, opponent: 'cosmic_force', result: 'Draw', status: 'Disputed', time: '5 hours ago' },
            ].map((match) => (
              <div key={match.id} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white">Match #{match.id}</p>
                  <p className="text-xs text-[#A1A1A1] mt-1">vs {match.opponent}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${
                    match.result === 'Won' ? 'text-[#22C55E]' : match.result === 'Lost' ? 'text-[#EF4444]' : 'text-[#F59E0B]'
                  }`}>
                    {match.result}
                  </p>
                  <p className="text-xs text-[#A1A1A1] mt-1">{match.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Users</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {users.length} total users • {users.filter((u) => u.status === 'Active').length} active
        </p>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Search username..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none"
        />
        <div className="flex gap-2">
          {['all', 'Active', 'Banned'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
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

      {/* Users Grid */}
      {filteredUsers.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              username={user.username}
              walletBalance={user.walletBalance}
              trustScore={user.trustScore}
              status={user.status}
              matchCount={user.matchCount}
              onBan={() => handleBanUnban(user.id)}
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
