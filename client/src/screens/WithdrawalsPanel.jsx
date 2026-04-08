import { useState } from 'react';
import { WithdrawalCard } from '../admin/AdminComponents';

export const WithdrawalsPanel = () => {
  const [withdrawals, setWithdrawals] = useState([
    {
      id: 1,
      username: 'ninja_gamer',
      amount: 5000,
      method: 'UPI',
      details: 'ninja.gamer@upi',
      requestedAt: '2:30 PM today',
      status: 'pending',
    },
    {
      id: 2,
      username: 'alpha_pro',
      amount: 10000,
      method: 'Bank Transfer',
      details: 'ICIC0000123 | 1234567890',
      requestedAt: '1:15 PM today',
      status: 'pending',
    },
    {
      id: 3,
      username: 'lucky_strike',
      amount: 2500,
      method: 'UPI',
      details: 'lucky.strike@paytm',
      requestedAt: '11:45 AM today',
      status: 'pending',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState('pending');

  const handleApprove = async (id) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setWithdrawals((prev) =>
        prev.map((w) =>
          w.id === id ? { ...w, status: 'approved' } : w
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this withdrawal? User will be notified and funds returned.')) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setWithdrawals((prev) =>
          prev.map((w) =>
            w.id === id ? { ...w, status: 'rejected' } : w
          )
        );
      } finally {
        setIsLoading(false);
      }
    }
  };

  const filteredWithdrawals = withdrawals.filter(
    (w) => filterStatus === 'all' || w.status === filterStatus
  );

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
              key={withdrawal.id}
              id={withdrawal.id}
              username={withdrawal.username}
              amount={withdrawal.amount}
              method={withdrawal.method}
              details={withdrawal.details}
              requestedAt={withdrawal.requestedAt}
              onApprove={() => handleApprove(withdrawal.id)}
              onReject={() => handleReject(withdrawal.id)}
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
