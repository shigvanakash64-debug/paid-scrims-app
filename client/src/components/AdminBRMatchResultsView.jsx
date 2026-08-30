import { useState, useEffect } from 'react';
import { Loader, AlertCircle, X, Check, XCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text.includes('<!doctype html>') ? 'Backend API is unavailable.' : 'Invalid API response');
  }
  return response.json();
};

export const AdminBRMatchResultsView = ({ matchId, onClose }) => {
  const [results, setResults] = useState([]);
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/br-result/${matchId}/results`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
          },
        });

        if (!response.ok) {
          const data = await parseJsonResponse(response).catch(() => null);
          throw new Error(data?.error || 'Failed to fetch results');
        }

        const data = await parseJsonResponse(response);
        setMatch(data.match);
        setResults(data.results || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (matchId) {
      fetchResults();
    }
  }, [matchId]);

  const handleVerifyResult = async (resultId, status) => {
    setVerifying(resultId);
    try {
      const response = await fetch(`${API_BASE}/br-result/${resultId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response).catch(() => null);
        throw new Error(data?.error || `Failed to ${status} result`);
      }

      // Update local state
      setResults(prev =>
        prev.map(r => r._id === resultId ? { ...r, verificationStatus: status } : r)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setVerifying(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <span className="status-verified">✓ Verified</span>;
      case 'cheating':
        return <span className="status-cheating">✗ Cheating</span>;
      case 'pending':
      default:
        return <span className="status-pending">◐ Pending</span>;
    }
  };

  return (
    <div className="admin-match-results-overlay">
      <div className="admin-match-results-modal">
        <div className="results-header">
          <div>
            <h2>Verify Results</h2>
            {match && <p className="match-title">{match.matchName}</p>}
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-container">
            <Loader size={24} className="spin" />
            <span>Loading results...</span>
          </div>
        ) : (
          <>
            {results.length > 0 ? (
              <div className="results-verification-table">
                <div className="verification-header">
                  <div className="col-ingame">In-Game Name</div>
                  <div className="col-kills">Kills</div>
                  <div className="col-status">Status</div>
                  <div className="col-actions">Actions</div>
                </div>

                <div className="verification-body">
                  {results.map((result) => (
                    <div key={result._id} className="verification-row">
                      <div className="col-ingame">
                        <span className="ingame-name">{result.inGameName}</span>
                        <span className="username-small">{result.username}</span>
                      </div>
                      <div className="col-kills">
                        <span className="kills-count">{result.kills}</span>
                      </div>
                      <div className="col-status">
                        {getStatusBadge(result.verificationStatus)}
                      </div>
                      <div className="col-actions">
                        {result.verificationStatus === 'pending' ? (
                          <div className="action-buttons">
                            <button
                              className="btn-confirm"
                              onClick={() => handleVerifyResult(result._id, 'verified')}
                              disabled={verifying === result._id}
                              title="Confirm this result"
                            >
                              <Check size={16} />
                              Confirm
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() => handleVerifyResult(result._id, 'cheating')}
                              disabled={verifying === result._id}
                              title="Mark as cheating"
                            >
                              <XCircle size={16} />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="status-locked">
                            {result.verificationStatus === 'verified' ? '✓ Approved' : '✗ Rejected'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results">
                <p>No results submitted yet</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBRMatchResultsView;
