import { useEffect, useState } from 'react';

export const MatchScreen = ({ match, user, onScreenChange }) => {
  const [timerSeconds, setTimerSeconds] = useState(892);

  useEffect(() => {
    if (!match) return undefined;

    const interval = setInterval(() => {
      setTimerSeconds((prev) => Math.max(prev - 1, 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [match]);

  const formatTime = (seconds) => {
    const minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
  };

  if (!match) {
    return (
      <div className="screen-match">
        <div className="hero">
          <div className="screen-title">LIVE MATCH</div>
          <div className="screen-sub">No active match found</div>
        </div>
        <div className="section">
          <div className="section-label">Match Status</div>
          <div className="info-strip">
            <div className="info-cell">
              <div className="info-val">N/A</div>
              <div className="info-key">Room</div>
            </div>
            <div className="info-cell">
              <div className="info-val">N/A</div>
              <div className="info-key">Opponent</div>
            </div>
            <div className="info-cell">
              <div className="info-val">N/A</div>
              <div className="info-key">Time</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="screen-match" className="screen-match">
      <div className="hero">
        <div className="screen-title">LIVE MATCH</div>
        <div className="screen-sub">Room has been assigned</div>
      </div>
      <div className="opponent-card">
        <div className="opp-header">
          <span className="opp-header-label">Opponent</span>
          <div className="status-live">
            <div className="live-dot"></div>
            <span className="live-text">Live</span>
          </div>
        </div>
        <div className="opp-body">
          <div className="opp-name">{match.opponent?.username ?? 'GHOST_X99'}</div>
          <div className="opp-stats">
            <div className="opp-stat">W/L: <strong>142/38</strong></div>
            <div className="opp-stat">TG: <strong style={{ color: 'var(--orange)' }}>{match.opponent?.trustScore ?? 91}</strong></div>
            <div className="opp-stat">WR: <strong>{match.opponent?.winRate ?? '78%'}</strong></div>
          </div>
        </div>
      </div>
      <div className="timer-block">
        <div className="timer-label">Match Ends In</div>
        <div className="timer-val" style={{ color: timerSeconds < 60 ? 'var(--danger)' : 'var(--orange)' }}>
          {formatTime(timerSeconds)}
        </div>
      </div>
      <div className="match-details">
        <div className="detail-row"><span className="detail-key">Mode</span><span className="detail-val orange">{match.mode} {match.type}</span></div>
        <div className="detail-row"><span className="detail-key">Entry Fee</span><span className="detail-val">₹{match.entryFee}</span></div>
        <div className="detail-row"><span className="detail-key">Prize Pool</span><span className="detail-val orange">₹{match.prizePool}</span></div>
        <div className="detail-row"><span className="detail-key">Room ID</span><span className="detail-val">{match.roomId}</span></div>
        <div className="detail-row"><span className="detail-key">Password</span><span className="detail-val">{match.password}</span></div>
        <div className="detail-row"><span className="detail-key">Server</span><span className="detail-val">{match.server}</span></div>
      </div>
      <div className="btn-cta-wrap">
        <button className="btn-primary" type="button" onClick={() => onScreenChange('result')}>
          SUBMIT RESULT
        </button>
      </div>
    </div>
  );
};
