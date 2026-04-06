import { useState } from 'react';

export const LoginScreen = ({ onLogin, onNavigateRegister }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    onLogin({ username: username.trim(), password });
  };

  return (
    <div id="screen-login" className="screen-auth">
      <div className="auth-card">
        <div className="auth-title">Sign In</div>
        <div className="auth-sub">Access your Clutch Zone profile</div>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span className="auth-label">Username</span>
            <input
              className="auth-input"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="Enter your username"
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
              placeholder="Enter your password"
              required
            />
          </label>
          <div className="auth-actions">
            <button className="btn-primary" type="submit">
              LOGIN
            </button>
            <button className="btn-outline" type="button" onClick={onNavigateRegister}>
              CREATE ACCOUNT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
