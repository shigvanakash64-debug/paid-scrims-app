import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';
const modes = ['1v1', '2v2', '3v3', '4v4'];
const killTypes = ['Normal Headshot', 'Headshot', 'Bodyshot', 'Only One Tap', 'Only Punch', 'Only Desert', 'Only Melee Weapon', 'Only Knife Throw', 'Only SMG Headshot', 'Only AR Headshot', 'Only AWM Bodyshot', 'Only Grenade', 'Rank Clash Squad'];
const entryFees = [5, 10, 20, 30, 50, 100, 200, 500, 1000];

const authConfig = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` } });

export const LeaderboardScreen = ({ user, onScreenChange, onMatchSelect }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const leaderboardResult = await axios.get(`${API_BASE}/leaderboard`, authConfig());
      setPlayers(leaderboardResult.data.players || []);
      setMessage('');
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const timer = setInterval(loadData, 30000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 pb-24 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#FF6A00]">Competitive rankings</p>
            <h1 className="mt-2 text-3xl font-bold">LEADERBOARD</h1>
            <p className="mt-2 text-sm text-[#A1A1A1]">Top 100 players by total winnings.</p>
          </div>
        </div>

        {message && <div className="rounded-2xl border border-[#FF6A00] bg-[#1a0c00] px-4 py-3 text-sm text-[#FFD2B5]">{message}</div>}

        <div className="overflow-hidden rounded-3xl border border-[#1F1F1F] bg-[#111111]">
          <div className="grid grid-cols-[minmax(0,42px)_minmax(0,1fr)_minmax(0,52px)] gap-2 border-b border-[#1F1F1F] px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#737373] sm:grid-cols-[minmax(0,60px)_minmax(0,1fr)_minmax(0,140px)] sm:gap-3 sm:px-5">
            <span className="min-w-0 break-all">Rank</span>
            <span className="min-w-0 break-all">Player</span>
            <span className="min-w-0 break-all">Won</span>
          </div>
          {loading ? <p className="p-8 text-center text-sm text-[#A1A1A1]">Loading rankings...</p> : players.map((player) => (
            <div key={player._id || player.id} className="grid grid-cols-[minmax(0,42px)_minmax(0,1fr)_minmax(0,52px)] items-center gap-2 border-b border-[#1F1F1F] px-4 py-4 last:border-0 sm:grid-cols-[minmax(0,60px)_minmax(0,1fr)_minmax(0,140px)] sm:gap-3 sm:px-5">
              <span className="min-w-0 break-all font-bold text-[#FF6A00]">#{player.rank}</span>
              <div className="min-w-0 break-words"><div className="font-semibold">{player.username}</div>{player.title && <div className="mt-1 text-xs text-[#A1A1A1]">({player.title})</div>}</div>
              <span className="min-w-0 break-all text-sm font-semibold">{Number(player.totalWon || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
