import { useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
const TOKEN_KEY = 'clutchzone_token';

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

export const HomeScreen = ({ user, onFindMatch, onScreenChange, currentMatch }) => {
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedType, setSelectedType] = useState('Headshot');
  const [selectedFee, setSelectedFee] = useState(50);

  // Prize pool is fixed per entry amount, not multiplied by player count
  let prizePool;
  if (selectedFee <= 30) {
    prizePool = 50;
  } else if (selectedFee <= 50) {
    prizePool = Math.floor(selectedFee * 1.5);
  } else if (selectedFee <= 100) {
    prizePool = Math.floor(selectedFee * 1.6);
  } else if (selectedFee <= 200) {
    prizePool = Math.floor(selectedFee * 1.7);
  } else {
    prizePool = Math.floor(selectedFee * 1.7);
  }

  const handleFindMatch = async () => {
    if (currentMatch) {
      alert('You already have an active match. Complete it first before creating a new one.');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/create`,
        {
          mode: selectedMode,
          type: selectedType,
          entry: selectedFee,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onFindMatch(response.data.match);
      onScreenChange('pairing');
    } catch (error) {
      alert(error.response?.data?.error || 'API error while creating match');
    }
  };

  const canJoin = true;

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
          Choose any entry fee to preview the prize pool. Players pay manually in the match lobby.
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
            <span className="accent">TG</span>
            <span>{user?.trustScore ?? 0}</span>
          </div>
          <div className="info-key">Trust Score</div>
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
