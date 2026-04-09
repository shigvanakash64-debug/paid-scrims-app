import { useState, useEffect } from 'react';
import axios from 'axios';
import { LogCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const LogsPanel = () => {
  const [logs, setLogs] = useState([]);
  const [filterType, setFilterType] = useState('all');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLogs(response.data.logs || []);
    } catch (err) {
      console.error('fetchLogs error', err);
      setError('Unable to load logs');
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesType = filterType === 'all' || log.type === filterType;
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      log.action?.toLowerCase().includes(searchLower) ||
      log.details?.toLowerCase().includes(searchLower) ||
      log.user?.toLowerCase().includes(searchLower);
    return matchesType && matchesLevel && matchesSearch;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">System Logs</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading logs...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">System Logs</h1>
          <p className="text-sm text-[#EF4444] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">System Logs</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {logs.length} total events • Real-time activity tracking
        </p>
      </div>

      <input
        type="text"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full bg-[#111111] border border-[#1F1F1F] rounded-lg px-4 py-3 text-white placeholder-[#666666] focus:border-[#FF6A00] outline-none"
      />

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

      {filteredLogs.length > 0 ? (
        <div className="space-y-2">
          {filteredLogs.map((log) => (
            <LogCard
              key={log._id || log.id}
              timestamp={new Date(log.timestamp || log.createdAt || Date.now()).toLocaleString()}
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
