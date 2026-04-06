import { useEffect, useState } from 'react';

export const ProfileScreen = ({ user, onUserUpdate, onProfileSave }) => {
  const [uid, setUid] = useState(user?.ffUid || '');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setUid(user?.ffUid || '');
  }, [user?.ffUid]);

  if (!user) {
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

  const history = user.history || [];

  const handleSaveUid = async () => {
    setError('');
    setMessage('');

    if (!uid.trim()) {
      setError('Please enter your Free Fire UID');
      return;
    }

    if (!onProfileSave) {
      onUserUpdate?.({ ...user, ffUid: uid.trim() });
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
          <div className="avatar">{getInitials(user.username)}</div>
          <div>
            <div className="profile-name">{user.username}</div>
            <div className="profile-id">{user.ffUid ? `UID: ${user.ffUid}` : 'UID not added'}</div>
          </div>
        </div>
        <div className="trust-section">
          <div className="trust-label">
            <span className="label-text">Trust Score</span>
            <span className="label-score">{user.trustScore} / 100</span>
          </div>
          <div className="trust-bar">
            <div className="trust-fill" style={{ width: `${user.trustScore}%` }}></div>
          </div>
        </div>
      </div>
      <div className="profile-form">
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
