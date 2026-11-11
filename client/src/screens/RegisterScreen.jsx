import { useState } from 'react';

export const RegisterScreen = ({ onRegister, onNavigateLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);

    try {
      const result = await onRegister({
        username: username.trim(),
        password,
        referralCode: referralCode.trim(),
        role,
      });

      if (result?.success === false) {
        setError(result.message || 'Registration failed');
      }
    } catch (registrationError) {
      setError(registrationError.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="screen-register" className="screen-auth">
      <div className="auth-card">
        <div className="auth-title">Register</div>
        <div className="auth-sub">Create your Clutch Zone account</div>
        <form onSubmit={handleSubmit} className="auth-form" aria-busy={loading}>
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
            <span className="auth-label">Account Type</span>
            <select className="auth-input" value={role} onChange={(event) => setRole(event.target.value)} required>
              <option value="" disabled>Select account type</option>
              <option value="user">User</option>
              <option value="host">Host</option>
            </select>
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
          {error && <div className="text-[#FCA5A5] text-sm mt-2">{error}</div>}
          {loading && (
            <div className="register-progress" role="status" aria-live="polite">
              <div className="register-progress__label">
                <span className="register-progress__spinner" aria-hidden="true" />
                <span>Creating your account... This may take a moment.</span>
              </div>
              <div
                className="register-progress__track"
                role="progressbar"
                aria-label="Creating your account"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <span className="register-progress__bar" />
              </div>
            </div>
          )}
          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'CREATING ACCOUNT...' : 'REGISTER'}
            </button>
            <button className="btn-outline" type="button" onClick={onNavigateLogin} disabled={loading}>
              SIGN IN
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
