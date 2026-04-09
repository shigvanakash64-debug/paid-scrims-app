import { useState, useEffect } from 'react';
import axios from 'axios';
import { ResultSubmissionCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const ResultReviewPanel = () => {
  const [resultSubmissions, setResultSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
            <ResultSubmissionCard
              key={submission.matchId}
              matchId={submission.matchId}
              players={submission.players}
              mode={submission.mode}
              type={submission.type}
              entry={submission.entry}
              status={submission.status}
              resultDeadline={submission.resultDeadline}
              resultScreenshots={submission.resultScreenshots || []}
            />
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
