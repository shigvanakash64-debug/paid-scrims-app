import { useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { InfoIcon } from '../components/InfoIcon';
import { RulesModal } from '../components/RulesModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

const modeOptions = [
  { label: '1v1', sub: 'Solo' },
  { label: '2v2', sub: 'Duo' },
  { label: '3v3', sub: 'Trio' },
  { label: '4v4', sub: 'Squad' }
];

const typeOptions = [
  { 
    label: 'Normal Headshot', 
    sub: 'Precision',
    info: 'Both users can fire 2 or more bullets.'
  },
  { 
    label: 'Bodyshot', 
    sub: 'Standard',
    info: null
  },
  { 
    label: 'Only One Tap', 
    sub: 'Special',
    info: 'Both users can only fire 1 bullet.'
  },
  { 
    label: 'Only Punch', 
    sub: 'Special',
    info: 'Only punch kills are allowed.'
  },
  { 
    label: 'Only Desert', 
    sub: 'Special',
    info: 'Only Desert Eagle kills are allowed.'
  },
  { 
    label: 'Only Melee Weapon', 
    sub: 'Special',
    info: 'Only melee weapon kills are allowed.'
  },
  { 
    label: 'Only Knife Throw', 
    sub: 'Special',
    info: 'Only knife throw kills are allowed.'
  },
  { 
    label: 'Only SMG Headshot', 
    sub: 'Special',
    info: 'Both users can only use SMG guns here.'
  },
  { 
    label: 'Only AR Headshot', 
    sub: 'Special',
    info: 'Only AR headshot kills are allowed.'
  },
  { 
    label: 'Only AWM Bodyshot', 
    sub: 'Special',
    info: 'Only AWM bodyshot kills are allowed.'
  },
  {
    label: 'Only Grenade',
    sub: 'Special',
    info: 'Only grenade kills allowed and all types of grenade allowed.'
  },
  {
    label: 'Rank Clash Squad',
    sub: 'Special',
    info: 'Everything same as Rank CS: limited gloo, limited ammo, limited money, limited grenade, grenade allowed. All guns allowed except Double Vector, M79, Gattling gun.',
  }
];

const skillOptions = [
  { label: 'Skill On', sub: 'Enabled' },
  { label: 'Skill Off', sub: 'Disabled' }
];

const entryFees = [5, 10, 20, 30, 50, 100, 200, 500, 1000];

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

const getPrizePool = (entryFee) => {
  const prizePoolTable = {
    5: 7,
    10: 15,
    20: 35,
    30: 50,
    50: 80,
    100: 170,
    200: 360,
    500: 900,
    1000: 1800,
  };

  return prizePoolTable[entryFee] ?? Object.entries(prizePoolTable)
    .map(([fee, pool]) => [Number(fee), pool])
    .sort((a, b) => a[0] - b[0])
    .find(([fee]) => entryFee <= fee)?.[1] ?? 0;
};

export const HomeScreen = ({ user, onFindMatch, onScreenChange, currentMatch }) => {
  const { user: currentUser } = useUser();
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [selectedType, setSelectedType] = useState('Normal Headshot');
  const [selectedSkill, setSelectedSkill] = useState('Skill On');
  const [selectedFee, setSelectedFee] = useState(50);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  const playersCount = getPlayersCount(selectedMode);
  const platformFee = calculateCommission(selectedFee);
  const prizePool = getPrizePool(selectedFee);

  const handleFindMatch = async () => {
    if (isCreatingMatch) return;

    if (currentMatch && !['completed', 'cancelled', 'disputed'].includes(currentMatch.status)) {
      alert('You already have an active match. Complete it first before creating a new one.');
      return;
    }

    try {
      setIsCreatingMatch(true);
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/create`,
        {
          mode: selectedMode,
          type: selectedType,
          entry: selectedFee,
          skillSetting: selectedSkill,
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
    } finally {
      setIsCreatingMatch(false);
    }
  };

  const canJoin = true;

  return (
    <div id="screen-home" className="screen-home">
      <div className="hero">
        <div className="hero-top">
          <div>
            <div className="game-pill">
              <div className="game-dot"></div>
              <span>All Battle Royale</span>
            </div>
            <div className="screen-title">CLUTCH ZONE</div>
            <div className="screen-sub">Compete. Win. Get Paid.</div>
          </div>
          <RulesModal />
        </div>
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
            <div key={type.label} className="sel-btn-wrapper">
              <button
                type="button"
                className={`sel-btn ${selectedType === type.label ? 'active' : ''}`}
                onClick={() => setSelectedType(type.label)}
              >
                {type.label}
                <span className="sub">{type.sub}</span>
              </button>
              {type.info && <InfoIcon title={type.label} content={type.info} />}
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-label">Skill Settings</div>
        <div className="grid2">
          {skillOptions.map((skill) => (
            <button
              key={skill.label}
              type="button"
              className={`sel-btn ${selectedSkill === skill.label ? 'active' : ''}`}
              onClick={() => setSelectedSkill(skill.label)}
            >
              {skill.label}
              <span className="sub">{skill.sub}</span>
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
              CZ{fee}
            </button>
          ))}
        </div>
        <div className="fee-note">
          Choose any entry fee to preview the prize pool. Deposit money into your wallet first, then pay the entry fee directly from wallet when joining a match.
        </div>
      </div>

      <div className="info-strip">
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">CZ</span>
            <span>{prizePool}</span>
          </div>
          <div className="info-key">Prize Pool</div>
        </div>
        <div className="info-cell">
          <div className="info-val">
            <span className="accent">TG</span>
            <span>{currentUser?.trustScore ?? 0}</span>
          </div>
          <div className="info-key">Trust Score</div>
        </div>
      </div>

      <div className="btn-cta-wrap">
        <button className="btn-primary" type="button" onClick={handleFindMatch} disabled={isCreatingMatch}>
          {isCreatingMatch ? 'CREATING...' : 'CREATE MATCH'}
        </button>
      </div>
    </div>
  );
};

