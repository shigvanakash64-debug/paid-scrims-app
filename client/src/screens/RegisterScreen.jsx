import { useState } from 'react';

export const RegisterScreen = ({ onRegister, onNavigateLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [ffUid, setFfUid] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister({ username: username.trim() || 'Player123', password, ffUid: ffUid.trim() });
  };

  return (
    <div id="screen-register" className="screen-auth">
      <div className="auth-card">
        <div className="auth-title">Register</div>
        <div className="auth-sub">Create your Clutch Zone account</div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Choose a username"
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Password</span>
            <input
              className="auth-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
            />
          </label>
          <label className="auth-field">
            <span className="auth-label">Free Fire UID</span>
            <input
              className="auth-input"
              type="text"
              value={ffUid}
              onChange={(event) => setFfUid(event.target.value)}
              placeholder="Enter your Free Fire UID"
            />
          </label>
          <div className="auth-actions">
            <button className="btn-primary" type="submit">
              REGISTER
            </button>
            <button className="btn-outline" type="button" onClick={onNavigateLogin}>
              SIGN IN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
