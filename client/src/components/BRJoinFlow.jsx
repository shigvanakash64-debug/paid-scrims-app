import { useState } from 'react';
import { AlertCircle, Loader } from 'lucide-react';
import { Button } from './Button';
import { Card } from './Card';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text.includes('<!doctype html>') ? 'Backend API is unavailable right now.' : 'Invalid API response');
  }

  return response.json();
};

/**
 * BRJoinFlow - Handles the 2-step BR match joining process
 * Step 1: JOIN - deduct entry fee from wallet
 * Step 2: CONFIRM - enter in-game name and complete registration
 */
export const BRJoinFlow = ({
  match,
  walletBalance,
  onJoinSuccess = () => {},
  onCancel = () => {},
  isOpen = false,
}) => {
  const [step, setStep] = useState(1); // 1 = join, 2 = confirm
  const [inGameName, setInGameName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  // Validate wallet balance
  const hasBalance = walletBalance >= match.entryFee;

  // Step 1: Initiate join (deduct entry fee)
  const handleJoin = async () => {
    setError('');
    setSuccess('');

    if (!hasBalance) {
      setError(`Insufficient balance. Required: ₹${match.entryFee}, Available: ₹${walletBalance}`);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/br-participant/${match._id}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response).catch(() => null);
        throw new Error(data?.error || 'Failed to join match');
      }

      const data = await parseJsonResponse(response);
      setSuccess(data.message);
      setError('');
      setTimeout(() => setStep(2), 500); // Move to step 2
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Confirm registration with in-game name
  const handleConfirm = async () => {
    setError('');
    setSuccess('');

    if (!inGameName.trim()) {
      setError('Please enter your in-game name');
      return;
    }

    if (inGameName.length > 50) {
      setError('In-game name must be 50 characters or less');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/br-participant/${match._id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({ inGameName: inGameName.trim() }),
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response).catch(() => null);
        throw new Error(data?.error || 'Failed to confirm registration');
      }

      const data = await parseJsonResponse(response);
      setSuccess(data.message);
      setTimeout(() => {
        onJoinSuccess(data.participant);
      }, 1000);
    } catch (err) {
      setError(err.message);
      setSuccess('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="br-join-flow-overlay">
      <div className="br-join-flow-modal">
        <Card className="join-flow-card">
          {step === 1 ? (
            // STEP 1: JOIN AND PAY
            <>
              <div className="flow-header">
                <h2>Join BR Match</h2>
                <p className="subtitle">{match.matchName}</p>
              </div>

              <div className="flow-content">
                <div className="match-info-summary">
                  <div className="info-row">
                    <span className="label">Match:</span>
                    <span className="value">{match.matchName}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">Players:</span>
                    <span className="value">
                      {match.currentPlayers}/{match.maxPlayers}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="label">Entry Fee:</span>
                    <span className="value price">₹{match.entryFee}</span>
                  </div>
                  <div className="divider"></div>
                  <div className="info-row">
                    <span className="label">Your Wallet:</span>
                    <span className={`value ${hasBalance ? 'balance-ok' : 'balance-low'}`}>
                      ₹{walletBalance}
                    </span>
                  </div>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success">
                    <span>✓ {success}</span>
                  </div>
                )}
              </div>

              <div className="flow-actions">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={onCancel}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleJoin}
                  disabled={loading || !hasBalance}
                  className={loading ? 'loading' : ''}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="spin" />
                      Processing...
                    </>
                  ) : (
                    `Pay ₹${match.entryFee}`
                  )}
                </Button>
              </div>
            </>
          ) : (
            // STEP 2: CONFIRM WITH IGN
            <>
              <div className="flow-header">
                <h2>Enter In-Game Name</h2>
                <p className="subtitle">Complete your registration</p>
              </div>

              <div className="flow-content">
                <div className="ign-input-section">
                  <label htmlFor="inGameName" className="label">
                    In-Game Name
                  </label>
                  <input
                    type="text"
                    id="inGameName"
                    className="ign-input"
                    placeholder="e.g., Akash123"
                    value={inGameName}
                    onChange={(e) => setInGameName(e.target.value)}
                    maxLength={50}
                    disabled={loading}
                  />
                  <p className="input-hint">
                    {inGameName.length}/50 characters
                  </p>
                </div>

                <div className="confirmation-summary">
                  <p className="summary-label">You will be registered as:</p>
                  <p className="summary-ign">{inGameName || '(enter name above)'}</p>
                </div>

                {error && (
                  <div className="alert alert-error">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success">
                    <span>✓ {success}</span>
                  </div>
                )}
              </div>

              <div className="flow-actions">
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleConfirm}
                  disabled={loading || !inGameName.trim()}
                  className={loading ? 'loading' : ''}
                >
                  {loading ? (
                    <>
                      <Loader size={16} className="spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Registration'
                  )}
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};

export default BRJoinFlow;
