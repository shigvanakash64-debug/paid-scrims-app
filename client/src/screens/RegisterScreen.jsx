import { useEffect, useState } from 'react';

export const RegisterScreen = ({ onRegister, onNavigateLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = setInterval(() => {
      setResendSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  const handleOtpRequest = async () => {
    setError('');
    const normalizedPhone = phone.trim();
    if (!normalizedPhone) {
      setError('Mobile number is required');
      return;
    }
    setLoading(true);
    const result = await onRegister({ username: username.trim(), password, phone: normalizedPhone, referralCode: referralCode.trim() });
    setLoading(false);

    if (result?.success && result.mode === 'otp-sent') {
      setOtpSent(true);
      setOtp('');
      setResendSeconds(45);
      return;
    }

    setError(result?.message || 'Could not send OTP');
  };

  const handleVerifyOtp = async () => {
    setError('');
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }
    setLoading(true);
    const result = await onRegister({
      username: username.trim(),
      password,
      phone: phone.trim(),
      referralCode: referralCode.trim(),
      otp: otp.trim(),
    });
    setLoading(false);

    if (result?.success) {
      return;
    }

    setError(result?.message || 'OTP verification failed');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!otpSent) {
      await handleOtpRequest();
      return;
    }
    await handleVerifyOtp();
  };

  const handleChangeMobile = () => {
    setOtpSent(false);
    setOtp('');
    setError('');
    setResendSeconds(0);
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
            <span className="auth-label">Mobile Number</span>
            <input
              className="auth-input"
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/[^\d+]/g, ''))}
              placeholder="+91XXXXXXXXXX"
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
          {otpSent && (
            <div className="auth-field">
              <span className="auth-label">Verify your mobile number</span>
              <div className="text-sm text-[#F5F5F5] mb-2">OTP sent to {phone || '+91 XXXXX XXXXX'}</div>
              <input
                className="auth-input tracking-[0.5em] text-center"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
              />
              <div className="mt-3 flex items-center justify-between gap-3">
                <button className="btn-outline" type="button" onClick={handleChangeMobile}>
                  Change mobile number
                </button>
                <button
                  className="btn-outline"
                  type="button"
                  onClick={handleOtpRequest}
                  disabled={resendSeconds > 0 || loading}
                >
                  {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
                </button>
              </div>
            </div>
          )}
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
          <div className="auth-actions">
            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? 'Please wait...' : otpSent ? 'VERIFY OTP' : 'REGISTER'}
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
