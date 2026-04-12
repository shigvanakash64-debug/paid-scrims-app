import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useMatch } from '../contexts/MatchContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
const TOKEN_KEY = 'clutchzone_token';
const modeOptions = ['All', '1v1', '2v2', '3v3', '4v4'];
const typeOptions = ['All', 'Headshot', 'Bodyshot'];
const entryOptions = [0, 30, 50, 100, 200, 500, 1000];

const sampleMatches = [
  {
    id: 'match-001',
    mode: '1v1',
    type: 'Headshot',
    entryFee: 50,
    prizePool: 80,
    creator: 'Akash_77',
    trustScore: 82,
    status: 'Waiting for opponent',
  },
  {
    id: 'match-002',
    mode: '1v1',
    type: 'Bodyshot',
    entryFee: 100,
    prizePool: 160,
    creator: 'Riya_09',
    trustScore: 74,
    status: 'Waiting for opponent',
  },
  {
    id: 'match-003',
    mode: '2v2',
    type: 'Headshot',
    entryFee: 200,
    prizePool: 340,
    creator: 'ShadowKing',
    trustScore: 88,
    status: 'Waiting for opponents',
  },
  {
    id: 'match-004',
    mode: '1v1',
    type: 'Headshot',
    entryFee: 30,
    prizePool: 50,
    creator: 'Nova_X',
    trustScore: 65,
    status: 'Waiting for opponent',
  },
  {
    id: 'match-005',
    mode: '3v3',
    type: 'Bodyshot',
    entryFee: 500,
    prizePool: 850,
    creator: 'AlphaRider',
    trustScore: 91,
    status: 'Waiting for teammates',
  },
];

const getTrustClass = (score) => {
  if (score >= 80) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
};

export const PairingScreen = ({ match, user, onScreenChange, onMatchSelect }) => {
  const { currentMatch, clearMatch } = useMatch();
  const { user: currentUser } = useUser();
  const [mode, setMode] = useState(match?.mode || 'All');
  const [type, setType] = useState(match?.type || 'All');
  const [entry, setEntry] = useState(match?.entryFee || 0);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('live-opponents');

  const filteredSamples = useMemo(
    () => sampleMatches.filter(
      (item) =>
        (mode === 'All' || item.mode === mode) &&
        (type === 'All' || item.type === type) &&
        (entry === 0 || item.entryFee === entry)
    ),
    [mode, type, entry]
  );

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (mode !== 'All') params.append('mode', mode);
        if (type !== 'All') params.append('type', type);
        if (entry !== 0) params.append('entry', String(entry));

        const url = `${API_BASE}/match/list${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await axios.get(url);
        setMatches(response.data.matches || []);
      } catch (err) {
        setError('Live marketplace offline. Showing active lobby.');
        setMatches(filteredSamples);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [mode, type, entry, filteredSamples]);

  const handleCancelMatch = async () => {
    if (!activeMatch?.id) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE}/match/cancel`,
        { matchId: activeMatch.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      clearMatch();
      onScreenChange('home');
    } catch (err) {
      alert(err.response?.data?.error || 'Could not cancel match');
    }
  };

  const handleJoin = async (matchItem) => {
    if (!currentUser) {
      alert('Please login to join a match.');
      return;
    }

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/accept`,
        { matchId: matchItem.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onMatchSelect?.(response.data.match);
      onScreenChange('match');
    } catch (error) {
      alert(error.response?.data?.error || 'Could not accept match');
    }
  };

  const activeMatch = currentMatch
    ? {
        ...currentMatch,
        id: currentMatch.id || currentMatch._id || 'my-match',
        entryFee: currentMatch.entryFee || currentMatch.entry || 0,
        creator: currentMatch.creator || { username: 'Unknown' },
      }
    : null;

  const activeMatchCreatorId = activeMatch?.creator?.id || activeMatch?.creator?._id || activeMatch?.creator;
  const isMatchCreator = currentUser && activeMatchCreatorId && (currentUser.id === activeMatchCreatorId || currentUser._id === activeMatchCreatorId);
  const showOpponentJoinedDot = isMatchCreator && activeMatch?.players?.length > 1;
  const isLiveMatch = (status) => {
    const value = String(status || '').toLowerCase();
    return !['ongoing', 'completed', 'cancelled'].includes(value);
  };

  const liveMatches = useMemo(() => {
    const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
    const current = matches.filter((item) => {
      const createdAt = new Date(item.createdAt).getTime();
      return createdAt > twoHoursAgo;
    });
    if (activeMatch && isLiveMatch(activeMatch.status) && !current.some((item) => item.id === activeMatch.id)) {
      current.unshift(activeMatch);
    }
    return current;
  }, [matches, activeMatch]);

  return (
    <div id="screen-pairing" className="screen-pairing">
      <div className="hero">
        <div className="screen-title">Pairing Lobby</div>
        <div className="screen-sub">Live match marketplace — jump into competitive games instantly.</div>
      </div>

      <div className="pairing-topbar">
        <div className="pairing-filter">
          <span className="filter-label">Mode</span>
          <select className="pairing-select" value={mode} onChange={(e) => setMode(e.target.value)}>
            {modeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="pairing-filter">
          <span className="filter-label">Type</span>
          <select className="pairing-select" value={type} onChange={(e) => setType(e.target.value)}>
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
        <div className="pairing-filter">
          <span className="filter-label">Entry</span>
          <select className="pairing-select" value={entry} onChange={(e) => setEntry(Number(e.target.value))}>
            {entryOptions.map((option) => (
              <option key={option} value={option}>
                {option === 0 ? 'All' : `₹${option}`}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pairing-tabs">
        <button
          className={`pairing-tab ${activeTab === 'my-matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('my-matches')}
        >
          My Matches
        </button>
        <button
          className={`pairing-tab ${activeTab === 'live-opponents' ? 'active' : ''}`}
          onClick={() => setActiveTab('live-opponents')}
        >
          Live Opponents
        </button>
      </div>

      <div className="section" style={{ paddingBottom: 12 }}>
        <div className="section-announce">
          {error || `Live feed · ${liveMatches.length} matches available`}
        </div>
      </div>

      {activeTab === 'my-matches' ? (
        <div className="section">
          <div className="section-label">Your Active Match</div>
          {activeMatch ? (
            <div className="match-card pinned-match">
              <div className="match-card-header">
                <div>
                  <div className="match-tag">YOUR MATCH</div>
                  <div className="match-title">
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {showOpponentJoinedDot && (
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            background: '#ef4444',
                            display: 'inline-block',
                          }}
                        />
                      )}
                      {activeMatch.mode} · {activeMatch.type} · ₹{activeMatch.entryFee}
                    </span>
                  </div>
                </div>
                <div className={`trust-pill ${getTrustClass(currentUser?.trustScore || 0)}`}>
                  TG{currentUser?.trustScore ?? 0}
                </div>
              </div>
              <div className="match-meta-row">
                <span>{activeMatch.status}</span>
                <span>Prize Pool ₹{activeMatch.prizePool}</span>
              </div>
              <div className="match-actions">
                <button className="btn-outline" type="button" onClick={() => onScreenChange('match')}>
                  View Match
                </button>
                <button className="btn-outline" type="button" onClick={handleCancelMatch}>
                  Cancel Match
                </button>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>No active match</h3>
              <p>You don't have any active matches right now.</p>
              <button className="btn-primary" type="button" onClick={() => onScreenChange('home')}>
                Create Match
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="section">
            <div className="section-header">
              <span>LIVE MATCHES</span>
              <span>{liveMatches.length} results</span>
            </div>

            {loading ? (
              <div className="loading-state">Loading live matches…</div>
            ) : liveMatches.length === 0 ? (
              <div className="empty-state">
                <h3>No active matches found</h3>
                <p>Try changing your filters or create a new match from Home.</p>
                <button className="btn-primary" type="button" onClick={() => onScreenChange('home')}>
                  Create Match
                </button>
              </div>
            ) : (
              <div className="match-list">
                {liveMatches.map((item) => (
                  <div key={item.id} className="match-card">
                    <div className="match-card-header">
                      <div>
                        <div className="match-tag">{item.type}</div>
                        <div className="match-title">{item.mode} · Entry ₹{item.entryFee || item.entry}</div>
                      </div>
                      <div className={`trust-pill ${getTrustClass(item.trustScore)}`}>
                        {item.trustScore}
                      </div>
                    </div>
                    <div className="match-meta-row">
                      <span>Player: {item.creator?.username || item.creator || 'Unknown'}</span>
                      <span>Status: {item.status}</span>
                    </div>
                    <div className="match-card-footer">
                      <span className="match-detail">Prize ₹{item.prizePool}</span>
                      <button
                        className="join-btn"
                        type="button"
                        disabled={!user || item.id === activeMatch?.id}
                        onClick={() => handleJoin(item)}
                      >
                        {item.id === activeMatch?.id ? 'YOUR MATCH' : 'JOIN MATCH'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
