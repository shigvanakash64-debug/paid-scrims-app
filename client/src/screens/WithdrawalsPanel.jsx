import { useState, useEffect } from 'react';
import axios from 'axios';
import { WithdrawalCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const WithdrawalsPanel = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/withdrawals?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWithdrawals(response.data.withdrawals);
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
      fetchWithdrawals();
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
        fetchWithdrawals();
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
          {withdrawals.filter((w) => w.status === 'pending').length} pending •{' '}
          {withdrawals.filter((w) => w.status === 'approved').length} approved
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['pending', 'approved', 'rejected', 'all'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
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
              method="UPI" // Default method, could be expanded later
              details={`User ID: ${withdrawal.userId}`}
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">PENDING AMOUNT</p>
          <p className="text-2xl font-bold text-[#F59E0B] mt-2">
            ₹{withdrawals
              .filter((w) => w.status === 'pending')
              .reduce((sum, w) => sum + w.amount, 0)}
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">APPROVED TOTAL</p>
          <p className="text-2xl font-bold text-[#22C55E] mt-2">
            ₹{withdrawals
              .filter((w) => w.status === 'approved')
              .reduce((sum, w) => sum + w.amount, 0)}
          </p>
        </div>
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4">
          <p className="text-xs text-[#A1A1A1]">REJECTED TOTAL</p>
          <p className="text-2xl font-bold text-[#EF4444] mt-2">
            ₹{withdrawals
              .filter((w) => w.status === 'rejected')
              .reduce((sum, w) => sum + w.amount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};
