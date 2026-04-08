import { useState, useEffect } from 'react';
import axios from 'axios';
import { MatchCard } from '../components/admin/AdminComponents';
import { MatchRoomDetail } from './MatchRoomDetail';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const LiveMatches = () => {
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const token = localStorage.getItem('clutchzone_token');
        const response = await axios.get(`${API_BASE}/admin/matches`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMatches(response.data.matches || []);
      } catch (error) {
        console.error('Failed to fetch matches:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, []);

  const filteredMatches =
    filterStatus === 'all'
      ? matches
      : matches.filter((m) => m.status === filterStatus);

  const handleCancel = async (matchId) => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/matches/${matchId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh matches
      const response = await axios.get(`${API_BASE}/admin/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data.matches || []);
    } catch (error) {
      console.error('Failed to cancel match:', error);
    }
  };

  if (selectedMatch) {
    return (
      <MatchRoomDetail
        match={selectedMatch}
        onBack={() => setSelectedMatch(null)}
        onUpdate={(updated) => {
          setMatches((prev) =>
            prev.map((m) => (m._id === updated._id ? updated : m))
          );
          setSelectedMatch(updated);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Live Matches</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {loading ? 'Loading...' : `${matches.length} total • ${matches.filter((m) => m.status === 'ongoing').length} active`}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all', 'waiting', 'payment_pending', 'verified', 'ongoing', 'completed', 'cancelled'].map(
          (status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
                filterStatus === status
                  ? 'bg-[#FF6A00] text-black'
                  : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
              }`}
            >
              {status === 'all'
                ? 'All'
                : status
                    .split('_')
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(' ')}
            </button>
          )
        )}
      </div>

      {/* Matches Grid */}
      {loading ? (
        <div className="text-[#A1A1A1] text-center py-8">Loading matches...</div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMatches.map((match) => (
            <MatchCard
              key={match._id}
              matchId={match._id}
              playerA={match.playerA?.username || match.playerA}
              playerB={match.playerB?.username || match.playerB}
              mode={match.mode || 'Unknown'}
              entry={`₹${match.entry}`}
              status={match.status}
              paymentA={match.paymentA}
              paymentB={match.paymentB}
              onOpen={() => setSelectedMatch(match)}
              onCancel={() => handleCancel(match._id)}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-8 text-center">
          <p className="text-[#A1A1A1]">No matches found</p>
        </div>
      )}
    </div>
  );
};
