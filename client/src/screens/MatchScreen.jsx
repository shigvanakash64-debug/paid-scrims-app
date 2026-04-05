import { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Timer } from '../components/Timer';
import { TrustBadge } from '../components/TrustBadge';
import { Users, MapPin, Clock } from 'lucide-react';

export const MatchScreen = ({ match, user, onScreenChange }) => {
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [matchStatus, setMatchStatus] = useState('waiting');

  useEffect(() => {
    if (match) {
      // Simulate finding opponent after 3 seconds
      const timer = setTimeout(() => {
        setMatchStatus('found');
        setMatch({
          ...match,
          opponent: {
            username: 'OpponentX',
            trustScore: 78,
            level: 45
          },
          roomId: 'FF123456',
          password: 'scrim2024'
        });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [match]);

  const handleSubmitResult = () => {
    onScreenChange('result');
  };

  if (!match) {
    return (
      <div className="match-screen">
        <Card>
          <div className="loading-state">
            <h2>No Active Match</h2>
            <p>Go back to find a match</p>
            <Button onClick={() => onScreenChange('home')}>
              Find Match
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="match-screen">
      {matchStatus === 'waiting' ? (
        <Card className="match-searching">
          <div className="searching-content">
            <div className="searching-animation">
              <div className="spinner"></div>
            </div>
            <h2>Finding Match...</h2>
            <p>Looking for players with similar skill level</p>
            <div className="match-details">
              <div className="detail-item">
                <span>Mode:</span>
                <strong>{match.mode}</strong>
              </div>
              <div className="detail-item">
                <span>Entry:</span>
                <strong>₹{match.entryFee}</strong>
              </div>
              <div className="detail-item">
                <span>Prize:</span>
                <strong>₹{match.prizePool}</strong>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <div className="match-active">
          <Card className="match-info">
            <div className="match-header">
              <h2>Match Found!</h2>
              <div className="match-meta">
                <span className="match-id">ID: {match.roomId}</span>
                <Timer
                  deadline={new Date(Date.now() + timeLeft * 1000)}
                  onExpire={() => setMatchStatus('expired')}
                />
              </div>
            </div>

            <div className="room-details">
              <div className="room-item">
                <MapPin size={16} />
                <span>Room: {match.roomId}</span>
              </div>
              <div className="room-item">
                <span>Password: {match.password}</span>
              </div>
            </div>

            <div className="players-section">
              <div className="player-card current-player">
                <div className="player-avatar">
                  <Users size={24} />
                </div>
                <div className="player-info">
                  <span className="player-name">{user?.username} (You)</span>
                  <TrustBadge score={user?.trustScore || 100} />
                </div>
              </div>

              <div className="vs-divider">VS</div>

              <div className="player-card opponent">
                <div className="player-avatar">
                  <Users size={24} />
                </div>
                <div className="player-info">
                  <span className="player-name">{match.opponent.username}</span>
                  <TrustBadge score={match.opponent.trustScore} />
                </div>
              </div>
            </div>

            <div className="match-instructions">
              <h3>How to Play:</h3>
              <ol>
                <li>Join the room with the provided ID and password</li>
                <li>Complete the match according to the rules</li>
                <li>Take a screenshot of the final result</li>
                <li>Submit your result within the time limit</li>
              </ol>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="submit-result-btn"
              onClick={handleSubmitResult}
            >
              Submit Result
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};