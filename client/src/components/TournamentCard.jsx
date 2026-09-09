import { Card } from './Card';

export const TournamentCard = ({ tournament }) => {
  const stageCount = tournament.stages?.length || 0;

  return (
    <Card className="br-match-card">
      <div className="br-match-header">
        <div className="br-match-title">
          <h3>{tournament.name}</h3>
          <span className="br-status-badge text-green-400">TOURNAMENT</span>
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
        <span className="registered-badge">{tournament.format} · {tournament.status}</span>
      </div>
    </Card>
  );
};

export default TournamentCard;