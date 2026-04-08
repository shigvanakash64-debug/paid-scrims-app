import { useState, useEffect } from 'react';
import axios from 'axios';
import { PaymentStatusCard } from '../components/admin/AdminComponents';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const PaymentsPanel = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/admin/payments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.payments || []);
    } catch (err) {
      console.error('fetchPayments error', err);
      setError('Unable to load payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (matchId) => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/matches/${matchId}/verify-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      console.error('verifyPayment error', err);
      alert('Failed to verify payment');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (matchId) => {
    if (!window.confirm('Reject this payment? Player will need to resubmit.')) {
      return;
    }
    setIsLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/admin/matches/${matchId}/reject-payment`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchPayments();
    } catch (err) {
      console.error('rejectPayment error', err);
      alert('Failed to reject payment');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Loading pending payment verifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="text-sm text-[#EF4444] mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Payments</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">
          {payments.length} pending verification
        </p>
      </div>

      {payments.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {payments.map((payment) => {
            const player = Array.isArray(payment.players)
              ? payment.players.join(' vs ')
              : payment.player?.username || payment.player || 'Unknown Player';
            const screenshotUrl = payment.paymentScreenshots?.[0]?.image || payment.screenshotUrl || payment.paymentScreenshot || payment.screenshot || '';
            const matchId = payment.matchId || payment.match?._id || payment._id;
            return (
              <PaymentStatusCard
                key={matchId}
                player={player}
                isPaid={payment.isPaid ?? payment.paid ?? false}
                screenshotUrl={screenshotUrl}
                onApprove={() => handleApprove(matchId)}
                onReject={() => handleReject(matchId)}
                isLoading={isLoading}
              />
            );
          })}
        </div>
      ) : (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-lg p-12 text-center space-y-3">
          <p className="text-2xl">✓</p>
          <p className="text-lg font-semibold text-white">All payments verified!</p>
          <p className="text-sm text-[#A1A1A1]">No pending payment verifications</p>
        </div>
      )}
    </div>
  );
};
