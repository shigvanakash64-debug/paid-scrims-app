import { useState } from 'react';
import { LogCard } from '../components/admin/AdminComponents';

export const LogsPanel = () => {
  const [logs, setLogs] = useState([
    {
      id: 1,
      timestamp: '2:45 PM',
      level: 'success',
      action: 'Payment Verified',
      details: 'Player john_doe payment verified for Match #1025',
      user: 'admin',
      type: 'payment',
    },
    {
      id: 2,
      timestamp: '2:40 PM',
      level: 'info',
      action: 'Match Updated',
      details: 'Match #1025 status changed to ongoing',
      user: 'system',
      type: 'match',
    },
    {
      id: 3,
      timestamp: '2:30 PM',
      level: 'success',
      action: 'Match Completed',
      details: 'Match #1024 completed successfully. Winner: pro_player',
      user: 'system',
      type: 'match',
    },
    {
      id: 4,
      timestamp: '2:15 PM',
      level: 'warning',
      action: 'Low Payment',
      details: 'Match #1024 waiting for incomplete payment verification',
      user: 'system',
      type: 'payment',
    },
    {
      id: 5,
      timestamp: '2:00 PM',
      level: 'success',
      action: 'Withdrawal Approved',
      details: 'Withdrawal of ₹5000 approved for user ninja_gamer',
      user: 'admin',
      type: 'withdrawal',
    },
    {
      id: 6,
      timestamp: '1:45 PM',
      level: 'warning',
      action: 'Dispute Opened',
      details: 'Match #1022 dispute opened. Players disagree on match result.',
      user: 'system',
      type: 'dispute',
    },
    {
      id: 7,
      timestamp: '1:30 PM',
      level: 'success',
      action: 'Dispute Resolved',
      details: 'Match #1017 dispute resolved in favor of swift_ninja',
      user: 'admin',
      type: 'dispute',
    },
    {
      id: 8,
      timestamp: '1:15 PM',
      level: 'info',
      action: 'Match Created',
      details: 'New match created: gamer_x vs pro_player (1v1 Entry)',
      user: 'system',
      type: 'match',
    },
    {
      id: 9,
      timestamp: '1:00 PM',
      level: 'error',
      action: 'Payment Failed',
      details: 'Payment submission failed for Match #1020. User retrying.',
      user: 'system',
      type: 'payment',
    },
    {
      id: 10,
      timestamp: '12:45 PM',
      level: 'success',
      action: 'User Banned',
      details: 'User banned_user has been suspended for rule violation',
      user: 'admin',
      type: 'user',
    },
  ]);

  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const matchesSearch = log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesLevel && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">System Logs</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {logs.length} total events • Real-time activity tracking
        </p>
      </div>

      {/* Search */}
      <input
        type="text"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none"
      />

      {/* Filters */}
      <div className="space-y-3">
        <div>
          <p className="text-xs text-[#A1A1A1] font-semibold mb-2">EVENT TYPE</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'match', 'payment', 'dispute', 'withdrawal', 'user'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                  filterType === type
                    ? 'bg-[#FF6A00] text-black'
                    : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
                }`}
              >
                {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs text-[#A1A1A1] font-semibold mb-2">LEVEL</p>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'info', 'success', 'warning', 'error'].map((level) => (
              <button
                key={level}
                onClick={() => setFilterLevel(level)}
                className={`px-3 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                  filterLevel === level
                    ? 'bg-[#FF6A00] text-black'
                    : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
                }`}
              >
                {level === 'all' ? 'All' : level.charAt(0).toUpperCase() + level.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Logs */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
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
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center">
          <p className="text-[#A1A1A1]">No logs matching your filters</p>
        </div>
      )}

      {/* Stats Summary */}
      <div className="pt-4 border-t border-[#1F1F1F]">
        <p className="text-xs text-[#A1A1A1] font-semibold mb-3">LOG SUMMARY</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3">
            <p className="text-[#A1A1A1]">Successes</p>
            <p className="text-lg font-bold text-[#22C55E] mt-1">
              {logs.filter((l) => l.level === 'success').length}
            </p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3">
            <p className="text-[#A1A1A1]">Warnings</p>
            <p className="text-lg font-bold text-[#F59E0B] mt-1">
              {logs.filter((l) => l.level === 'warning').length}
            </p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3">
            <p className="text-[#A1A1A1]">Errors</p>
            <p className="text-lg font-bold text-[#EF4444] mt-1">
              {logs.filter((l) => l.level === 'error').length}
            </p>
          </div>
          <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-3">
            <p className="text-[#A1A1A1]">Info</p>
            <p className="text-lg font-bold text-[#A1A1A1] mt-1">
              {logs.filter((l) => l.level === 'info').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
