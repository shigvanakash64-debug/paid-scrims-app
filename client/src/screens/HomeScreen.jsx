import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { MatchCard } from '../components/MatchCard';

export const HomeScreen = ({ user, onFindMatch, onScreenChange }) => {
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedType, setSelectedType] = useState('Headshot');

  const modes = ['1v1', '2v2', '3v3', '4v4'];
  const types = ['Headshot', 'Bodyshot'];
  const entryFees = [30, 50, 100, 200, 500, 1000];

  const handleFindMatch = (entryFee) => {
    const match = {
      id: Date.now().toString(),
      mode: selectedMode,
      type: selectedType,
      entryFee,
      prizePool: entryFee * 1.8, // 90% house edge
      status: 'searching',
      createdAt: new Date()
    };

    onFindMatch(match);
    onScreenChange('match');
  };

  return (
    <div className="home-screen">
      <div className="game-header">
        <h1>Free Fire</h1>
        <p>Compete in ranked scrims</p>
      </div>

      {/* Mode Selection */}
      <Card className="selection-card">
        <h3>Mode</h3>
        <div className="option-grid">
          {modes.map((mode) => (
            <button
              key={mode}
              className={`option-btn ${selectedMode === mode ? 'active' : ''}`}
              onClick={() => setSelectedMode(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </Card>

      {/* Type Selection */}
      <Card className="selection-card">
        <h3>Type</h3>
        <div className="option-grid">
          {types.map((type) => (
            <button
              key={type}
              className={`option-btn ${selectedType === type ? 'active' : ''}`}
              onClick={() => setSelectedType(type)}
            >
              {type}
            </button>
          ))}
        </div>
      </Card>

      {/* Entry Fee Selection */}
      <Card className="selection-card">
        <h3>Entry Fee</h3>
        <div className="fee-grid">
          {entryFees.map((fee) => (
            <Button
              key={fee}
              variant="primary"
              className="fee-btn"
              onClick={() => handleFindMatch(fee)}
              disabled={!user || user.balance < fee}
            >
              ₹{fee}
            </Button>
          ))}
        </div>
      </Card>

      {/* Quick Stats */}
      {user && (
        <Card className="stats-card">
          <div className="stat-item">
            <span className="stat-label">Balance</span>
            <span className="stat-value">₹{user.balance}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Trust Score</span>
            <span className="stat-value trust-score">{user.trustScore}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Win Rate</span>
            <span className="stat-value">
              {user.matchesPlayed > 0
                ? Math.round((user.matchesWon / user.matchesPlayed) * 100)
                : 0}%
            </span>
          </div>
        </Card>
      )}
    </div>
  );
};