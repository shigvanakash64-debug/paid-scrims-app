import { useState } from 'react';

const rulesData = {
  global: {
    title: 'Global Rules',
    content: (
      <div className="rules-content">
        <ul>
          <li>No hacks / scripts</li>
          <li>No third-party interference</li>
          <li>Same map & settings agreed before match</li>
          <li>Net Problem → no refund</li>
          <li>Always record your gameplay</li>
          <li>Payment disputes → admin review</li>
          <li>Result disputes → admin review</li>
        </ul>
      </div>
    )
  },
  normalHeadshot: {
    title: 'NORMAL HEADSHOT',
    content: (
      <div className="rules-content">
        <p>🧠RULES</p>
        <h4>❌ Invalid Things</h4>
        <ul>
          <li>Grenade / launcher</li>
          <li>Zone kill</li>
          <li>Gloo wall packing</li>
        </ul>
        <h4>🔫 ONLY Allowed Guns</h4>
        <ul>
          <li>Shotguns (M1887, M1014, SPAS-12)</li>
          <li>Pistols (Desert Eagle)</li>
          <li>AR (WOODPECKER, AC80)</li>
        </ul>
        <p>SPRAY ALLOWED.</p>
      </div>
    )
  },
  bodyshot: {
    title: 'BODYSHOT (Standard)',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Any kill is valid</p>
        <h4>✅ Allowed</h4>
        <ul>
          <li>All weapons</li>
        </ul>
        <h4>❌ Only Ban</h4>
        <ul>
          <li>Hacks / cheating</li>
          <li>Gloo breaking</li>
        </ul>
        <h4>❌ Invalid Guns</h4>
        <ul>
          <li>Grenade / launcher</li>
          <li>M79</li>
          <li>Gattling gun</li>
          <li>Double Vector</li>
        </ul>
      </div>
    )
  },
  oneTap: {
    title: 'ONLY ONE TAP (Special)',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 One bullet = one kill</p>
        <h4>❌ Invalid Things</h4>
        <ul>
          <li>Multiple shots fired</li>
          <li>Spray damage</li>
        </ul>
        <h4>🔫 ONLY Allowed Guns</h4>
        <ul>
          <li>Shotguns (M1887, M1014, SPAS-12)</li>
          <li>Pistols (Desert Eagle)</li>
          <li>AR (WOODPECKER, AC80)</li>
        </ul>
        <h4>🚫 Banned</h4>
        <ul>
          <li>SMGs</li>
          <li>Shotgun spam</li>
          <li>AR spray</li>
          <li>Grenade / launcher</li>
          <li>Zone kill</li>
          <li>Gloo wall packing</li>
          <li>Gloo breaking</li>
        </ul>
        <p>👉 Pure aim skill mode</p>
      </div>
    )
  },
  smgHeadshot: {
    title: 'ONLY SMG HEADSHOT',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Only SMG + headshot</p>
        <h4>🔫 Allowed</h4>
        <ul>
          <li>All SMG guns allowed, only Double Vector is not allowed</li>
        </ul>
        <h4>❌ Invalid</h4>
        <ul>
          <li>No AR guns</li>
          <li>No sniper</li>
          <li>Grenade / launcher</li>
          <li>Zone kill</li>
          <li>Gloo wall packing</li>
          <li>Gloo breaking</li>
        </ul>
      </div>
    )
  },
  arHeadshot: {
    title: 'ONLY AR HEADSHOT (Special)',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Only AR + headshot</p>
        <h4>🔫 Allowed</h4>
        <ul>
          <li>All AR guns allowed</li>
        </ul>
        <h4>❌ Invalid</h4>
        <ul>
          <li>SMG / shotgun kills</li>
          <li>Grenade / launcher</li>
          <li>Zone kill</li>
          <li>Gloo wall packing</li>
          <li>Gloo breaking</li>
        </ul>
      </div>
    )
  },
  awmBodyshot: {
    title: 'ONLY AWM BODYSHOT (Special)',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Only AWM bodyshot kills</p>
        <h4>🔫 Allowed</h4>
        <ul>
          <li>AWM only</li>
          <li>Only close combat</li>
        </ul>
        <h4>❌ Invalid</h4>
        <ul>
          <li>Headshot allowed</li>
          <li>Any other gun</li>
          <li>No hiding</li>
        </ul>
        <p>👉 Clean sniper mode.</p>
      </div>
    )
  },
  onlyGrenade: {
    title: 'ONLY GRENADE',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Only grenade kills allowed</p>
        <h4>🔫 Allowed</h4>
        <ul>
          <li>All types of grenades allowed</li>
        </ul>
        <h4>❌ Invalid</h4>
        <ul>
          <li>Any gun kills</li>
          <li>Zone kill</li>
          <li>Gloo wall packing</li>
          <li>Gloo breaking</li>
        </ul>
      </div>
    )
  },
  rankClashSquad: {
    title: 'RANK CLASH SQUAD',
    content: (
      <div className="rules-content">
        <p>🧠 Rule</p>
        <p>👉 Everything is same as Rank CS</p>
        <ul>
          <li>Limited gloo</li>
          <li>Limited ammo</li>
          <li>Limited money</li>
          <li>Limited grenade</li>
          <li>Grenade allowed</li>
        </ul>
        <h4>🔫 Allowed</h4>
        <ul>
          <li>All guns are allowed</li>
        </ul>
        <h4>❌ Banned Guns</h4>
        <ul>
          <li>Double Vector</li>
          <li>M79</li>
          <li>Gattling gun</li>
        </ul>
      </div>
    )
  },
  skillSettings: {
    title: 'SKILL SETTINGS',
    content: (
      <div className="rules-content">
        <p>🔥 Skill ON</p>
        <p>👉 All Abilities allowed</p>
        <ul>
          <li>All Active skills</li>
          <li>All Character powers</li>
        </ul>
        <p>❄️ Skill OFF</p>
        <p>👉 No abilities at all</p>
        <ul>
          <li>No Character skills</li>
          <li>No Passive boosts</li>
        </ul>
        <p>👉 Pure skill gameplay</p>
      </div>
    )
  }
};

export const RulesModal = () => {
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('global');

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
                className={`rules-tab ${activeTab === 'global' ? 'active' : ''}`}
                onClick={() => setActiveTab('global')}
              >
                Global
              </button>
              <button
                className={`rules-tab ${activeTab === 'normalHeadshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('normalHeadshot')}
              >
                Normal Headshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'bodyshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('bodyshot')}
              >
                Bodyshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'oneTap' ? 'active' : ''}`}
                onClick={() => setActiveTab('oneTap')}
              >
                One Tap
              </button>
              <button
                className={`rules-tab ${activeTab === 'smgHeadshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('smgHeadshot')}
              >
                SMG Headshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'arHeadshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('arHeadshot')}
              >
                AR Headshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'awmBodyshot' ? 'active' : ''}`}
                onClick={() => setActiveTab('awmBodyshot')}
              >
                AWM Bodyshot
              </button>
              <button
                className={`rules-tab ${activeTab === 'onlyGrenade' ? 'active' : ''}`}
                onClick={() => setActiveTab('onlyGrenade')}
              >
                Grenade
              </button>
              <button
                className={`rules-tab ${activeTab === 'rankClashSquad' ? 'active' : ''}`}
                onClick={() => setActiveTab('rankClashSquad')}
              >
                Rank Clash
              </button>
              <button
                className={`rules-tab ${activeTab === 'skillSettings' ? 'active' : ''}`}
                onClick={() => setActiveTab('skillSettings')}
              >
                Skill
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
