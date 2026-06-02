import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WalletScreen = ({ user, onUserUpdate }) => {
  const [balance, setBalance] = useState(user?.wallet?.balance || 0);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit');
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [withdrawalUpi, setWithdrawalUpi] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const userData = response.data.user;
      setBalance(userData.wallet?.balance || 0);
      setTransactions(userData.wallet?.transactions || []);
      onUserUpdate(userData);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const handleWithdrawalRequest = async () => {
    if (!withdrawalUpi?.trim()) {
      setMessage('Please enter your UPI ID');
      return;
    }

    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      setMessage('Please enter a valid amount');
      return;
    }

    if (parseFloat(withdrawalAmount) > balance) {
      setMessage('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/match/withdraw`, {
        amount: parseFloat(withdrawalAmount),
        upi: withdrawalUpi.trim(),
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Withdrawal request submitted successfully. Admin approval required.');
      setWithdrawalAmount('');
      setWithdrawalUpi('');
      fetchWalletData(); // Refresh data
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit withdrawal request');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setMessage('Please enter a valid deposit amount');
      return;
    }

    setDepositLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('clutchzone_token');
      const amount = parseFloat(depositAmount);

      // Create Razorpay order via backend
      const orderResponse = await axios.post(`${API_BASE}/wallet/deposit-order`, {
        amount: Math.round(amount * 100), // convert to paise
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { order, key } = orderResponse.data;

      const options = {
        key,
        amount: order.amount,
        currency: order.currency,
        name: 'Paid Scrims',
        description: 'Wallet Topup',
        order_id: order.id,
        handler: async function (response) {
          try {
            // Verify payment on backend
            const verifyResponse = await axios.post(
              `${API_BASE}/wallet/confirm-deposit`,
              {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                amount,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data.success) {
              setMessage('✅ Deposit successful! Your wallet has been updated.');
              setDepositAmount('');
              fetchWalletData();
            }
          } catch (err) {
            console.error('Payment verification failed:', err);
            setMessage('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: { color: '#FF6A00' }
      };

      // Open Razorpay checkout
      if (window && window.Razorpay) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        setMessage('Razorpay SDK not loaded. Please refresh and try again.');
      }
    } catch (error) {
      console.error('Deposit failed', error);
      setMessage(error.response?.data?.error || 'Failed to initiate deposit. Please try again.');
    } finally {
      setDepositLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">Manage your earnings and withdrawals</p>
      </div>

      {/* Balance Card */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <div className="text-center">
          <div className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1] mb-2">Current Balance</div>
          <div className="text-4xl font-bold text-[#FF6A00] mb-4">₹{balance.toLocaleString()}</div>
          <div className="text-sm text-[#A1A1A1]">Available for withdrawal</div>
        </div>
      </div>

      {/* Deposit / Withdrawal Tabs */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">Wallet Actions</h2>
          <div className="flex rounded-full bg-[#0B0B0B] p-1">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'deposit' ? 'bg-[#FF6A00] text-black' : 'text-[#A1A1A1]'}`}
            >
              Deposit
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-4 py-2 rounded-full text-sm font-semibold ${activeTab === 'withdraw' ? 'bg-[#FF6A00] text-black' : 'text-[#A1A1A1]'}`}
            >
              Withdraw
            </button>
          </div>
        </div>

        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            message.includes('success') ? 'bg-[#022c0b] text-[#22C55E]' : 'bg-[#3d1c1c] text-[#EF4444]'
          }`}>
            {message}
          </div>
        )}

        {activeTab === 'deposit' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">Amount (INR)</label>
              <div className="flex gap-2 mb-2">
                {[50,150,300,500].map((amt) => (
                  <button key={amt} onClick={() => setDepositAmount(String(amt))} className="px-3 py-2 rounded-lg bg-[#0B0B0B] border border-[#2A2A2A] text-sm text-white">₹{amt}</button>
                ))}
              </div>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
                min="1"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full rounded-3xl bg-[#FF6A00] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {depositLoading ? 'Processing...' : 'Pay with Razorpay'}
            </button>

            <div className="text-xs text-[#A1A1A1]">🔒 Secured by Razorpay. Your transaction is encrypted and safe.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">UPI ID</label>
              <input
                type="text"
                value={withdrawalUpi}
                onChange={(e) => setWithdrawalUpi(e.target.value)}
                placeholder="Enter UPI ID"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">Amount</label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
                min="1"
                max={balance}
              />
            </div>

            <button
              onClick={handleWithdrawalRequest}
              disabled={loading || !withdrawalUpi || !withdrawalAmount || parseFloat(withdrawalAmount) > balance}
              className="w-full rounded-3xl bg-[#FF6A00] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Submitting...' : 'Request Withdrawal'}
            </button>

            <div className="mt-2 text-xs text-[#A1A1A1]">Note: Withdrawals require admin approval and may take 24-48 hours.</div>
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>

        {transactions.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-8">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {transactions.slice().reverse().map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0B0B]">
                <div>
                  <div className="text-sm text-white capitalize">
                    {transaction.type.replace('_', ' ')}
                  </div>
                  <div className="text-xs text-[#A1A1A1]">
                    {new Date(transaction.timestamp || transaction.date || Date.now()).toLocaleDateString()}
                  </div>
                  {transaction.description && (
                    <div className="text-xs text-[#A1A1A1]">{transaction.description}</div>
                  )}
                </div>
                <div className={`text-sm font-semibold ${
                  transaction.amount > 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

