import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const AdminLeaderboardPanel = () => {
  const [players, setPlayers] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const token = localStorage.getItem('clutchzone_token');
        const response = await axios.get(`${API_BASE}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } });
        setPlayers(response.data.players || []);
      } catch (loadError) {
        setError(loadError.response?.data?.error || 'Unable to load leaderboard');
      }
    };
    loadLeaderboard();
  }, []);

  return (
    <div className="space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Leaderboard</h1><p className="mt-2 text-sm text-[#A1A1A1]">Top 100 players, winnings, and current titles.</p></div>
      {error && <p className="text-sm text-[#EF4444]">{error}</p>}
      <div className="overflow-hidden rounded-lg border border-[#1F1F1F] bg-[#111111]">
        <div className="grid grid-cols-[60px_1fr_140px_180px] gap-3 border-b border-[#1F1F1F] px-4 py-3 text-xs uppercase tracking-[0.14em] text-[#737373]"><span>Rank</span><span>Username</span><span>Total won</span><span>Title</span></div>
        {players.map((player) => <div key={player.id || player._id} className="grid grid-cols-[60px_1fr_140px_180px] gap-3 border-b border-[#1F1F1F] px-4 py-4 text-sm last:border-0"><span className="font-bold text-[#FF6A00]">#{player.rank}</span><span className="font-semibold text-white">{player.username}</span><span className="text-white">CZ{Number(player.totalWon || 0).toLocaleString()}</span><span className="text-[#A1A1A1]">{player.title ? `(${player.title})` : 'No title'}</span></div>)}
      </div>
    </div>
  );
};