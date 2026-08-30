import { useState, useEffect } from 'react';
import { Plus, Edit2, X, Loader, AlertCircle } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

/**
 * AdminBRMatchPanel - BR Match management for admins
 * Allows creating, editing, closing BR matches
 */
export const AdminBRMatchPanel = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [formData, setFormData] = useState({
    matchName: '',
    entryFee: '',
    scrimType: 'Only Fist',
    perKillReward: '',
    timerDuration: '',
    roomId: '',
    roomPassword: '',
  });

  // Fetch BR matches
  const fetchMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/br-match/list', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch BR matches');
      }

      const data = await response.json();
      setMatches(data.matches || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Load matches on mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('Fee') || name.includes('Reward') || name.includes('Duration') ? 
        (value === '' ? '' : parseFloat(value)) : value,
    }));
  };

  // Create new BR match
  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setError('');

    // Validate form
    if (!formData.matchName || !formData.entryFee || !formData.perKillReward || 
        !formData.timerDuration || !formData.roomId || !formData.roomPassword) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/br-match/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create BR match');
      }

      const data = await response.json();
      setMatches([data.match, ...matches]);
      setShowCreateForm(false);
      setFormData({
        matchName: '',
        entryFee: '',
        scrimType: 'Only Fist',
        perKillReward: '',
        timerDuration: '',
        roomId: '',
        roomPassword: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Close a match
  const handleCloseMatch = async (matchId) => {
    if (!window.confirm('Close this BR match? Players will not be able to join.')) {
      return;
    }

    setError('');
    try {
      const response = await fetch(`/api/br-match/${matchId}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to close match');
      }

      setMatches((prev) =>
        prev.map((m) => (m._id === matchId ? { ...m, status: 'CLOSED' } : m))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // View match details
  const handleViewMatch = (match) => {
    setSelectedMatch(match);
  };

  return (
    <div className="admin-br-panel">
      <div className="panel-header">
        <div>
          <h2>Battle Royale Matches</h2>
          <p className="text-sm text-gray-400">Create and manage BR matches</p>
        </div>
        <Button
          variant="primary"
          size="md"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Create BR Match
        </Button>
      </div>

      {error && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="create-form-card">
          <div className="form-header">
            <h3>Create New BR Match</h3>
            <button
              className="close-btn"
              onClick={() => setShowCreateForm(false)}
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleCreateMatch} className="create-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="matchName">Match Name *</label>
                <input
                  type="text"
                  id="matchName"
                  name="matchName"
                  value={formData.matchName}
                  onChange={handleInputChange}
                  placeholder="e.g., BR Tournament #001"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="entryFee">Entry Fee (₹) *</label>
                <input
                  type="number"
                  id="entryFee"
                  name="entryFee"
                  value={formData.entryFee}
                  onChange={handleInputChange}
                  placeholder="e.g., 20"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="scrimType">Scrim Type *</label>
                <select
                  id="scrimType"
                  name="scrimType"
                  value={formData.scrimType}
                  onChange={handleInputChange}
                  required
                >
                  <option value="Only Fist">Only Fist</option>
                  <option value="Bolt Action">Bolt Action</option>
                  <option value="AR Only">AR Only</option>
                  <option value="SMG Only">SMG Only</option>
                  <option value="Sniper Only">Sniper Only</option>
                  <option value="No Healing">No Healing</option>
                  <option value="Custom">Custom</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="perKillReward">Per Kill Reward (₹) *</label>
                <input
                  type="number"
                  id="perKillReward"
                  name="perKillReward"
                  value={formData.perKillReward}
                  onChange={handleInputChange}
                  placeholder="e.g., 10"
                  min="0"
                  step="1"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="timerDuration">Timer Duration (minutes) *</label>
                <input
                  type="number"
                  id="timerDuration"
                  name="timerDuration"
                  value={formData.timerDuration}
                  onChange={handleInputChange}
                  placeholder="e.g., 30"
                  min="1"
                  max="120"
                  step="1"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="roomId">Room ID *</label>
                <input
                  type="text"
                  id="roomId"
                  name="roomId"
                  value={formData.roomId}
                  onChange={handleInputChange}
                  placeholder="e.g., 123456789"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="roomPassword">Room Password *</label>
                <input
                  type="text"
                  id="roomPassword"
                  name="roomPassword"
                  value={formData.roomPassword}
                  onChange={handleInputChange}
                  placeholder="e.g., ABC123"
                  required
                />
              </div>
            </div>

            <div className="form-actions">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Match'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Matches List */}
      {loading ? (
        <div className="loading-container">
          <Loader size={32} className="spin" />
          <p>Loading BR matches...</p>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <p>No BR matches created yet</p>
        </div>
      ) : (
        <div className="matches-table-container">
          <table className="matches-table">
            <thead>
              <tr>
                <th>Match Name</th>
                <th>Entry Fee</th>
                <th>Players</th>
                <th>Scrim Type</th>
                <th>Per Kill</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {matches.map((match) => (
                <tr key={match._id} className={`status-${match.status.toLowerCase()}`}>
                  <td className="font-semibold">{match.matchName}</td>
                  <td>₹{match.entryFee}</td>
                  <td>{match.currentPlayers}/{match.maxPlayers}</td>
                  <td>{match.scrimType}</td>
                  <td>₹{match.perKillReward}</td>
                  <td>
                    <span className={`badge badge-${match.status.toLowerCase()}`}>
                      {match.status}
                    </span>
                  </td>
                  <td className="actions">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleViewMatch(match)}
                    >
                      <Edit2 size={14} /> View
                    </button>
                    {match.status !== 'CLOSED' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleCloseMatch(match._id)}
                      >
                        Close
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Match Detail Modal */}
      {selectedMatch && (
        <AdminBRMatchDetail
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onRefresh={fetchMatches}
        />
      )}
    </div>
  );
};

/**
 * AdminBRMatchDetail - Shows detailed view of a BR match
 */
const AdminBRMatchDetail = ({ match, onClose, onRefresh }) => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    roomId: match.roomId,
    roomPassword: match.roomPassword,
  });

  useEffect(() => {
    fetchParticipants();
  }, [match._id]);

  const fetchParticipants = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/br-match/${match._id}/participants-admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
      }
    } catch (err) {
      console.error('Error fetching participants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoom = async () => {
    try {
      const response = await fetch(`/api/br-match/${match._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('clutchzone_token')}`,
        },
        body: JSON.stringify({
          roomId: editData.roomId,
          roomPassword: editData.roomPassword,
        }),
      });

      if (response.ok) {
        setEditMode(false);
        onRefresh();
      }
    } catch (err) {
      console.error('Error updating room details:', err);
    }
  };

  return (
    <div className="admin-br-detail-overlay">
      <Card className="admin-br-detail-modal">
        <div className="detail-header">
          <h3>{match.matchName}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="detail-body">
          {/* Match Info */}
          <div className="section">
            <h4>Match Information</h4>
            <div className="info-grid">
              <div>
                <span className="label">Entry Fee:</span>
                <span className="value">₹{match.entryFee}</span>
              </div>
              <div>
                <span className="label">Players:</span>
                <span className="value">
                  {match.currentPlayers}/{match.maxPlayers}
                </span>
              </div>
              <div>
                <span className="label">Scrim Type:</span>
                <span className="value">{match.scrimType}</span>
              </div>
              <div>
                <span className="label">Per Kill:</span>
                <span className="value">₹{match.perKillReward}</span>
              </div>
            </div>
          </div>

          {/* Room Details */}
          <div className="section">
            <div className="section-header">
              <h4>Room Details</h4>
              {!editMode && (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => setEditMode(true)}
                >
                  Edit
                </button>
              )}
            </div>

            {editMode ? (
              <div className="edit-form">
                <input
                  type="text"
                  placeholder="Room ID"
                  value={editData.roomId}
                  onChange={(e) => setEditData({ ...editData, roomId: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Room Password"
                  value={editData.roomPassword}
                  onChange={(e) => setEditData({ ...editData, roomPassword: e.target.value })}
                />
                <div className="edit-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => setEditMode(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-sm btn-primary" onClick={handleUpdateRoom}>
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="info-grid">
                <div>
                  <span className="label">Room ID:</span>
                  <span className="value">{match.roomId}</span>
                </div>
                <div>
                  <span className="label">Password:</span>
                  <span className="value">{match.roomPassword}</span>
                </div>
              </div>
            )}
          </div>

          {/* Participants */}
          <div className="section">
            <h4>Participants ({participants.length}/50)</h4>
            {loading ? (
              <div className="text-center py-4">Loading...</div>
            ) : participants.length === 0 ? (
              <div className="text-center py-4 text-gray-400">No participants yet</div>
            ) : (
              <div className="participants-mini-list">
                {participants.map((p, idx) => (
                  <div key={idx} className="participant-item">
                    <span className="slot">#{p.slotNumber}</span>
                    <span className="ign">{p.inGameName}</span>
                    <span className="user">{p.username}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminBRMatchPanel;
