import { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text.includes('<!doctype html>') ? 'Backend API is unavailable.' : 'Invalid API response');
  }
  return response.json();
};

export const BRMatchResultScreen = ({ match, onClose }) => {
  const [kills, setKills] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [userResult, setUserResult] = useState(null);

  // Fetch user's existing result for this match
  useEffect(() => {
    const fetchUserResult = async () => {
      try {
        const response = await fetch(`${API_BASE}/br-result/${match._id}/my-result`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
          },
        });

        if (response.ok) {
          const data = await parseJsonResponse(response);
          if (data.result) {
            setUserResult(data.result);
            setKills(data.result.kills.toString());
            setSubmitted(true);
          }
        }
      } catch (err) {
        console.error('Error fetching user result:', err);
      }
    };

    if (match?._id) {
      fetchUserResult();
    }
  }, [match?._id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate kills input
    if (kills === '' || kills === null || kills === undefined) {
      setError('Please enter your kill count');
      return;
    }

    const killsNum = parseInt(kills, 10);
    if (isNaN(killsNum) || killsNum < 0) {
      setError('Please enter a valid kill count (0 or higher)');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/br-result/${match._id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({ kills: killsNum }),
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response).catch(() => null);
        throw new Error(data?.error || 'Failed to submit result');
      }

      const data = await parseJsonResponse(response);
      setUserResult(data.result);
      setSubmitted(true);
      
      // Show success message temporarily
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br-result-overlay">
      <Card className="br-result-modal">
        <div className="result-header">
          <h2>Match Result</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Match Details */}
        <div className="result-match-info">
          <div className="info-item">
            <span className="label">Match Name:</span>
            <span className="value">{match?.matchName}</span>
          </div>
          <div className="info-item">
            <span className="label">Scrim Type:</span>
            <span className="value">{match?.scrimType}</span>
          </div>
          <div className="info-item">
            <span className="label">Per Kill Reward:</span>
            <span className="value orange">₹{match?.perKillReward}</span>
          </div>
          <div className="info-item">
            <span className="label">Scheduled:</span>
            <span className="value">{new Date(match?.scheduledDateTime).toLocaleString()}</span>
          </div>
        </div>

        {/* Form or Success Message */}
        {submitted && userResult ? (
          <div className="result-success">
            <div className="success-icon">✓</div>
            <h3>Result Submitted!</h3>
            <p>Your kill count: <strong>{userResult.kills}</strong></p>
            <p className="success-subtitle">Admin will review your result</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="result-form">
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="kills">How many kills did you get? *</label>
              <input
                type="number"
                id="kills"
                value={kills}
                onChange={(e) => setKills(e.target.value)}
                placeholder="Enter your kill count"
                min="0"
                step="1"
                required
                disabled={loading}
              />
              <small className="hint">Enter the number of kills you got in this match</small>
            </div>

            <div className="result-actions">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader size={16} className="spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Result'
                )}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};

export default BRMatchResultScreen;
