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

const calculateCommission = (entryFee) => {
  if (entryFee <= 30) return entryFee / 3;
  if (entryFee <= 50) return entryFee * 0.4;
  return entryFee * 0.3;
};

const getPlayersCount = (mode) => {
  switch (mode) {
    case '2v2':
      return 4;
    case '3v3':
      return 6;
    case '4v4':
      return 8;
    default:
      return 2;
  }
};

export const HomeScreen = ({ user, onFindMatch, onScreenChange }) => {
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedType, setSelectedType] = useState('Headshot');
  const [selectedFee, setSelectedFee] = useState(50);

  const playersCount = getPlayersCount(selectedMode);
  const totalPool = selectedFee * playersCount;
  const platformFee = calculateCommission(selectedFee);
  const prizePool = Math.floor(totalPool - platformFee);

  const handleFindMatch = () => {
    const match = {
      id: Date.now().toString(),
      mode: selectedMode,
      type: selectedType,
      entryFee: selectedFee,
      prizePool
    };

    onFindMatch(match);
    onScreenChange('match');
  };

  const canJoin = user?.balance >= selectedFee;

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
            >
              ₹{fee}
            </button>
          ))}
        </div>
        <div className="fee-note">
          Choose any entry fee to preview the prize pool. You can only start the match if your balance covers the selected fee.
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
            <span className="accent">₹</span>
            <span>{user?.balance ?? 0}</span>
          </div>
          <div className="info-key">Balance</div>
        </div>
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">TG</span>
            <span>{user?.trustScore ?? 0}</span>
          </div>
          <div className="info-key">Trust Score</div>
        </div>
      </div>

      <div className="btn-cta-wrap">
        <button className="btn-primary" type="button" onClick={handleFindMatch} disabled={!canJoin}>
          {canJoin ? 'FIND MATCH' : 'INSUFFICIENT BALANCE'}
        </button>
      </div>
    </div>
  );
};
