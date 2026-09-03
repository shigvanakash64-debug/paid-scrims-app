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
  const [challenges, setChallenges] = useState([]);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [form, setForm] = useState({ mode: '1v1', type: 'Normal Headshot', entry: 20 });
  const [panelOpen, setPanelOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const loadData = async () => {
    try {
      const [leaderboardResponse, challengesResponse] = await Promise.all([
        axios.get(`${API_BASE}/leaderboard`, authConfig()),
        axios.get(`${API_BASE}/challenges`, authConfig()),
      ]);
      setPlayers(leaderboardResponse.data.players || []);
      setChallenges(challengesResponse.data.challenges || []);
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

  const pendingChallenges = challenges.filter((challenge) => challenge.status === 'pending' && String(challenge.challengedPlayer?._id || challenge.challengedPlayer) === String(user?.id || user?._id));

  const sendChallenge = async () => {
    try {
      await axios.post(`${API_BASE}/challenges`, {
        targetUserId: selectedPlayer._id || selectedPlayer.id,
        ...form,
      }, authConfig());
      setMessage(`Challenge sent to ${selectedPlayer.username}`);
      setSelectedPlayer(null);
      await loadData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Unable to send challenge');
    }
  };

  const handleChallengeAction = async (challengeId, action) => {
    try {
      const response = await axios.post(`${API_BASE}/challenges/${challengeId}/${action}`, {}, authConfig());
      setMessage(action === 'accept' ? 'Challenge accepted. Match is ready for payment.' : 'Challenge declined');
      setChallenges((current) => current.map((challenge) => challenge._id === challengeId ? { ...challenge, status: action === 'accept' ? 'accepted' : 'declined' } : challenge));
      if (action === 'accept' && response.data.match) {
        onMatchSelect(response.data.match);
        onScreenChange('pairing');
      }
    } catch (error) {
      setMessage(error.response?.data?.error || `Unable to ${action} challenge`);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] px-4 pb-24 pt-6 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-[#FF6A00]">Competitive rankings</p>
            <h1 className="mt-2 text-3xl font-bold">LEADERBOARD</h1>
            <p className="mt-2 text-sm text-[#A1A1A1]">Top 100 players by total winnings.</p>
          </div>
          <button type="button" onClick={() => setPanelOpen((open) => !open)} className="relative rounded-2xl border border-[#2A2A2A] bg-[#111111] px-4 py-3 text-xl" aria-label="Open challenges">
            🔔
            {pendingChallenges.length > 0 && <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-[#EF4444]" />}
          </button>
        </div>

        {message && <div className="rounded-2xl border border-[#FF6A00] bg-[#1a0c00] px-4 py-3 text-sm text-[#FFD2B5]">{message}</div>}

        {panelOpen && (
          <section className="rounded-3xl border border-[#2A2A2A] bg-[#111111] p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-semibold">CHALLENGES</h2><button type="button" onClick={() => setPanelOpen(false)} className="text-sm text-[#A1A1A1]">Close</button></div>
            <div className="mt-4 space-y-3">
              {pendingChallenges.length === 0 ? <p className="text-sm text-[#A1A1A1]">No pending challenges.</p> : pendingChallenges.map((challenge) => (
                <div key={challenge._id} className="rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-4">
                  <p className="font-semibold">{challenge.challenger?.username || 'Player'} challenged you</p>
                  <p className="mt-2 text-sm text-[#A1A1A1]">{challenge.mode} • {challenge.type} • CZ{challenge.entry}</p>
                  <div className="mt-4 flex gap-2"><button type="button" onClick={() => handleChallengeAction(challenge._id, 'accept')} className="rounded-xl bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-black">ACCEPT</button><button type="button" onClick={() => handleChallengeAction(challenge._id, 'decline')} className="rounded-xl border border-[#EF4444] px-4 py-2 text-sm font-semibold text-[#EF4444]">DECLINE</button></div>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="overflow-hidden rounded-3xl border border-[#1F1F1F] bg-[#111111]">
          <div className="grid grid-cols-[42px_minmax(0,1fr)_52px_104px] gap-2 border-b border-[#1F1F1F] px-4 py-3 text-xs uppercase tracking-[0.16em] text-[#737373] sm:grid-cols-[60px_minmax(0,1fr)_140px_140px] sm:gap-3 sm:px-5"><span>Rank</span><span>Player</span><span>Won</span><span /></div>
          {loading ? <p className="p-8 text-center text-sm text-[#A1A1A1]">Loading rankings...</p> : players.map((player) => (
            <div key={player._id || player.id} className="grid grid-cols-[42px_minmax(0,1fr)_52px_104px] items-center gap-2 border-b border-[#1F1F1F] px-4 py-4 last:border-0 sm:grid-cols-[60px_minmax(0,1fr)_140px_140px] sm:gap-3 sm:px-5">
              <span className="font-bold text-[#FF6A00]">#{player.rank}</span>
              <div className="min-w-0 break-words"><div className="font-semibold">{player.username}</div>{player.title && <div className="mt-1 text-xs text-[#A1A1A1]">({player.title})</div>}</div>
              <span className="text-sm font-semibold">{Number(player.totalWon || 0).toLocaleString()}</span>
              <button type="button" disabled={String(player._id || player.id) === String(user?.id || user?._id)} onClick={() => setSelectedPlayer(player)} className="w-full min-w-0 rounded-xl border border-[#FF6A00] px-1 py-2 text-xs font-semibold text-[#FF6A00] disabled:cursor-not-allowed disabled:opacity-30">Challenge</button>
            </div>
          ))}
        </div>

        {selectedPlayer && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"><div className="w-full max-w-md rounded-3xl border border-[#2A2A2A] bg-[#111111] p-5"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Challenge {selectedPlayer.username}</h2><button type="button" onClick={() => setSelectedPlayer(null)} className="text-[#A1A1A1]">Close</button></div><div className="mt-5 space-y-4"><label className="block text-sm text-[#A1A1A1]">Match Mode<select value={form.mode} onChange={(event) => setForm({ ...form, mode: event.target.value })} className="mt-2 w-full rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-3 text-white">{modes.map((mode) => <option key={mode}>{mode}</option>)}</select></label><label className="block text-sm text-[#A1A1A1]">Kill Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className="mt-2 w-full rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-3 text-white">{killTypes.map((type) => <option key={type}>{type}</option>)}</select></label><label className="block text-sm text-[#A1A1A1]">Entry Fee<select value={form.entry} onChange={(event) => setForm({ ...form, entry: Number(event.target.value) })} className="mt-2 w-full rounded-xl border border-[#2A2A2A] bg-[#0B0B0B] p-3 text-white">{entryFees.map((fee) => <option key={fee} value={fee}>CZ{fee}</option>)}</select></label><button type="button" onClick={sendChallenge} className="w-full rounded-2xl bg-[#FF6A00] px-5 py-4 text-sm font-bold tracking-[0.14em] text-black">SEND CHALLENGE</button></div></div></div>}
      </div>
    </div>
  );
};
