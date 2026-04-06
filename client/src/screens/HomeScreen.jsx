import { useState } from 'react';

const modeOptions = [
  { label: '1v1', sub: 'Solo' },
  { label: '2v2', sub: 'Duo' },
  { label: '3v3', sub: 'Trio' },
  { label: '4v4', sub: 'Squad' }
];

const typeOptions = [
  { label: 'Headshot', sub: 'Precision' },
  { label: 'Bodyshot', sub: 'Standard' }
];

const entryFees = [30, 50, 100, 200, 500, 1000];

export const HomeScreen = ({ user, onFindMatch, onScreenChange }) => {
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedType, setSelectedType] = useState('Headshot');
  const [selectedFee, setSelectedFee] = useState(50);

  const prizePool = Math.floor(selectedFee * 1.8);

  const handleFindMatch = () => {
    const match = {
      id: Date.now().toString(),
      mode: selectedMode,
      type: selectedType,
      entryFee: selectedFee,
      prizePool,
      roomId: 'FF-8847-XK',
      password: '9921',
      server: 'IN-Mumbai',
      opponent: {
        username: 'GHOST_X99',
        trustScore: 91,
        winRate: '78%'
      }
    };

    onFindMatch(match);
    onScreenChange('match');
  };

  return (
    <div id="screen-home" className="screen-home">
      <div className="hero">
        <div className="game-pill">
          <div className="game-dot"></div>
          <span>Free Fire</span>
        </div>
        <div className="screen-title">CLUTCH ZONE</div>
        <div className="screen-sub">Compete. Win. Get Paid.</div>
      </div>

      <div className="section">
        <div className="section-label">Match Mode</div>
        <div className="grid2">
          {modeOptions.map((mode) => (
            <button
              key={mode.label}
              type="button"
              className={`sel-btn ${selectedMode === mode.label ? 'active' : ''}`}
              onClick={() => setSelectedMode(mode.label)}
            >
              {mode.label}
              <span className="sub">{mode.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Kill Type</div>
        <div className="grid2">
          {typeOptions.map((type) => (
            <button
              key={type.label}
              type="button"
              className={`sel-btn ${selectedType === type.label ? 'active' : ''}`}
              onClick={() => setSelectedType(type.label)}
            >
              {type.label}
              <span className="sub">{type.sub}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Entry Fee</div>
        <div className="grid3">
          {entryFees.map((fee) => (
            <button
              key={fee}
              type="button"
              className={`fee-btn ${selectedFee === fee ? 'active' : ''}`}
              onClick={() => setSelectedFee(fee)}
              disabled={!user || user.balance < fee}
            >
              ₹{fee}
            </button>
          ))}
        </div>
      </div>

      <div className="info-strip">
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">₹</span>
            <span>{prizePool}</span>
          </div>
          <div className="info-key">Prize Pool</div>
        </div>
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">#</span>1,204
          </div>
          <div className="info-key">Online</div>
        </div>
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">~</span>45s
          </div>
          <div className="info-key">Wait</div>
        </div>
      </div>

      <div className="btn-cta-wrap">
        <button className="btn-primary" type="button" onClick={handleFindMatch}>
          FIND MATCH
        </button>
      </div>
    </div>
  );
};
