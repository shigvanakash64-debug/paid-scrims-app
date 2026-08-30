import { useState, useEffect } from 'react';
import { Loader, AlertCircle, Trophy } from 'lucide-react';
import { Card } from './Card';
import { BRMatchResultScreen } from '../screens/BRMatchResultScreen';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const parseJsonResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(text.includes('<!doctype html>') ? 'Backend API is unavailable.' : 'Invalid API response');
  }
  return response.json();
};

export const BRUserMatches = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [userResults, setUserResults] = useState({});

  useEffect(() => {
    const fetchUserMatches = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE}/br-participant/my-matches`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
          },
        });

        const data = await parseJsonResponse(response);
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch your BR matches');
        }

        const userMatches = data.matches || [];

        // Fetch results for each match
        const resultsMap = {};
        for (const match of userMatches) {
          try {
            const resultResponse = await fetch(`${API_BASE}/br-result/${match._id}/my-result`, {
              headers: {
                'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
              },
            });
            if (resultResponse.ok) {
              const resultData = await parseJsonResponse(resultResponse);
              resultsMap[match._id] = resultData.result;
            }
          } catch (err) {
            console.error(`Error fetching result for match ${match._id}:`, err);
          }
        }

        setMatches(userMatches);
        setUserResults(resultsMap);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserMatches();
  }, []);

  const handleMatchClose = () => {
    setSelectedMatch(null);
    // Refresh results
    if (selectedMatch) {
      const resultResponse = fetch(`${API_BASE}/br-result/${selectedMatch._id}/my-result`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      }).then(r => r.json()).then(data => {
        setUserResults(prev => ({
          ...prev,
          [selectedMatch._id]: data.result
        }));
      }).catch(err => console.error('Error updating result:', err));
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <Loader size={24} className="spin" />
        <span>Loading your matches...</span>
      </div>
    );
  }

  return (
    <>
      <div className="br-user-matches">
        <div className="matches-header">
          <h3>
            <Trophy size={20} />
            My BR Matches
          </h3>
          {matches.length === 0 && <p className="empty-text">No matches joined yet</p>}
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="matches-grid">
          {matches.map((match) => {
            const result = userResults[match._id];
            const isPending = !result;

            return (
              <Card key={match._id} className="user-match-card">
                <div className="card-header">
                  <h4>{match.matchName}</h4>
                  <span className={`status-badge ${isPending ? 'pending' : 'submitted'}`}>
                    {isPending ? 'Pending' : 'Submitted'}
                  </span>
                </div>

                <div className="card-body">
                  <div className="match-detail">
                    <span className="label">Scrim Type:</span>
                    <span className="value">{match.scrimType}</span>
                  </div>
                  <div className="match-detail">
                    <span className="label">Per Kill:</span>
                    <span className="value orange">₹{match.perKillReward}</span>
                  </div>
                  <div className="match-detail">
                    <span className="label">Scheduled:</span>
                    <span className="value">{new Date(match.scheduledDateTime).toLocaleString()}</span>
                  </div>
                  
                  {result && (
                    <div className="match-result">
                      <div className="result-info">
                        <div className="result-row">
                          <span className="label">Your Kills:</span>
                          <span className="value kills">{result.kills}</span>
                        </div>
                        <div className="result-row">
                          <span className="label">Status:</span>
                          <span className={`status-badge status-${result.verificationStatus}`}>
                            {result.verificationStatus === 'verified' && '✓ Verified'}
                            {result.verificationStatus === 'cheating' && '✗ Cheating'}
                            {result.verificationStatus === 'pending' && '◐ Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-footer">
                  <button
                    className="btn btn-primary"
                    onClick={() => setSelectedMatch(match)}
                  >
                    {result ? 'Update Result' : 'Submit Result'}
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {selectedMatch && (
        <BRMatchResultScreen
          match={selectedMatch}
          onClose={handleMatchClose}
        />
      )}
    </>
  );
};

export default BRUserMatches;
