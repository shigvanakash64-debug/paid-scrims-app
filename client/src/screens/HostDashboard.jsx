import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { AdminBRMatchResultsView } from '../components/AdminBRMatchResultsView';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const HostDashboard = ({ onNavigate }) => {
  const [tournaments, setTournaments] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [messageDrafts, setMessageDrafts] = useState({});
  const [error, setError] = useState('');

  const showPrizePool = (format) => format !== 'single-match';
  const getCollectedAmount = (tournament) => Number(tournament.totalCollection || (tournament.entryFee || 0) * (tournament.successfulEntries || 0) || 0);

  const loadDashboard = async () => {
    try {
      const headers = { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` };
      const [tournamentResponse, matchResponse] = await Promise.all([
        fetch(`${API_BASE}/tournaments`, { headers }),
        fetch(`${API_BASE}/br-match/list`, { headers }),
      ]);
      const tournamentData = await tournamentResponse.json();
      const matchData = await matchResponse.json();
      if (!tournamentResponse.ok) throw new Error(tournamentData.error || 'Failed to load tournaments');
      if (!matchResponse.ok) throw new Error(matchData.error || 'Failed to load matches');
      setTournaments(tournamentData.tournaments || []);
      setMatches(matchData.matches || []);
    } catch (loadError) {
      setError(loadError.message);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleDeleteTournament = async (tournamentId) => {
    const confirmed = window.confirm('Delete this tournament? This cannot be undone.');
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to delete tournament');
      setTournaments((current) => current.filter((tournament) => tournament._id !== tournamentId));
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  const handleMessageSave = async (tournamentId, message) => {
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournamentId}/message`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({ message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save tournament message');
      setTournaments((current) => current.map((tournament) => tournament._id === tournamentId ? { ...tournament, hostMessage: data.tournament.hostMessage || message } : tournament));
    } catch (saveError) {
      setError(saveError.message);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Host Dashboard</h1>
        <p className="mt-2 text-sm text-[#A1A1A1]">Create tournaments and manage your hosted matches and results.</p>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h2 className="text-xl font-bold text-white">🏆 Tournaments</h2><p className="text-sm text-[#A1A1A1]">Tournament is the parent for stages and matches.</p></div>
          <Button variant="primary" size="md" onClick={() => onNavigate?.('tournaments')} className="flex items-center gap-2"><Plus size={16} /> Create Tournament</Button>
        </div>
        {error && <p className="text-sm text-[#FCA5A5]">{error}</p>}
        {tournaments.length === 0 ? <Card><p className="text-sm text-[#A1A1A1]">No tournaments created yet.</p></Card> : (
          <div className="grid gap-4 md:grid-cols-2">
            {tournaments.map((tournament) => <Card key={tournament._id}><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold text-white">{tournament.name}</h3><p className="mt-1 text-xs text-[#A1A1A1]">{tournament.game} · {tournament.format === 'single-match' ? 'Per Kill Tournament' : tournament.format}</p></div><span className="text-xs text-[#FFB066]">{tournament.status}</span></div><div className={`mt-4 grid gap-2 text-xs text-[#A1A1A1] ${showPrizePool(tournament.format) ? 'grid-cols-3' : 'grid-cols-4'}`}><span>Entry<br /><b className="text-white">₹{tournament.entryFee}</b></span><span>Paid Entries<br /><b className="text-white">{tournament.successfulEntries || 0}/{tournament.maxTeams}</b></span>{showPrizePool(tournament.format) ? <span>Prize Pool<br /><b className="text-white">₹{Number(tournament.prizePool || 0).toLocaleString()}</b></span> : <span>Collected<br /><b className="text-white">₹{getCollectedAmount(tournament).toLocaleString()}</b></span>}{!showPrizePool(tournament.format) && <span>Per Kill<br /><b className="text-white">₹{Number(tournament.perKillReward || 0).toLocaleString()}</b></span>}</div><div className="mt-4 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3 text-xs text-[#A1A1A1] space-y-1">{tournament.estimatedDate && <div><span className="text-[#A1A1A1]">Schedule:</span> <b className="text-white">{new Date(tournament.estimatedDate).toLocaleDateString()}</b></div>}{tournament.estimatedTime && String(tournament.estimatedTime) !== 'undefined' && <div><span className="text-[#A1A1A1]">Time:</span> <b className="text-white">{tournament.estimatedTime}</b></div>}{!tournament.estimatedDate && !tournament.estimatedTime && <div className="text-[#A1A1A1]">No schedule yet</div>}</div><div className="mt-4 rounded-lg border border-[#1F1F1F] bg-[#0B0B0B] p-3"><label className="block text-[10px] uppercase tracking-[0.2em] text-[#A1A1A1]">Host Message</label>{editingMessageId === tournament._id ? (<><textarea value={(messageDrafts[tournament._id] ?? tournament.hostMessage ?? '')} onChange={(event) => setMessageDrafts((current) => ({ ...current, [tournament._id]: event.target.value }))} className="mt-2 w-full rounded-md border border-[#2B2B2B] bg-[#111111] px-3 py-2 text-sm text-white outline-none focus:border-[#FF6A00]" rows={3} placeholder="Add a message for players" /><div className="mt-3 flex justify-end gap-2"><Button variant="secondary" size="sm" onClick={() => setEditingMessageId(null)}>Cancel</Button><Button variant="secondary" size="sm" onClick={() => { const nextMessage = messageDrafts[tournament._id] ?? tournament.hostMessage ?? ''; handleMessageSave(tournament._id, nextMessage); setEditingMessageId(null); }}>Save Message</Button></div></>) : (<><p className="mt-2 text-sm text-white">{tournament.hostMessage || 'No host message yet.'}</p><div className="mt-3 flex justify-end"><Button variant="secondary" size="sm" onClick={() => { setEditingMessageId(tournament._id); setMessageDrafts((current) => ({ ...current, [tournament._id]: tournament.hostMessage || '' })); }}>Edit</Button></div></>)}</div><div className="mt-4 flex gap-3"><Button variant="secondary" size="sm" className="flex-1" onClick={() => onNavigate?.('tournament-matches', tournament._id)}>Manage Matches & Results</Button><Button variant="secondary" size="sm" className="min-w-[78px]" onClick={() => handleDeleteTournament(tournament._id)}>Delete</Button></div></Card>)}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div><h2 className="text-xl font-bold text-white">Hosted Matches & Results</h2><p className="text-sm text-[#A1A1A1]">Matches created by you appear here. Open a match to review submitted results.</p></div>
        {matches.length === 0 ? <Card><p className="text-sm text-[#A1A1A1]">No hosted matches found.</p></Card> : <div className="space-y-3">{matches.map((match) => <Card key={match._id}><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold text-white">{match.matchName}</h3><p className="text-xs text-[#A1A1A1]">{match.status} · {match.currentPlayers}/{match.maxPlayers} players · ₹{match.entryFee} entry</p></div><Button variant="secondary" size="sm" onClick={() => setSelectedMatchId(match._id)}>Manage Results</Button></div></Card>)}</div>}
      </section>
      {selectedMatchId && <AdminBRMatchResultsView matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />}
    </div>
  );
};