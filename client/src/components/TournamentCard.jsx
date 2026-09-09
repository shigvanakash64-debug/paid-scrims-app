import { Card } from './Card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const TournamentCard = ({ tournament, user, onJoined }) => {
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
  const stageCount = tournament.stages?.length || 0;

  return (
    <Card className="br-match-card">
      <div className="br-match-header">
        <div className="br-match-title">
          <h3>{tournament.name}</h3>
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
          <div className="br-match-stat"><span className="label">Prize Pool</span><span className="value">₹{Number(tournament.prizePool || 0).toLocaleString()}</span></div>
        </div>
        <div className="br-match-right">
          <div className="br-match-stat"><span className="label">Stages</span><span className="value timer">{stageCount}</span></div>
        </div>
      </div>
      <div className="br-match-actions">
        <span className="registered-badge">{tournament.format} · OPEN</span>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleJoin} disabled={tournament.successfulEntries >= tournament.maxTeams}>
          {tournament.successfulEntries >= tournament.maxTeams ? 'Full' : 'Join'}
        </button>
      </div>
    </Card>
  );
};

export default TournamentCard;