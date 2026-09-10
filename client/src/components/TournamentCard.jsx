import { useState } from 'react';
import { Card } from './Card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const TournamentCard = ({ tournament, user, onJoined }) => {
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState([]);
  const handleJoin = async () => {
    if (!user) {
      window.alert('Please login to join this tournament');
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('clutchzone_token')}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to join tournament');
      window.alert('Tournament joined successfully');
      onJoined?.();
    } catch (error) {
      window.alert(error.message);
    }
  };

  const handleViewResults = async () => {
    setShowResults(true);
    const response = await fetch(`${API_BASE}/tournaments/${tournament._id}/public-matches`);
    const data = await response.json();
    if (response.ok) setResults(data.results || []);
  };
  const stageCount = tournament.stages?.length || 0;
  const hostUsername = tournament?.createdBy?.username || tournament?.hostUsername || 'Host';
  const isPerKillTournament = tournament?.format === 'single-match';
  const isJoined = Boolean(tournament?.isRegistered || tournament?.registered || tournament?.joined);

  return (
    <Card className="br-match-card">
      <div className="br-match-header">
        <div className="br-match-title">
          <h3>{tournament.name}</h3>
          <div className="mt-1 text-xs text-[#A1A1A1]">Host: {hostUsername}</div>
          <span className="br-status-badge text-green-400">OPEN FOR REGISTRATION</span>
        </div>
      </div>
      <div className="br-match-grid">
        <div className="br-match-left">
          <div className="br-match-stat"><span className="label">Game</span><span className="value">{tournament.game}</span></div>
          <div className="br-match-stat"><span className="label">Entry Fee</span><span className="value">₹{tournament.entryFee}</span></div>
        </div>
        <div className="br-match-middle">
          <div className="br-match-stat"><span className="label">Paid Entries</span><span className="value">{tournament.successfulEntries}/{tournament.maxTeams}</span></div>
          {tournament.format === 'single-match' ? <div className="br-match-stat"><span className="label">Per Kill</span><span className="value">₹{Number(tournament.perKillReward || 0).toLocaleString()}</span></div> : <div className="br-match-stat"><span className="label">Prize Pool</span><span className="value">₹{Number(tournament.prizePool || 0).toLocaleString()}</span></div>}
        </div>
        <div className="br-match-right">
          <div className="br-match-stat"><span className="label">Stages</span><span className="value timer">{stageCount}</span></div>
        </div>
      </div>
      <div className="br-match-actions">
        <span className="registered-badge">{tournament.format === 'single-match' ? 'Per Kill Tournament' : tournament.format} · OPEN</span>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleJoin} disabled={isJoined || tournament.successfulEntries >= tournament.maxTeams}>
          {isJoined ? 'Joined' : tournament.successfulEntries >= tournament.maxTeams ? 'Full' : 'Join'}
        </button>
        <button type="button" className="btn btn-sm btn-secondary" onClick={handleViewResults}>View Results</button>
      </div>
      {showResults && <div className="mt-4 border-t border-[#1F1F1F] pt-3"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-white">Published Results</span><button type="button" className="text-sm text-[#A1A1A1]" onClick={() => setShowResults(false)}>Close</button></div>{results.length === 0 ? <p className="mt-3 text-sm text-[#A1A1A1]">Result not published yet.</p> : <div className="mt-3 space-y-2">{results.map((result) => <div key={`${result.matchId}-${result._id}`} className="border-t border-[#1F1F1F] pt-2"><p className="text-xs text-[#FFB066]">{result.stageKey} · Match</p><div className="mt-2 grid grid-cols-4 text-xs uppercase tracking-wide text-[#A1A1A1]"><span>Top</span><span>Name</span><span>{isPerKillTournament ? 'Kill' : 'Score'}</span><span>{isPerKillTournament ? 'Money' : 'Points'}</span></div>{[...result.entries].sort((a, b) => Number(b.kills ?? b.points ?? 0) - Number(a.kills ?? a.points ?? 0) || Number(b.money ?? 0) - Number(a.money ?? 0)).map((entry, index) => <div key={entry.participantId} className="mt-2 grid grid-cols-4 text-sm text-white"><span>{index + 1}</span><span>{entry.participantName}</span><span>{isPerKillTournament ? Number(entry.kills ?? 0) : Number(entry.points ?? 0)}</span><span>{isPerKillTournament ? `₹${Number(entry.money ?? 0)}` : Number(entry.points ?? 0)}</span></div>)}</div>)}</div>}</div>}
    </Card>
  );
};

export default TournamentCard;