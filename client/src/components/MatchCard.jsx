import { Users, Clock, Trophy } from 'lucide-react';
import { Card } from './Card';
import { TrustBadge } from './TrustBadge';

export const MatchCard = ({ match, onJoin, user }) => {
  const getModeIcon = (mode) => {
    switch (mode) {
      case '1v1': return '⚔️';
      case '2v2': return '👥';
      case '3v3': return '👨‍👩‍👧';
      case '4v4': return '👨‍👩‍👧‍👦';
      default: return '🎯';
    }
  };

  const getTypeColor = (type) => {
    return type === 'Headshot' ? 'text-red-400' : 'text-blue-400';
  };

  return (
    <Card className="match-card">
      <div className="match-header">
        <div className="match-mode">
          <span className="mode-icon">{getModeIcon(match.mode)}</span>
          <span className="mode-text">{match.mode}</span>
        </div>
        <div className={`match-type ${getTypeColor(match.type)}`}>
          {match.type}
        </div>
      </div>

      <div className="match-details">
        <div className="entry-fee">
          <span className="fee-amount">₹{match.entryFee}</span>
          <span className="fee-label">Entry</span>
        </div>

        <div className="prize-pool">
          <Trophy size={16} />
          <span>₹{match.prizePool}</span>
        </div>
      </div>

      {match.opponent && (
        <div className="opponent-info">
          <Users size={16} />
          <span>vs {match.opponent.username}</span>
          <TrustBadge score={match.opponent.trustScore} />
        </div>
      )}

      <div className="match-actions">
        <button
          className="btn btn-primary"
          onClick={() => onJoin(match)}
          disabled={!user}
        >
          {match.opponent ? 'Accept Match' : 'Find Match'}
        </button>
      </div>
    </Card>
  );
};