import { useState } from 'react';

const filterOptions = [
  'Region',
  'Skill Level',
  'Latency',
  'Platform',
];

export const PairingScreen = ({ match, user, onScreenChange }) => {
  const [selectedFilters, setSelectedFilters] = useState([]);

  const toggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter) ? prev.filter((item) => item !== filter) : [...prev, filter]
    );
  };

  return (
    <div id="screen-pairing" className="screen-pairing">
      <div className="hero">
        <div className="screen-title">PAIRING</div>
        <div className="screen-sub">Pair with other players after selecting match details</div>
      </div>

      {!match ? (
        <div className="section">
          <div className="section-label">Ready to pair?</div>
          <div className="section-note">
            Select your match mode, kill type, and entry fee from Home first. Your request will then appear here.
          </div>
          <div className="btn-cta-wrap">
            <button className="btn-primary" type="button" onClick={() => onScreenChange('home')}>
              Go to Home
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="section">
            <div className="section-label">Your Pairing Request</div>
            <div className="match-summary">
              <div className="summary-row"><span>Mode</span><strong>{match.mode}</strong></div>
              <div className="summary-row"><span>Type</span><strong>{match.type}</strong></div>
              <div className="summary-row"><span>Entry Fee</span><strong>₹{match.entryFee}</strong></div>
              <div className="summary-row"><span>Prize Pool</span><strong>₹{match.prizePool}</strong></div>
            </div>
            <div className="section-note">
              This screen is where you pair with opponents after placing your entry. Use filters to narrow down your matchups.
            </div>
          </div>

          <div className="section">
            <div className="section-label">Pairing Filters</div>
            <div className="filter-grid">
              {filterOptions.map((filter) => (
                <button
                  key={filter}
                  type="button"
                  className={`filter-pill ${selectedFilters.includes(filter) ? 'active' : ''}`}
                  onClick={() => toggleFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            <div className="section-note">
              Selected filters: {selectedFilters.length > 0 ? selectedFilters.join(', ') : 'None'}
            </div>
          </div>

          <div className="section">
            <div className="section-label">Available pairing requests</div>
            <div className="pair-list">
              <div className="pair-card">
                <div className="pair-header">Player: ShadowKing</div>
                <div className="pair-meta">TG: 95 · Region: AP · Platform: Mobile</div>
                <button className="btn-outline" type="button">Invite</button>
              </div>
              <div className="pair-card">
                <div className="pair-header">Player: Phoenix</div>
                <div className="pair-meta">TG: 88 · Region: EU · Platform: Mobile</div>
                <button className="btn-outline" type="button">Invite</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
