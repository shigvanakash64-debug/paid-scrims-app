import { useState, useEffect } from 'react';
import axios from 'axios';
import { WithdrawalCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WithdrawalsPanel = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [summary, setSummary] = useState({
    pending: { count: 0, amount: 0 },
    approved: { count: 0, amount: 0 },
    rejected: { count: 0, amount: 0 },
  });

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus, page]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/withdrawals?status=${filterStatus}&page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = response.data.withdrawals || [];
      setWithdrawals(list);
      setPagination(response.data.pagination || { page: 1, pages: 1, total: list.length });
      setSummary(response.data.summary || summary);
      if (list.length === 0 && page > 1) setPage(page - 1);
    } catch (error) {
      setError('Failed to fetch withdrawals');
      console.error('Failed to fetch withdrawals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (withdrawalId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/withdrawals/${withdrawalId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Refresh the list
      await fetchWithdrawals();
    } catch (error) {
      alert('Failed to approve withdrawal');
      console.error('Failed to approve withdrawal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (withdrawalId) => {
    if (window.confirm('Reject this withdrawal? User will be notified and funds returned.')) {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('clutchzone_token');
        await axios.post(`${API_BASE}/admin/withdrawals/${withdrawalId}/reject`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Refresh the list
        await fetchWithdrawals();
      } catch (error) {
        alert('Failed to reject withdrawal');
        console.error('Failed to reject withdrawal:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredWithdrawals = withdrawals.filter(
    (w) => filterStatus === 'all' || w.status === filterStatus
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
          <p className="text-sm text-red-400 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Withdrawals</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {summary.pending.count} pending • {summary.approved.count} approved
        </p>
        <p className="text-xs text-[#F59E0B] mt-1">Minimum withdrawal is CZ100.</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => {
              setFilterStatus(status);
              setPage(1);
            }}
            className={`px-4 py-2 rounded-lg font-semibold text-sm whitespace-nowrap transition ${
              filterStatus === status
                ? 'bg-[#FF6A00] text-black'
                : 'border border-[#1F1F1F] text-[#A1A1A1] hover:border-[#FF6A00]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Withdrawals List */}
      {filteredWithdrawals.length > 0 ? (
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal) => (
            <WithdrawalCard
              key={withdrawal.withdrawalId}
              id={withdrawal.withdrawalId}
              username={withdrawal.username}
              amount={withdrawal.amount}
              method="UPI"
              details={`UPI: ${withdrawal.upi || 'N/A'} • User ID: ${withdrawal.userId}`}
              requestedAt={new Date(withdrawal.requestedAt).toLocaleString()}
              onApprove={() => handleApprove(withdrawal.withdrawalId)}
              onReject={() => handleReject(withdrawal.withdrawalId)}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">No {filterStatus} withdrawals</p>
          <p className="text-sm text-[#A1A1A1]">All clear!</p>
        </div>
      )}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between rounded-lg border border-[#1F1F1F] bg-[#111111] px-4 py-3">
          <span className="text-sm text-[#A1A1A1]">
            Page {pagination.page} of {pagination.pages} · {pagination.total} requests
          </span>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">PENDING AMOUNT</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-2">
            CZ{summary.pending.amount.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">APPROVED TOTAL</p>
          <p className="text-2xl font-bold text-[#22C55E] mt-2">
            CZ{summary.approved.amount.toLocaleString()}
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">REJECTED TOTAL</p>
          <p className="text-2xl font-bold text-[#EF4444] mt-2">
            CZ{summary.rejected.amount.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};
