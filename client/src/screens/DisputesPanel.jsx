import { useState, useEffect } from 'react';
import axios from 'axios';
import { DisputeCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const DisputesPanel = () => {
  const [disputes, setDisputes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  useEffect(() => {
    fetchDisputes();
  }, [page]);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/disputes?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.disputes || [];
      setDisputes(list);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: 0 });
      if (list.length === 0 && page > 1) setPage(page - 1);
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
      await fetchDisputes();
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
    const playerAId = (match.players?.[0]?._id || match.players?.[0]?.id || match.players?.[0])?.toString();
    const playerBId = (match.players?.[1]?._id || match.players?.[1]?.id || match.players?.[1])?.toString();
    const paymentProofs = match.paymentScreenshots || [];
    const resultProofs = match.result?.screenshots || [];

    const proofMap = new Map();
    [...resultProofs, ...paymentProofs].forEach((proof) => {
      const userId = (proof?.user?._id || proof?.user?.id || proof?.user)?.toString();
      if (userId) {
        proofMap.set(userId, proof.image);
      }
    });

    const screenshotA = proofMap.get(playerAId) || resultProofs.find((proof) => (proof?.user?._id || proof?.user?.id || proof?.user)?.toString() === playerAId)?.image || paymentProofs.find((proof) => (proof?.user?._id || proof?.user?.id || proof?.user)?.toString() === playerAId)?.image || resultProofs[0]?.image || paymentProofs[0]?.image || '';
    const screenshotB = proofMap.get(playerBId) || resultProofs.find((proof) => (proof?.user?._id || proof?.user?.id || proof?.user)?.toString() === playerBId)?.image || paymentProofs.find((proof) => (proof?.user?._id || proof?.user?.id || proof?.user)?.toString() === playerBId)?.image || resultProofs[1]?.image || paymentProofs[1]?.image || '';

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
          {pagination.total} active dispute{pagination.total !== 1 ? 's' : ''}
        </p>
      </div>

      {visibleDisputes.length > 0 ? (
        <>
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
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 py-3">
              <span className="text-sm text-[#A1A1A1]">Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
                  disabled={page <= 1 || loading}
                  className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm text-[#A1A1A1] disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((currentPage) => Math.min(currentPage + 1, pagination.pages))}
                  disabled={page >= pagination.pages || loading}
                  className="rounded-lg border border-[#1F1F1F] px-3 py-2 text-sm text-[#A1A1A1] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
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
