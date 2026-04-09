import { useState, useEffect } from 'react';
import axios from 'axios';
import { ResultSubmissionCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const ResultReviewPanel = () => {
  const [resultSubmissions, setResultSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchResultSubmissions();
  }, []);

  const fetchResultSubmissions = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setResultSubmissions(response.data.resultSubmissions || []);
    } catch (err) {
      console.error('fetchResultSubmissions error', err);
      setError('Unable to load result submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveResult = async (matchId, winnerId) => {
    setActionLoading((prev) => ({ ...prev, [matchId]: 'approve' }));
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(
        `${API_BASE}/match/approve-result`,
        { matchId, winnerId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchResultSubmissions();
    } catch (err) {
      console.error('approveResult error', err);
      alert(err.response?.data?.error || 'Failed to approve result');
    } finally {
      setActionLoading((prev) => ({ ...prev, [matchId]: null }));
    }
  };

  const handleRejectResult = async (matchId) => {
    setActionLoading((prev) => ({ ...prev, [matchId]: 'reject' }));
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(
        `${API_BASE}/match/reject-result`,
        { matchId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchResultSubmissions();
    } catch (err) {
      console.error('rejectResult error', err);
      alert(err.response?.data?.error || 'Failed to reject result');
    } finally {
      setActionLoading((prev) => ({ ...prev, [matchId]: null }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Result Review</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading pending result submissions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Result Review</h1>
          <p className="text-sm text-[#EF4444] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Result Review</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">Review player-submitted screenshots and match metadata for pending result confirmation.</p>
      </div>

      {resultSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {resultSubmissions.map((submission) => (
            <div key={submission.matchId} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-[#A1A1A1]">RESULT SUBMISSION</p>
                  <p className="text-lg font-semibold text-white mt-1">Match #{submission.matchId}</p>
                </div>
                <span className="text-xs font-semibold rounded-full bg-[#1F1F1F] px-3 py-1 text-[#A1A1A1]">
                  {submission.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>

              <div className="space-y-2 text-sm text-[#E5E7EB]">
                <div><span className="font-semibold text-white">Match:</span> {submission.mode} • {submission.type}</div>
                <div><span className="font-semibold text-white">Entry fee:</span> ₹{submission.entry}</div>
                <div><span className="font-semibold text-white">Players:</span> {submission.players.join(' vs ')}</div>
                {submission.resultDeadline && (
                  <div><span className="font-semibold text-white">Deadline:</span> {new Date(submission.resultDeadline).toLocaleString()}</div>
                )}
              </div>

              {submission.resultScreenshots && submission.resultScreenshots.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {submission.resultScreenshots.map((screenshot, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="text-xs text-[#A1A1A1]">{screenshot.user?.username || `Player ${idx + 1}`}</div>
                      <div className="relative overflow-hidden rounded-lg bg-[#0B0B0B] border border-[#1F1F1F] aspect-video">
                        <img src={screenshot.image} alt={`Result proof ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {submission.status === 'result_pending' && (
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleApproveResult(submission.matchId, submission.submittedWinner)}
                    disabled={actionLoading[submission.matchId] === 'approve'}
                    className="flex-1 bg-[#22C55E] text-black px-3 py-2 rounded font-semibold text-sm hover:opacity-90 transition disabled:opacity-50"
                  >
                    {actionLoading[submission.matchId] === 'approve' ? '...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRejectResult(submission.matchId)}
                    disabled={actionLoading[submission.matchId] === 'reject'}
                    className="flex-1 border border-[#EF4444] text-[#EF4444] px-3 py-2 rounded font-semibold text-sm hover:bg-[#3d1c1c] transition disabled:opacity-50"
                  >
                    {actionLoading[submission.matchId] === 'reject' ? '...' : 'Move to Dispute'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">No result submissions pending</p>
          <p className="text-sm text-[#A1A1A1]">All submitted match results have been reviewed.</p>
        </div>
      )}
    </div>
  );
};
