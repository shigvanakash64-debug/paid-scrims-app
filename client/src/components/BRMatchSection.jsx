import { useState, useEffect } from 'react';
import { Loader } from 'lucide-react';
import BRMatchCard from './BRMatchCard';
import BRJoinFlow from './BRJoinFlow';
import BRDetailView from './BRDetailView';
import { Button } from './Button';

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
 * BRMatchSection - Displays BR matches in a section
 * Integrates into the main Clutch Zone interface
 * Shows "BR Match" as a collapsible/tab section
 */
export const BRMatchSection = ({ user = null, onMatchSelect = () => {} }) => {
  const [matches, setMatches] = useState([]);
  const [registrations, setRegistrations] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [joinFlowMatch, setJoinFlowMatch] = useState(null);
  const [detailViewMatch, setDetailViewMatch] = useState(null);
  const [filter, setFilter] = useState('OPEN'); // OPEN, FULL, CLOSED, ALL

  // Fetch BR matches
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const query = filter === 'ALL' ? '' : `?status=${filter}`;
      const response = await fetch(`${API_BASE}/br-match/list${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        const data = await parseJsonResponse(response).catch(() => null);
        throw new Error(data?.error || 'Failed to fetch BR matches');
      }

      const data = await parseJsonResponse(response);
      setMatches(data.matches || []);
      
      // Build registration map
      const regMap = {};
      if (user && data.matches) {
        for (const match of data.matches) {
          if (match.isRegistered) {
            regMap[match._id] = {
              isRegistered: true,
              inGameName: match.inGameName,
            };
          }
        }
      }
      setRegistrations(regMap);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch matches on component mount and when user changes
  useEffect(() => {
    fetchMatches();
  }, [user, filter]);

  // Handle join flow
  const handleJoinClick = (match) => {
    if (!user) {
      setError('Please login to join a match');
      return;
    }

    const walletBalance = user.wallet?.balance || 0;
    if (walletBalance < match.entryFee) {
      setError(
        `Insufficient wallet balance. Required: ₹${match.entryFee}, Available: ₹${walletBalance}`
      );
      return;
    }

    setJoinFlowMatch(match);
  };

  // Handle successful join
  const handleJoinSuccess = (participant) => {
    const matchId = joinFlowMatch?._id;
    setJoinFlowMatch(null);

    if (matchId) {
      setRegistrations((prev) => ({
        ...prev,
        [matchId]: {
          isRegistered: true,
          inGameName: participant.inGameName,
        },
      }));
    }

    fetchMatches();
  };

  // Handle view details
  const handleViewDetails = (match) => {
    setDetailViewMatch(match);
  };

  return (
    <div className="br-match-section">
      <div className="section-header">
        <h2>BR Match</h2>
        <p className="section-subtitle">Battle Royale Paid Scrims</p>
      </div>

      {/* Filter tabs */}
      <div className="br-filter-tabs">
        {['OPEN', 'FULL', 'CLOSED', 'ALL'].map((status) => (
          <button
            key={status}
            className={`filter-tab ${filter === status ? 'active' : ''}`}
            onClick={() => setFilter(status)}
            disabled={loading}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Error message */}
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="loading-container">
          <Loader className="spin" size={32} />
          <p>Loading BR matches...</p>
        </div>
      )}

      {/* Matches list */}
      {!loading && matches.length === 0 && (
        <div className="empty-state">
          <p>No BR matches available</p>
          <p className="subtitle">Check back later!</p>
        </div>
      )}

      {!loading && matches.length > 0 && (
        <div className="br-matches-list">
          {matches.map((match) => (
            <BRMatchCard
              key={match._id}
              match={match}
              isRegistered={registrations[match._id]?.isRegistered || false}
              inGameName={registrations[match._id]?.inGameName || null}
              onJoin={() => handleJoinClick(match)}
              onViewDetails={() => handleViewDetails(match)}
              user={user}
            />
          ))}
        </div>
      )}

      {/* Join Flow Modal */}
      {joinFlowMatch && (
        <BRJoinFlow
          match={joinFlowMatch}
          walletBalance={user?.wallet?.balance || 0}
          onJoinSuccess={handleJoinSuccess}
          onCancel={() => setJoinFlowMatch(null)}
          isOpen={!!joinFlowMatch}
        />
      )}

      {/* Detail View Modal */}
      {detailViewMatch && (
        <BRDetailView
          match={detailViewMatch}
          userRegistration={registrations[detailViewMatch._id] || null}
          isOpen={!!detailViewMatch}
          onClose={() => setDetailViewMatch(null)}
        />
      )}
    </div>
  );
};

export default BRMatchSection;
