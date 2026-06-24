import { useEffect, useState } from 'react';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const ProfileScreen = ({ user, onUserUpdate, onProfileSave }) => {
  const { user: currentUser } = useUser();
  const [uid, setUid] = useState(currentUser?.ffUid || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [referralData, setReferralData] = useState(null);

  useEffect(() => {
    setUid(currentUser?.ffUid || '');
  }, [currentUser?.ffUid]);

  useEffect(() => {
    const fetchReferralData = async () => {
      if (!currentUser) return;
      try {
        const token = localStorage.getItem('clutchzone_token');
        const response = await axios.get(`${API_BASE}/rewards/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReferralData(response.data);
      } catch (err) {
        console.error('Failed to load referral data', err);
      }
    };

    fetchReferralData();
  }, [currentUser]);

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

  const getInitials = (username) => {
    const parts = username.split(/[^A-Za-z0-9]+/).filter(Boolean);
    const initials = parts.map((part) => part[0].toUpperCase()).slice(0, 2).join('');
    return initials || username.slice(0, 2).toUpperCase();
  };

  const history = currentUser?.history || [];

  const copyReferralCode = async () => {
    if (!referralData?.referralCode) return;
    try {
      await navigator.clipboard.writeText(referralData.referralCode);
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

  return (
    <div id="screen-profile" className="screen-profile">
      <div className="hero">
        <div className="screen-title">PROFILE</div>
        <div className="screen-sub">Your competitive record</div>
      </div>
      <div className="profile-hero">
        <div className="profile-top">
          <div className="avatar">{getInitials(currentUser.username)}</div>
          <div>
            <div className="profile-name">{currentUser.username}</div>
            <div className="profile-id">{currentUser.ffUid ? `UID: ${currentUser.ffUid}` : 'UID not added'}</div>
            <div className="profile-role">Role: {currentUser.role || 'user'}</div>
          </div>
        </div>
        <div className="trust-section">
          <div className="trust-label">
            <span className="label-text">Trust Score</span>
            <span className="label-score">{currentUser.trustScore} / 100</span>
          </div>
          <div className="trust-bar">
            <div className="trust-fill" style={{ width: `${currentUser.trustScore}%` }}></div>
          </div>
        </div>
      </div>
      <div className="profile-form">
        <div className="rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-4 mb-4">
          <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Referral Code</div>
          <div className="mt-2 text-lg font-semibold text-white">{referralData?.referralCode || currentUser.wallet?.referralCode || 'Generating...'}</div>
          <div className="mt-2 text-sm text-[#A1A1A1]">Share this code to earn rewards when your friends complete paid matches.</div>
          <button className="btn-outline mt-3" type="button" onClick={copyReferralCode} disabled={!referralData?.referralCode && !currentUser.wallet?.referralCode}>COPY CODE</button>
        </div>
        <label className="form-group">
          <span className="form-label">Free Fire UID</span>
          <input
            className="form-input"
            type="text"
            value={uid}
            onChange={(event) => setUid(event.target.value)}
            placeholder="Enter your Free Fire UID"
          />
        </label>
        <button className="btn-outline" type="button" onClick={handleSaveUid}>
          SAVE UID
        </button>
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}
      </div>
      <div style={{ padding: '0 16px 10px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '10px', letterSpacing: '3px', color: 'var(--dim)', textTransform: 'uppercase' }}>Match History</span>
      </div>
      <div style={{ borderTop: '1px solid var(--border)' }}>
        {history.length === 0 ? (
          <div className="hist-empty">No match history available.</div>
        ) : (
          history.map((item) => (
            <div key={item.id} className="hist-row">
              <div>
                <div className="hist-mode">{item.mode}</div>
                <div className="hist-meta">{item.meta}</div>
              </div>
              <div className={`result-chip ${item.result}`}>{item.result.toUpperCase()}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
