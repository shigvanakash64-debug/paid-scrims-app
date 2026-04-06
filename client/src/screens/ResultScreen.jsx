import { useState } from 'react';

export const ResultScreen = ({ match, onScreenChange }) => {
  const [winner, setWinner] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleUpload = () => {
    setUploaded(true);
  };

  const handleSubmit = () => {
    if (!winner || !uploaded) return;
    setSubmitted(true);
    setTimeout(() => {
      onScreenChange('home');
    }, 1200);
  };

  if (!match) {
    return (
      <div id="screen-result" className="screen-result">
        <div className="hero">
          <div className="screen-title">SUBMIT RESULT</div>
          <div className="screen-sub">No active match available</div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div id="screen-result" className="screen-result">
        <div className="hero">
          <div className="screen-title">SUBMITTED</div>
          <div className="screen-sub">Your result has been recorded.</div>
        </div>
      </div>
    );
  }

  return (
    <div id="screen-result" className="screen-result">
      <div className="hero">
        <div className="screen-title">SUBMIT RESULT</div>
        <div className="screen-sub">Upload proof within 15 minutes</div>
      </div>
      <div className="upload-zone" role="button" tabIndex={0} onClick={handleUpload}>
        <div className="upload-icon">📸</div>
        <div className="upload-label">Upload Screenshot</div>
        <div className="upload-sub">{uploaded ? '✓ screenshot_match.jpg uploaded' : 'Tap to upload match result'}</div>
      </div>
      <div className="section">
        <div className="section-label">Select Outcome</div>
        <div className="winner-sel">
          <button
            type="button"
            className={`winner-btn ${winner === 'win' ? 'active' : ''}`}
            onClick={() => setWinner('win')}
          >
            ✓ I WON
          </button>
          <button
            type="button"
            className={`winner-btn lose ${winner === 'lose' ? 'active' : ''}`}
            onClick={() => setWinner('lose')}
          >
            ✗ I LOST
          </button>
        </div>
      </div>
      <div className="btn-cta-wrap">
        <button
          type="button"
          className="btn-primary"
          disabled={!winner || !uploaded}
          onClick={handleSubmit}
        >
          SUBMIT
        </button>
      </div>
    </div>
  );
};
