import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import BRMatchSection from '../components/BRMatchSection';
import TournamentCard from '../components/TournamentCard';
import { useMatch } from '../contexts/MatchContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useUser } from '../contexts/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';
const modeOptions = ['All', '1v1', '2v2', '3v3', '4v4'];
const typeOptions = [
  'All',
  'Headshot',
  'Normal Headshot',
  'Bodyshot',
  'Only One Tap',
  'Only Punch',
  'Only Desert',
  'Only Melee Weapon',
  'Only Knife Throw',
  'Only SMG Headshot',
  'Only AR Headshot',
  'Only AWM Bodyshot',
  'Only Grenade',
  'Rank Clash Squad',
];
const entryOptions = [0, 5, 10, 20, 30, 50, 100, 200, 500, 1000];
const CS_TOURNAMENT_FORMATS = new Set(['cs-every-win', 'cs-custom']);

const getTrustClass = (score) => {
  if (score >= 80) return 'green';
  if (score >= 40) return 'yellow';
  return 'red';
};

export const PairingScreen = ({ match, user, onScreenChange, onMatchSelect }) => {
  const { currentMatch, clearMatch, refreshMatch } = useMatch();
  const { user: currentUser } = useUser();
  const { showNotification } = useNotifications();
  const [game, setGame] = useState(match?.game || 'All');
  const [mode, setMode] = useState(match?.mode || 'All');
  const [type, setType] = useState(match?.type || 'All');
  const [entry, setEntry] = useState(match?.entryFee || 0);
  const [matches, setMatches] = useState([]);
  const [csTournaments, setCsTournaments] = useState([]);
  const [myMatches, setMyMatches] = useState([]);
  const [registeredTournaments, setRegisteredTournaments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [joiningMatch, setJoiningMatch] = useState(null);
  const [joinerGameName, setJoinerGameName] = useState('');
  const [activeTab, setActiveTab] = useState(() => sessionStorage.getItem('clutchzone_open_my_matches') === 'true' ? 'my-matches' : 'live-opponents');

  const renderTabContent = () => {
    if (activeTab === 'br-matches') {
      return <BRMatchSection user={user} onMatchSelect={onMatchSelect} />;
    }

    if (activeTab === 'my-matches') {
      const visibleMyMatches = [
        ...registeredTournaments.map((tournament) => ({ _listType: 'tournament', tournament })),
        ...myMatches.map((matchItem) => ({ _listType: 'match', matchItem })),
      ];

      return (
        <div className="section">
          <div className="section-label">Your Active Match</div>
          {visibleMyMatches.length > 0 ? (
            visibleMyMatches.map((item) => {
              if (item._listType === 'tournament') {
                return (
                  <TournamentCard
                    key={`my-tournament-${item.tournament._id}`}
                    tournament={item.tournament}
                    user={user}
                    onJoined={async () => {
                      try {
                        const response = await axios.get(`${API_BASE}/tournaments/public`, {
                          headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
                        });
                        const tournaments = (response.data.tournaments || []).filter((tournament) => tournament.isRegistered);
                        setRegisteredTournaments(tournaments);
                      } catch (error) {
                        console.error('Failed to refresh registered tournaments:', error);
                      }
                    }}
                  />
                );
              }

              const matchItem = item.matchItem;
              const matchId = matchItem.id || matchItem._id;
              const isCurrent = activeMatch && matchId === (activeMatch.id || activeMatch._id);
              const matchCreatorId = matchItem.creator?.id || matchItem.creator?._id || matchItem.creator;
              const isCreator = currentUser && matchCreatorId && (currentUser.id === matchCreatorId || currentUser._id === matchCreatorId);

              return (
                <div key={matchId} className={`match-card ${isCurrent ? 'pinned-match' : ''}`}>
                  <div className="match-card-header">
                    <div>
                      <div className="match-tag">{isCreator ? 'YOUR MATCH' : 'JOINED MATCH'}</div>
                      <div className="match-title">{matchItem.mode} · {matchItem.type} · CZ{matchItem.entryFee || matchItem.entry || 0}</div>
                    </div>
                    <div className={`trust-pill ${getTrustClass(currentUser?.trustScore || 0)}`}>
                      TG{currentUser?.trustScore ?? 0}
                    </div>
                  </div>
                  {matchItem.skillSetting && (
                    <div className="match-meta-row" style={{ marginTop: 8 }}>
                      <span>Skill: {matchItem.skillSetting}</span>
                    </div>
                  )}
                  <div className="match-meta-row">
                    <span>{matchItem.status}</span>
                    <span>Prize Pool CZ{matchItem.prizePool || 0}</span>
                  </div>
                  {matchItem.players?.some((player) => player.inGameName) && (
                    <div className="mt-2 text-sm text-[#A1A1A1]">
                      {matchItem.players.filter((player) => player.inGameName).map((player) => (
                        <div key={player.id}>In-game name: <span className="text-white">{player.inGameName}</span></div>
                      ))}
                    </div>
                  )}
                  <div className="match-actions">
                    <button className="btn-outline" type="button" onClick={() => {
                      onMatchSelect?.(matchItem);
                      onScreenChange('pairing');
                    }}>
                      View Match
                    </button>
                    {isCreator && (
                      <button className="btn-outline" type="button" onClick={handleCancelMatch} disabled={!canCancelMatch}>
                        {canCancelMatch ? 'Cancel Match' : 'Cancel Locked'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <div className="empty-title">No active match yet</div>
              <div className="empty-copy">Create a match from the home tab to get started.</div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="section">
        <div className="section-announce">
          {error || `CS matches · ${liveMatches.length} available`}
        </div>
        {liveMatches.length === 0 && csTournaments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-title">No CS matches</div>
            <div className="empty-copy">Try another filter or create a match.</div>
          </div>
        ) : (
          <div className="live-match-list">
            {csTournaments.map((tournament) => (
              <TournamentCard
                key={`cs-tournament-${tournament._id}`}
                tournament={tournament}
                user={user}
                onJoined={fetchPublicTournaments}
              />
            ))}
            {liveMatches.map((item) => (
              (() => {
                const matchId = item.id || item._id;
                const creatorId = item.creator?.id || item.creator?._id || item.creator;
                const currentUserId = currentUser?.id || currentUser?._id;
                const isOwnMatch = creatorId && currentUserId && String(creatorId) === String(currentUserId);

                return (
                  <div key={matchId} className="match-card">
                    <div className="match-card-header">
                      <div>
                        <div className="match-tag">{item.game || 'Free Fire'}</div>
                        <div className="match-title">{item.mode} · {item.type}</div>
                      </div>
                      <div className={`trust-pill ${getTrustClass(item.trustScore ?? 90)}`}>{item.trustScore ?? 90}</div>
                    </div>
                    <div className="match-meta-row">
                      <span>Entry CZ{item.entryFee || item.entry || 0}</span>
                      <span>Prize CZ{item.prizePool || 0}</span>
                    </div>
                    <div className="match-meta-row">
                      <span>{item.skillSetting || 'Skill Off'}</span>
                      <span>{item.status || 'Waiting for opponent'}</span>
                    </div>
                    <div className="match-actions">
                      {isOwnMatch ? (
                        <button className="btn-outline" type="button" onClick={() => handleCancelListing(item)}>
                          Cancel Match
                        </button>
                      ) : (
                        <button className="btn-outline" type="button" onClick={() => {
                          setJoiningMatch(item);
                          setJoinerGameName(currentUser?.username || '');
                        }}>
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                );
              })()
            ))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const params = new URLSearchParams();
        if (game !== 'All') params.append('game', game);
        if (mode !== 'All') params.append('mode', mode);
        if (type !== 'All') params.append('type', type);
        if (entry !== 0) params.append('entry', String(entry));

        const url = `${API_BASE}/match/list${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await axios.get(url);
        setMatches(response.data.matches || []);
      } catch (err) {
        setError('Live marketplace is temporarily unavailable.');
        setMatches([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [game, mode, type, entry]);

  const fetchPublicTournaments = async () => {
    try {
      const response = await axios.get(`${API_BASE}/tournaments/public`, {
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      setCsTournaments((response.data.tournaments || []).filter((tournament) => CS_TOURNAMENT_FORMATS.has(tournament.format)));
    } catch (error) {
      console.error('Failed to load CS tournaments:', error);
      setCsTournaments([]);
    }
  };

  useEffect(() => {
    fetchPublicTournaments();
  }, [currentUser?.id, currentUser?._id]);

  useEffect(() => {
    const matchId = currentMatch?.id || currentMatch?._id;
    if (matchId) refreshMatch(matchId);
  }, [currentMatch?.id, currentMatch?._id, refreshMatch]);

  useEffect(() => {
    const fetchMyMatches = async () => {
      if (!currentUser) {
        setMyMatches([]);
        setRegisteredTournaments([]);
        return;
      }

      try {
        const [matchResponse, tournamentResponse] = await Promise.all([
          axios.get(`${API_BASE}/match/my-matches`, {
            headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
          }),
          axios.get(`${API_BASE}/tournaments/public`, {
            headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
          }),
        ]);

        setMyMatches(matchResponse.data.matches || []);
        const tournaments = (tournamentResponse.data.tournaments || []).filter((tournament) => tournament.isRegistered);
        setRegisteredTournaments(tournaments);
      } catch (err) {
        console.error('Failed to load user matches:', err);
        setMyMatches([]);
        setRegisteredTournaments([]);
      }
    };

    fetchMyMatches();
  }, [currentUser?.id, currentUser?._id]);

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

  const handleJoin = async () => {
    if (!currentUser) {
      alert('Please login to join a match.');
      return;
    }

    if (!joinerGameName.trim()) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.post(
        `${API_BASE}/match/accept`,
        { matchId: joiningMatch.id || joiningMatch._id, inGameName: joinerGameName.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showNotification({
        id: `join-${Date.now()}`,
        type: 'match',
        title: '🎮 Match Joined',
        message: `${currentUser?.username || 'A player'} has joined your match. Complete your payment to continue.`,
        duration: 5000,
      });
      onMatchSelect?.(response.data.match);
      setJoiningMatch(null);
      onScreenChange('pairing');
    } catch (error) {
      alert(error.response?.data?.error || 'Could not accept match');
    }
  };

  const handleCancelListing = async (matchItem) => {
    const matchId = matchItem.id || matchItem._id;
    if (!window.confirm('Cancel your waiting match request?')) return;

    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await axios.post(
        `${API_BASE}/match/cancel`,
        { matchId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMatches((currentMatches) => currentMatches.filter((item) => String(item.id || item._id) !== String(matchId)));
      if (String(currentMatch?.id || currentMatch?._id) === String(matchId)) clearMatch();
      showNotification({
        id: `cancel-${Date.now()}`,
        type: 'match',
        title: 'Match cancelled',
        message: 'Your waiting match request has been removed.',
        duration: 4000,
      });
    } catch (error) {
      alert(error.response?.data?.error || 'Could not cancel match');
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
  const hasBothPaid = (activeMatch?.paidUsers?.length || 0) >= (activeMatch?.players?.length || 0);
  const hasPaidUsers = (activeMatch?.paidUsers?.length || 0) > 0;
  const canCancelMatch = Boolean(activeMatch) && isMatchCreator && (activeMatch?.players?.length || 0) === 1 && hasPaidUsers && !['ongoing', 'completed', 'cancelled'].includes(String(activeMatch?.status || '').toLowerCase());
  const isLiveMatch = (status) => {
    const value = String(status || '').toLowerCase();
    return !['ongoing', 'completed', 'cancelled'].includes(value);
  };

  const liveMatches = useMemo(() => {
    const current = matches.filter((item) => {
      return isLiveMatch(item.status);
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
          <span className="filter-label">Game</span>
          <select className="pairing-select" value={game} onChange={(e) => setGame(e.target.value)}>
            {['All', 'Free Fire', 'BGMI'].map((option) => (
              <option key={option} value={option}>
                {option === 'All' ? 'All' : option}
              </option>
            ))}
          </select>
        </div>
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
                {option === 0 ? 'All' : `CZ${option}`}
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
          CS Match
        </button>
        <button
          className={`pairing-tab ${activeTab === 'br-matches' ? 'active' : ''}`}
          onClick={() => setActiveTab('br-matches')}
        >
          BR Match
        </button>
      </div>

      {renderTabContent()}
      {joiningMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="presentation">
          <form
            className="w-full max-w-md space-y-4 rounded-xl border border-[#2A2A2A] bg-[#111111] p-5 text-white"
            onSubmit={(event) => {
              event.preventDefault();
              handleJoin();
            }}
          >
            <div>
              <h2 className="text-lg font-semibold">Join match</h2>
              <p className="mt-1 text-sm text-[#A1A1A1]">Enter the in-game name other players should see.</p>
            </div>
            <label className="block text-sm text-[#D4D4D4]" htmlFor="joiner-game-name">
              In-game name
              <input
                id="joiner-game-name"
                className="mt-2 w-full rounded-lg border border-[#333333] bg-[#0B0B0B] px-3 py-2 text-white"
                value={joinerGameName}
                onChange={(event) => setJoinerGameName(event.target.value.slice(0, 50))}
                maxLength={50}
                autoFocus
                required
              />
            </label>
            <div className="flex justify-end gap-2">
              <button className="btn-outline" type="button" onClick={() => setJoiningMatch(null)}>Cancel</button>
              <button className="btn-primary" type="submit" disabled={!joinerGameName.trim()}>Join match</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

