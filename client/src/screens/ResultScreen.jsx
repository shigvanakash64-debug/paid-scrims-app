import { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Upload, CheckCircle, XCircle } from 'lucide-react';

export const ResultScreen = ({ match, user, onScreenChange }) => {
  const [selectedWinner, setSelectedWinner] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setScreenshot(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWinner || !screenshot) return;

    setUploading(true);

    // Simulate API call
    setTimeout(() => {
      setUploading(false);
      setSubmitted(true);

      // Simulate success/failure
      setTimeout(() => {
        onScreenChange('home');
      }, 2000);
    }, 2000);
  };

  if (!match) {
    return (
      <div className="result-screen">
        <Card>
          <div className="error-state">
            <h2>No Active Match</h2>
            <p>Return to home to find a match</p>
            <Button onClick={() => onScreenChange('home')}>
              Find Match
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="result-screen">
        <Card className="success-state">
          <CheckCircle size={48} className="success-icon" />
          <h2>Result Submitted!</h2>
          <p>Your result has been recorded. Winner will be announced soon.</p>
          <div className="result-summary">
            <div className="summary-item">
              <span>Match:</span>
              <strong>{match.mode} - {match.type}</strong>
            </div>
            <div className="summary-item">
              <span>Your Claim:</span>
              <strong>{selectedWinner === user.username ? 'You Won' : 'Opponent Won'}</strong>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="result-screen">
      <Card className="result-form">
        <h2>Submit Match Result</h2>

        <div className="match-summary">
          <div className="summary-item">
            <span>Mode:</span>
            <strong>{match.mode}</strong>
          </div>
          <div className="summary-item">
            <span>Type:</span>
            <strong>{match.type}</strong>
          </div>
          <div className="summary-item">
            <span>Entry Fee:</span>
            <strong>₹{match.entryFee}</strong>
          </div>
        </div>

        <div className="winner-selection">
          <h3>Who won the match?</h3>
          <div className="winner-options">
            <button
              className={`winner-option ${selectedWinner === user.username ? 'selected' : ''}`}
              onClick={() => setSelectedWinner(user.username)}
            >
              <CheckCircle size={20} />
              <span>I Won</span>
            </button>
            <button
              className={`winner-option ${selectedWinner === match.opponent.username ? 'selected' : ''}`}
              onClick={() => setSelectedWinner(match.opponent.username)}
            >
              <XCircle size={20} />
              <span>Opponent Won</span>
            </button>
          </div>
        </div>

        <div className="screenshot-upload">
          <h3>Upload Screenshot</h3>
          <div className="upload-area">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              id="screenshot-input"
              className="hidden"
            />
            <label htmlFor="screenshot-input" className="upload-label">
              {screenshot ? (
                <div className="file-selected">
                  <CheckCircle size={24} />
                  <span>{screenshot.name}</span>
                </div>
              ) : (
                <div className="upload-prompt">
                  <Upload size={24} />
                  <span>Click to upload screenshot</span>
                  <small>JPG, PNG, or WebP (max 5MB)</small>
                </div>
              )}
            </label>
          </div>
        </div>

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmit}
          disabled={!selectedWinner || !screenshot || uploading}
          className="submit-btn"
        >
          {uploading ? 'Submitting...' : 'Submit Result'}
        </Button>

        <div className="dispute-notice">
          <p>
            If you believe there was an error or dispute, you can raise a dispute
            after submission. Multiple false disputes may affect your trust score.
          </p>
        </div>
      </Card>
    </div>
  );
};