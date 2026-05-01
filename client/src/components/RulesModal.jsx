import { useState } from 'react';

const rulesData = {
  headshot: {
    title: 'Headshot Rules',
    content: (
      <div className="rules-content">
        <h4>Allowed Weapons:</h4>
        <ul>
          <li>AK Rifle</li>
          <li>M14</li>
          <li>SKS</li>
          <li>FAMAS</li>
          <li>M16A2</li>
          <li>M4A1</li>
          <li>GROZA</li>
        </ul>
        
        <h4>Banned Weapons:</h4>
        <ul>
          <li>Sniper Rifles (AWM, SVD, etc.)</li>
          <li>Shotguns (SPAS12, KS-23M, etc.)</li>
          <li>SMGs used for body damage</li>
          <li>Grenades & Explosives</li>
          <li>Gloo Walls (defensive items)</li>
        </ul>
        
        <h4>Special Rules:</h4>
        <ul>
          <li>Only headshot kills count</li>
          <li>Body shots are NOT counted</li>
          <li>Players can use primary skill on target</li>
          <li>Crosshair customization is allowed</li>
        </ul>
      </div>
    )
  },
  bodyshot: {
    title: 'Bodyshot Rules',
    content: (
      <div className="rules-content">
        <h4>Allowed Weapons:</h4>
        <ul>
          <li>AWM Sniper</li>
          <li>VSS Sniper</li>
          <li>SK Sniper</li>
          <li>M14</li>
          <li>Marksman Rifles</li>
        </ul>
        
        <h4>Banned Weapons:</h4>
        <ul>
          <li>Assault Rifles (for body damage)</li>
          <li>SMGs</li>
          <li>Shotguns</li>
          <li>Grenades & Explosives</li>
          <li>Gloo Walls (defensive items)</li>
        </ul>
        
        <h4>Special Rules:</h4>
        <ul>
          <li>Any bodyshot kill counts</li>
          <li>Headshots are allowed and count</li>
          <li>Quickscoping is permitted</li>
          <li>Players can use defense items</li>
        </ul>
      </div>
    )
  }
};

export const RulesModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('headshot');

  return (
    <>
      <button 
        className="rules-btn"
        onClick={() => setShowModal(true)}
        title="View Game Rules"
      >
        ⚙️ Rules
      </button>

      {showModal && (
        <div className="rules-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="rules-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rules-modal-header">
              <h2>Paid Scrim Rules</h2>
              <button
                className="rules-modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="rules-tabs">
              <button
                className={`rules-tab ${activeTab === 'headshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('headshot')}
              >
                Headshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'bodyshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('bodyshot')}
              >
                Bodyshot
              </button>
            </div>

            <div className="rules-modal-content">
              {rulesData[activeTab].content}
            </div>

            <button
              className="rules-modal-btn"
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};
