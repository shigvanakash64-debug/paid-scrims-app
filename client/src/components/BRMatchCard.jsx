import { Users, Clock, Zap } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

/**
 * BRMatchCard - Displays a single BR match listing
 * Shows: match name, entry fee, players, scrim type, per-kill reward, timer
 * Actions: JOIN button (or REGISTERED badge if user is already in)
 */
export const BRMatchCard = ({
  match,
  isRegistered = false,
  inGameName = null,
  onJoin = () => {},
  onViewDetails = () => {},
  user = null,
}) => {
  // Format timer display (MM:SS)
  const formatTimer = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  // Get status badge color
  const getStatusColor = () => {
    switch (match.status) {
      case 'OPEN':
        return 'text-green-400';
      case 'FULL':
        return 'text-yellow-400';
      case 'CLOSED':
        return 'text-red-400';
      case 'COMPLETED':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  return (
    <Card className="br-match-card">
      <div className="br-match-header">
        <div className="br-match-title">
          <h3>{match.matchName}</h3>
          <span className={`br-status-badge ${getStatusColor()}`}>{match.status}</span>
        </div>
      </div>

      <div className="br-match-grid">
        {/* Left column: Entry and Players */}
        <div className="br-match-left">
          <div className="br-match-stat">
            <span className="label">Entry Fee</span>
            <span className="value">₹{match.entryFee}</span>
          </div>

          <div className="br-match-stat">
            <span className="label">Players</span>
            <span className="value">
              {match.currentPlayers}/{match.maxPlayers}
            </span>
          </div>
        </div>

        {/* Middle column: Scrim Type and Per-Kill */}
        <div className="br-match-middle">
          <div className="br-match-stat">
            <span className="label">Scrim Type</span>
            <span className="value">{match.scrimType}</span>
          </div>

          <div className="br-match-stat">
            <span className="label">Per Kill</span>
            <span className="value">₹{match.perKillReward}</span>
          </div>
        </div>

        {/* Right column: Timer */}
        <div className="br-match-right">
          <div className="br-match-stat">
            <span className="label">Timer</span>
            <span className="value timer">{formatTimer(match.timerDuration)}</span>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="br-match-actions">
        {isRegistered ? (
          <>
            <div className="registered-badge">
              <span>✓ Registered</span>
              {inGameName && <span className="ign">IGN: {inGameName}</span>}
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={onViewDetails}
              className="view-details-btn"
            >
              View Details
            </Button>
          </>
        ) : (
          <Button
            variant="primary"
            size="md"
            onClick={onJoin}
            disabled={match.status === 'CLOSED' || match.status === 'FULL' || !user}
          >
            {match.status === 'FULL' ? 'Match Full' : 'JOIN'}
          </Button>
        )}
      </div>
    </Card>
  );
};

export default BRMatchCard;
