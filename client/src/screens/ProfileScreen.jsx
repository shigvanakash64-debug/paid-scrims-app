import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import { Copy, Pencil, Save } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const ProfileScreen = ({ user, onUserUpdate, onProfileSave, onNavigate }) => {
  const { user: currentUser } = useUser();
  const [uid, setUid] = useState(currentUser?.ffUid || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [rank, setRank] = useState(null);
  const [hostTournaments, setHostTournaments] = useState([]);
  const [hostTournamentsLoading, setHostTournamentsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [referralData, setReferralData] = useState(null);
  const isHost = (currentUser || user)?.role === 'host';
  const currentUserId = currentUser?.id;
  const currentUserRole = currentUser?.role;

  useEffect(() => {
    setUid(currentUser?.ffUid || '');
    setBio(currentUser?.bio || '');
  }, [currentUser?.ffUid, currentUser?.bio]);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!currentUserId) return;
      const token = localStorage.getItem('clutchzone_token');
      try {
        if (currentUserRole === 'host') {
          setHostTournamentsLoading(true);
          const [referralResponse, tournamentsResponse] = await Promise.all([
            axios.get(`${API_BASE}/rewards/me`, { headers: { Authorization: `Bearer ${token}` } }),
            axios.get(`${API_BASE}/tournaments`, { headers: { Authorization: `Bearer ${token}` } }),
          ]);
          setReferralData(referralResponse.data);
          setHostTournaments(tournamentsResponse.data.tournaments || []);
          return;
        }

        const [referralResponse, leaderboardResponse] = await Promise.all([
          axios.get(`${API_BASE}/rewards/me`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_BASE}/leaderboard`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);
        setReferralData(referralResponse.data);
        const rankedPlayer = (leaderboardResponse.data.players || []).find((player) => String(player._id || player.id) === String(currentUserId));
        setRank(rankedPlayer?.rank || null);
      } catch (err) {
        console.error('Failed to load profile data', err);
      } finally {
        setHostTournamentsLoading(false);
      }
    };

    fetchProfileData();
  }, [currentUserId, currentUserRole]);

  if (!currentUser) {
    return (
      <div id="screen-profile" className="screen-profile">
        <div className="hero">
          <div className="screen-title">PROFILE</div>
          <div className="screen-sub">Loading profile...</div>
        </div>
      </div>
    );
  }

  const matchesPlayed = Number(currentUser.matchesPlayed || 0);
  const matchesWon = Number(currentUser.matchesWon || 0);
  const winRate = matchesPlayed ? ((matchesWon / matchesPlayed) * 100).toFixed(1) : '0.0';
  const totalEarnings = (currentUser.wallet?.transactions || [])
    .filter((transaction) => transaction.type === 'match_win')
    .reduce((total, transaction) => total + Math.max(Number(transaction.amount) || 0, 0), 0);
  const hostEarnings = (currentUser.wallet?.transactions || [])
    .filter((transaction) => transaction.type === 'admin_adjustment' && String(transaction.description || '').startsWith('Host share:'))
    .reduce((total, transaction) => total + Math.max(Number(transaction.amount) || 0, 0), 0);
  const activeHostedTournaments = hostTournaments.filter((tournament) => !['completed', 'cancelled'].includes(tournament.status));
  const hostedTeams = hostTournaments.reduce((total, tournament) => total + Number(tournament.successfulEntries || 0), 0);
  const recentHostedTournaments = hostTournaments.slice(0, 3);

  const getDisplayReferralCode = () => {
    const fromApi = referralData?.referralCode || currentUser?.wallet?.referralCode;
    if (fromApi) return fromApi;
    const username = String(currentUser?.username || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
    return username ? `${username}CZ` : '';
  };

  const copyReferralCode = async () => {
    const code = getDisplayReferralCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Referral code copied');
    } catch (err) {
      setError('Unable to copy referral code');
    }
  };

  const handleSaveUid = async () => {
    setError('');
    setMessage('');

    const trimmedUid = uid.trim();
    if (!trimmedUid) {
      setError('Please enter your Free Fire UID');
      return;
    }
    if (!/^[0-9]{10}$/.test(trimmedUid)) {
      setError('UID must be exactly 10 digits');
      return;
    }

    if (!onProfileSave) {
      onUserUpdate?.({ ...currentUser, ffUid: uid.trim() });
      setMessage('UID saved locally');
      return;
    }

    try {
      await onProfileSave({ ffUid: uid.trim() });
      setMessage('UID saved successfully');
    } catch (err) {
      setError('Unable to save UID');
    }
  };

  const handleSaveBio = async () => {
    setError('');
    setMessage('');
    try {
      await onProfileSave?.({ bio: bio.slice(0, 150) });
      setIsEditingBio(false);
      setMessage('Bio saved successfully');
    } catch (err) {
      setError('Unable to save bio');
    }
  };

  return (
    <div id="screen-profile" className="screen-profile">
      <div className="hero">
        <div className="screen-title">PROFILE</div>
        <div className="screen-sub">{isHost ? 'Your host account and tournaments' : 'Your competitive record'}</div>
      </div>
      <section className="profile-card">
        <div className="profile-name">{currentUser.username}</div>
        <div className="profile-title">[ {isHost ? 'HOST' : currentUser.title || 'NO TITLE'} ]</div>
        <div className="profile-bio-row">
          <span className="profile-bio">{currentUser.bio || 'Add a bio...'}</span>
          <button className="profile-icon-button" type="button" onClick={() => setIsEditingBio(true)} aria-label="Edit bio"><Pencil size={14} /></button>
        </div>
        {isEditingBio && <div className="bio-editor"><textarea value={bio} maxLength={150} onChange={(event) => setBio(event.target.value)} autoFocus /><div className="bio-editor-footer"><span>{bio.length}/150</span><button className="compact-action" type="button" onClick={handleSaveBio}><Save size={13} /> SAVE</button></div></div>}
        {isHost ? (
          <div className="profile-details"><span>HOST ACCOUNT</span><span>Role: HOST</span></div>
        ) : (
          <>
            <div className="profile-details"><span>UID: {currentUser.ffUid || 'Not added'}</span><span>Role: {currentUser.role || 'user'}</span></div>
            <div className="profile-rating"><span><b>#{rank || '--'}</b> RANK</span><span><b>TG {currentUser.trustScore || 0}</b> / 100</span></div>
          </>
        )}
      </section>
      {isHost ? (
        <>
          <section className="profile-section">
            <div className="profile-section-heading">HOST OVERVIEW</div>
            <div className="profile-stats">
              <div><b>{hostTournaments.length}</b><span>TOURNAMENTS</span></div>
              <div><b>{activeHostedTournaments.length}</b><span>ACTIVE</span></div>
              <div><b>{hostedTeams}</b><span>REGISTERED TEAMS</span></div>
              <div><b>₹{hostEarnings.toLocaleString('en-IN')}</b><span>HOST EARNINGS</span></div>
            </div>
          </section>
          <section className="profile-section">
            <div className="profile-section-heading">YOUR TOURNAMENTS</div>
            {hostTournamentsLoading ? (
              <p className="text-sm text-[#A1A1A1]">Loading hosted tournaments...</p>
            ) : recentHostedTournaments.length ? (
              <div className="space-y-2">
                {recentHostedTournaments.map((tournament) => (
                  <div key={tournament._id} className="flex items-center justify-between gap-3 border border-[#1F1F1F] bg-[#0D0D0D] px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{tournament.name}</p>
                      <p className="text-xs text-[#A1A1A1]">{tournament.game} · {tournament.successfulEntries || 0}/{tournament.maxTeams} teams</p>
                    </div>
                    <span className="shrink-0 text-xs uppercase text-[#FFB066]">{tournament.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-[#A1A1A1]">You have not created a tournament yet.</p>
            )}
            {onNavigate && <button type="button" className="compact-action mt-3" onClick={() => onNavigate('host')}>OPEN HOST DASHBOARD</button>}
          </section>
        </>
      ) : (
        <>
          <section className="profile-section">
            <div className="profile-section-heading">PLAYER STATS</div>
            <div className="profile-stats"><div><b>{matchesPlayed}</b><span>MATCHES</span></div><div><b>{matchesWon}</b><span>WINS</span></div><div><b>{winRate}%</b><span>WIN RATE</span></div><div><b>₹{totalEarnings.toLocaleString('en-IN')}</b><span>EARNINGS</span></div></div>
          </section>
          <div className="profile-streak">CURRENT STREAK: 0</div>
        </>
      )}
      <section className="profile-section profile-account">
        <div className="profile-section-heading">ACCOUNT</div>
        {!isHost && <div className="account-row"><label>Free Fire UID<input type="text" value={uid} onChange={(event) => setUid(event.target.value)} placeholder="10 digits" /></label><button className="compact-action" type="button" onClick={handleSaveUid}><Save size={13} /> SAVE</button></div>}
        <div className="account-row"><span>Referral Code <b>{getDisplayReferralCode() || 'Generating...'}</b></span><button className="compact-action" type="button" onClick={copyReferralCode} disabled={!getDisplayReferralCode()}><Copy size={13} /> COPY</button></div>
      </section>
      <div className="profile-feedback">
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
      </div>
    </div>
  );
};
