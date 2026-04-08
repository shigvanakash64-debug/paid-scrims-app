import { useState, useEffect } from 'react';
import axios from 'axios';
import { DisputeCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const DisputesPanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/disputes?status=disputed`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDisputes(response.data.disputes || []);
    } catch (err) {
      console.error('fetchDisputes error', err);
      setError('Unable to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (matchId, winner) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/matches/${matchId}/resolve-dispute`, { winner }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchDisputes();
    } catch (err) {
      console.error('resolveDispute error', err);
      alert('Failed to resolve dispute');
    } finally {
      setIsLoading(false);
    }
  };

  const visibleDisputes = disputes.map((match) => {
    const playerA = match.players?.[0]?.username || 'Player A';
    const playerB = match.players?.[1]?.username || 'Player B';
    const screenshotA = match.paymentScreenshots?.[0]?.image || '';
    const screenshotB = match.paymentScreenshots?.[1]?.image || '';
    return {
      id: match._id,
      matchId: match._id,
      playerA,
      playerB,
      screenshotA,
      screenshotB,
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Disputes</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading disputes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Disputes</h1>
          <p className="text-sm text-[#EF4444] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Disputes</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {visibleDisputes.length} active dispute{visibleDisputes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {visibleDisputes.length > 0 ? (
        <div className="space-y-4">
          {visibleDisputes.map((dispute) => (
            <DisputeCard
              key={dispute.id}
              matchId={dispute.matchId}
              playerA={dispute.playerA}
              playerB={dispute.playerB}
              screenshotA={dispute.screenshotA}
              screenshotB={dispute.screenshotB}
              onResolve={(winner) => handleResolve(dispute.matchId, winner)}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">No active disputes</p>
          <p className="text-sm text-[#A1A1A1]">All matches resolved fairly</p>
        </div>
      )}
    </div>
  );
};
