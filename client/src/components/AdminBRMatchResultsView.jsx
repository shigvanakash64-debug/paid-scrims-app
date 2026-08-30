import { useState, useEffect } from 'react';
import { Loader, AlertCircle, X } from 'lucide-react';

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

  const totalKills = results.reduce((sum, r) => sum + r.kills, 0);
  const avgKills = results.length > 0 ? (totalKills / results.length).toFixed(1) : 0;

  return (
    <div className="admin-match-results-overlay">
      <div className="admin-match-results-modal">
        <div className="results-header">
          <div>
            <h2>Match Results</h2>
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
            {/* Summary Stats */}
            <div className="results-summary">
              <div className="stat-item">
                <span className="label">Submissions</span>
                <span className="value">{results.length}</span>
              </div>
              <div className="stat-item">
                <span className="label">Total Kills</span>
                <span className="value">{totalKills}</span>
              </div>
              <div className="stat-item">
                <span className="label">Avg Kills</span>
                <span className="value">{avgKills}</span>
              </div>
            </div>

            {/* Results Table */}
            {results.length > 0 ? (
              <div className="results-table-container">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Kills</th>
                      <th>Reward (₹)</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result._id}>
                        <td className="username">{result.username}</td>
                        <td className="kills">{result.kills}</td>
                        <td className="reward">
                          ₹{match ? (result.kills * match.perKillReward) : 0}
                        </td>
                        <td className="submitted-time">
                          {new Date(result.submittedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
