import { useState } from 'react';

export const RegisterScreen = ({ onRegister, onNavigateLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onRegister({ username: username.trim(), password, referralCode: referralCode.trim() });
  };

  return (
    <div id="screen-register" className="screen-auth">
      <div className="auth-card">
        <div className="auth-title">Register</div>
        <div className="auth-sub">Create your Clutch Zone account</div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">In Game Name</span>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your in-game name"
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
            <span className="auth-label">Referral Code (Optional)</span>
            <input
              className="auth-input"
              type="text"
              value={referralCode}
              onChange={(event) => setReferralCode(event.target.value.toUpperCase())}
              placeholder="Enter referral code"
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
