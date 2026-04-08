import { useState } from 'react';
import { PaymentStatusCard } from '../admin/AdminComponents';

export const PaymentsPanel = () => {
  const [payments, setPayments] = useState([
    {
      id: 1,
      matchId: 1024,
      player: 'gamer_x',
      isPaid: false,
      amount: 500,
      screenshot: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23A1A1A1%22%3EPayment Proof%3C/text%3E%3C/svg%3E',
      requestedAt: '2:15 PM',
    },
    {
      id: 2,
      matchId: 1022,
      player: 'lucky_strike',
      isPaid: false,
      amount: 500,
      screenshot: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23A1A1A1%22%3EPayment Proof%3C/text%3E%3C/svg%3E',
      requestedAt: '1:45 PM',
    },
    {
      id: 3,
      matchId: 1022,
      player: 'king_of_games',
      isPaid: false,
      amount: 500,
      screenshot: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22400%22 height=%22300%22%3E%3Crect fill=%22%23111111%22 width=%22400%22 height=%22300%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2220%22 fill=%22%23A1A1A1%22%3EPayment Proof%3C/text%3E%3C/svg%3E',
      requestedAt: '1:45 PM',
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const handleApprove = async (id) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      setPayments((prev) => prev.filter((p) => p.id !== id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (id) => {
    if (window.confirm('Reject this payment? Player will need to resubmit.')) {
      setIsLoading(true);
      try {
        await new Promise((resolve) => setTimeout(resolve, 500));
        setPayments((prev) => prev.filter((p) => p.id !== id));
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Payments</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {payments.length} pending verification
        </p>
      </div>

      {/* Pending Payments */}
      {payments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payments.map((payment) => (
            <PaymentStatusCard
              key={payment.id}
              player={payment.player}
              isPaid={payment.isPaid}
              screenshotUrl={payment.screenshot}
              onApprove={() => handleApprove(payment.id)}
              onReject={() => handleReject(payment.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">All payments verified!</p>
          <p className="text-sm text-[#A1A1A1]">No pending payment verifications</p>
        </div>
      )}

      {/* Verified Payments History */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-white">Verified Today</h2>
        <div className="space-y-2">
          {[
            { player: 'john_doe', match: 1025, amount: 500, time: '12:30 PM' },
            { player: 'alpha_pro', match: 1025, amount: 500, time: '12:30 PM' },
            { player: 'ninja_gamer', match: 1023, amount: 500, time: '11:15 AM' },
          ].map((item, idx) => (
            <div key={idx} className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">{item.player}</p>
                <p className="text-xs text-[#A1A1A1]">Match #{item.match}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-[#22C55E]">₹{item.amount}</p>
                <p className="text-xs text-[#A1A1A1]">{item.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
