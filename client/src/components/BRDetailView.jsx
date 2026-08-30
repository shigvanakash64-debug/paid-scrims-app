import { useState, useEffect } from 'react';
import { X, Copy, Loader, AlertCircle } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';

/**
 * BRDetailView - Displays full details of a BR match
 * Shows room credentials (if registered), participants list, and match info
 */
export const BRDetailView = ({
  match,
  userRegistration,
  isOpen = false,
  onClose = () => {},
}) => {
  const [roomDetails, setRoomDetails] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedField, setCopiedField] = useState('');

  // Fetch room details if user is registered
  useEffect(() => {
    if (isOpen && userRegistration?.isRegistered) {
      fetchRoomDetails();
      fetchParticipants();
    }
  }, [isOpen, match._id, userRegistration]);

  const fetchRoomDetails = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/br-participant/${match._id}/room`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch room details');
      }

      const data = await response.json();
      setRoomDetails(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`/api/br-participant/${match._id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }

      const data = await response.json();
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Error fetching participants:', err);
    }
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(''), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="br-detail-view-overlay">
      <div className="br-detail-view-modal">
        <Card className="detail-view-card">
          {/* Header */}
          <div className="detail-header">
            <div className="header-content">
              <h2>{match.matchName}</h2>
              <p className="header-status">{match.status}</p>
            </div>
            <button className="close-btn" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Content */}
          <div className="detail-content">
            {/* Match Info */}
            <div className="detail-section">
              <h3 className="section-title">Match Information</h3>
              <div className="info-grid">
                <div className="info-item">
                  <span className="label">Entry Fee</span>
                  <span className="value">₹{match.entryFee}</span>
                </div>
                <div className="info-item">
                  <span className="label">Players</span>
                  <span className="value">
                    {match.currentPlayers}/{match.maxPlayers}
                  </span>
                </div>
                <div className="info-item">
                  <span className="label">Scrim Type</span>
                  <span className="value">{match.scrimType}</span>
                </div>
                <div className="info-item">
                  <span className="label">Per Kill Reward</span>
                  <span className="value">₹{match.perKillReward}</span>
                </div>
                <div className="info-item">
                  <span className="label">Timer</span>
                  <span className="value">{match.timerDuration}m</span>
                </div>
              </div>
            </div>

            {/* Room Credentials (if registered) */}
            {userRegistration?.isRegistered && (
              <div className="detail-section room-section">
                <h3 className="section-title">Room Details</h3>
                {loading ? (
                  <div className="loading-placeholder">
                    <Loader size={20} className="spin" />
                    <span>Loading room details...</span>
                  </div>
                ) : error ? (
                  <div className="error-message">
                    <AlertCircle size={16} />
                    <span>{error}</span>
                  </div>
                ) : roomDetails ? (
                  <div className="room-credentials">
                    <div className="credential-item">
                      <label>Your In-Game Name</label>
                      <div className="credential-display">
                        <span className="credential-value">{roomDetails.inGameName}</span>
                      </div>
                    </div>

                    <div className="credential-item">
                      <label>Room ID</label>
                      <div className="credential-display">
                        <span className="credential-value">{roomDetails.roomId}</span>
                        <button
                          className={`copy-btn ${copiedField === 'roomId' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(roomDetails.roomId, 'roomId')}
                        >
                          {copiedField === 'roomId' ? '✓ Copied' : <Copy size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="credential-item">
                      <label>Room Password</label>
                      <div className="credential-display">
                        <span className="credential-value">{roomDetails.roomPassword}</span>
                        <button
                          className={`copy-btn ${copiedField === 'password' ? 'copied' : ''}`}
                          onClick={() => copyToClipboard(roomDetails.roomPassword, 'password')}
                        >
                          {copiedField === 'password' ? '✓ Copied' : <Copy size={16} />}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Participants List */}
            {participants.length > 0 && (
              <div className="detail-section participants-section">
                <h3 className="section-title">Registered Participants ({participants.length}/50)</h3>
                <div className="participants-list">
                  {participants.map((participant, index) => (
                    <div key={index} className="participant-row">
                      <span className="slot-number">#{participant.slotNumber}</span>
                      <span className="ign">{participant.inGameName}</span>
                      <span className="timestamp">
                        {new Date(participant.registrationTime).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="detail-footer">
            <Button variant="secondary" size="md" onClick={onClose}>
              Close
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default BRDetailView;
