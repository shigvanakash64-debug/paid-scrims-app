import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const parseQueryParams = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    orderId: params.get('order_id') || params.get('orderId') || null,
    orderToken: params.get('order_token') || params.get('orderToken') || null,
    paymentId: params.get('payment_id') || params.get('paymentId') || null,
    paymentSessionId: params.get('payment_session_id') || params.get('paymentSessionId') || null,
    rawParams: Object.fromEntries(params.entries()),
  };
};

export const PaymentStatusScreen = ({ user, onNavigate }) => {
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Verifying your payment... Please wait.');
  const [amount, setAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [hasTried, setHasTried] = useState(false);
  const [params, setParams] = useState({});

  const verifyOrder = async (orderId) => {
    const token = localStorage.getItem('clutchzone_token');
    if (!token) {
      setStatus('failed');
      setMessage('Please log in again to verify your payment.');
      return;
    }

    try {
      setStatus('loading');
      setMessage('Verifying your payment... Please wait.');

      const response = await axios.post(
        `${API_BASE}/wallet/cashfree-verify`,
        { orderId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data;
      if (data.success) {
        setStatus('success');
        setMessage(data.alreadyCredited ? 'Payment has already been credited to your wallet.' : 'Payment successful. Wallet credited successfully.');
        setAmount(data.amount || 0);
        setWalletBalance(data.walletBalance ?? null);
        setTransactionId(data.transactionId || null);
        setHasTried(true);
      } else {
        setStatus('failed');
        setMessage(data.message || 'Payment verification failed.');
      }
    } catch (error) {
      console.error('PaymentStatusScreen verifyOrder error', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Payment verification failed.';
      setStatus(error.response?.data?.success === false ? 'failed' : 'failed');
      setMessage(errorMessage);
    }
  };

  useEffect(() => {
    const parsed = parseQueryParams();
    setParams(parsed);

    if (!parsed.orderId) {
      setStatus('failed');
      setMessage('Missing order_id in the URL. Please retry the payment or contact support.');
      return;
    }

    void verifyOrder(parsed.orderId);
  }, []);

  useEffect(() => {
    if (status === 'success') {
      const timer = setTimeout(() => {
        onNavigate('wallet');
      }, 3000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [status, onNavigate]);

  const handleRetry = () => {
    if (!params.orderId) return;
    setIsRetrying(true);
    void verifyOrder(params.orderId).finally(() => setIsRetrying(false));
  };

  const handleReturn = () => {
    onNavigate('wallet');
  };

  const isLoading = status === 'loading';

  return (
    <div className="space-y-6 px-4 py-6">
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.25)]">
        {status === 'success' ? (
          <div className="space-y-4">
            <div className="text-5xl">✅</div>
            <h1 className="text-3xl font-semibold text-white">Payment Successful</h1>
            <p className="text-[#A1A1A1]">Wallet credited successfully.</p>
            <div className="rounded-3xl bg-[#0B0B0B] p-4 text-left">
              <div className="text-sm text-[#A1A1A1]">Amount Added</div>
              <div className="text-3xl font-bold text-[#FF6A00]">₹{Number(amount).toLocaleString()}</div>
            </div>
            <div className="rounded-3xl bg-[#0B0B0B] p-4 text-left">
              <div className="text-sm text-[#A1A1A1]">New Wallet Balance</div>
              <div className="text-3xl font-bold text-white">CZ {walletBalance !== null ? Number(walletBalance).toLocaleString() : '—'}</div>
            </div>
            <p className="text-sm text-[#A1A1A1]">Redirecting to your wallet in 3 seconds...</p>
            <button
              type="button"
              onClick={handleReturn}
              disabled={isLoading}
              className="mt-4 inline-flex items-center justify-center rounded-2xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
            >
              Return to Wallet
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl">{status === 'loading' ? '⏳' : '❌'}</div>
            <h1 className="text-3xl font-semibold text-white">
              {status === 'loading' ? 'Verifying your payment...' : 'Payment Failed'}
            </h1>
            <p className="text-[#A1A1A1]">{message}</p>
            <div className="rounded-3xl bg-[#0B0B0B] p-4 text-left text-sm text-[#A1A1A1]">
              <div>Order ID: {params.orderId || 'Unavailable'}</div>
              {params.paymentId && <div>Payment ID: {params.paymentId}</div>}
              {params.orderToken && <div>Order Token: {params.orderToken}</div>}
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={handleRetry}
                disabled={isLoading || !params.orderId}
                className="rounded-2xl bg-[#FF6A00] px-6 py-3 text-sm font-semibold text-black disabled:opacity-50"
              >
                Retry Verification
              </button>
              <button
                type="button"
                onClick={handleReturn}
                className="rounded-2xl border border-[#2A2A2A] bg-transparent px-6 py-3 text-sm font-semibold text-white"
              >
                Return to Wallet
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
