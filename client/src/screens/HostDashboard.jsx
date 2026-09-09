import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostDashboard = ({ onNavigate }) => {
  const [tournaments, setTournaments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadTournaments = async () => {
      try {
        const response = await fetch(`${API_BASE}/tournaments`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to load tournaments');
        setTournaments(data.tournaments || []);
      } catch (loadError) {
        setError(loadError.message);
      }
    };
    loadTournaments();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Host Dashboard</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">Create tournaments or operate individual Battle Royale matches.</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-white">🏆 Tournaments</h2><p className="text-sm text-[#A1A1A1]">Tournament is the parent for stages and matches.</p></div>
          <Button variant="primary" size="md" onClick={() => onNavigate?.('tournaments')} className="flex items-center gap-2"><Plus size={16} /> Create Tournament</Button>
        </div>
        {error && <p className="text-sm text-[#FCA5A5]">{error}</p>}
        {tournaments.length === 0 ? <Card><p className="text-sm text-[#A1A1A1]">No tournaments created yet.</p></Card> : (
          <div className="grid gap-4 md:grid-cols-2">
            {tournaments.map((tournament) => <Card key={tournament._id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{tournament.name}</h3><p className="mt-1 text-xs text-[#A1A1A1]">{tournament.game} · {tournament.format}</p></div><span className="text-xs text-[#FFB066]">{tournament.status}</span></div><div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[#A1A1A1]"><span>Entry<br /><b className="text-white">₹{tournament.entryFee}</b></span><span>Teams<br /><b className="text-white">{tournament.maxTeams}</b></span><span>Prize Pool<br /><b className="text-white">₹{tournament.prizePool}</b></span></div></Card>)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4"><div><h2 className="text-xl font-bold text-white">🎮 Battle Royale Matches</h2><p className="text-sm text-[#A1A1A1]">Create and manage individual BR matches.</p></div><Button variant="secondary" size="md" onClick={() => onNavigate?.('br-matches')} className="flex items-center gap-2"><Plus size={16} /> Create BR Match</Button></div>
      </section>
    </div>
  );
};