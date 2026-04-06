import { useState } from 'react';

export const SettingsScreen = ({ user }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || 'Could not change password');
      } else {
        setMessage('Password changed successfully');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      setError('Server error while changing password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div id="screen-settings" className="screen-settings">
      <div className="hero">
        <div className="screen-title">SETTINGS</div>
        <div className="screen-sub">Change your account password</div>
      </div>

      <div className="settings-card">
        <form className="settings-form" onSubmit={handleSubmit}>
          <label className="form-group">
            <span className="form-label">Current Password</span>
            <input
              className="form-input"
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Enter current password"
              required
            />
          </label>
          <label className="form-group">
            <span className="form-label">New Password</span>
            <input
              className="form-input"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password"
              required
            />
          </label>
          <label className="form-group">
            <span className="form-label">Confirm New Password</span>
            <input
              className="form-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              required
            />
          </label>

          {error && <div className="form-error">{error}</div>}
          {message && <div className="form-success">{message}</div>}

          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? 'SAVING...' : 'UPDATE PASSWORD'}
          </button>
        </form>
      </div>
    </div>
  );
};
