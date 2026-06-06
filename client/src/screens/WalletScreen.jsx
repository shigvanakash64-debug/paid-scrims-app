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
  const [depositUtr, setDepositUtr] = useState('');
  const [depositMobileLast4, setDepositMobileLast4] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      const [meResponse, depositResponse, withdrawalResponse] = await Promise.all([
        axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/deposits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData = meResponse.data.user;
      setBalance(userData.wallet?.balance || 0);
      setTransactions(userData.wallet?.transactions || []);
      setDeposits(depositResponse.data.deposits || []);
      setWithdrawals(withdrawalResponse.data.withdrawals || []);
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

    const amount = parseFloat(withdrawalAmount);

    if (!withdrawalAmount || amount < 100) {
      setMessage('Minimum withdrawal amount is ₹100');
      return;
    }

    if (amount > balance) {
      setMessage('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/wallet/withdraw`, {
        amount,
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
    const amount = parseFloat(depositAmount);
    if (!depositAmount || amount <= 0) {
      setMessage('Please enter a valid deposit amount');
      return;
    }
    if (amount < 30) {
      setMessage('Minimum deposit amount is ₹30');
      return;
    }
    if (!depositUtr.trim() || depositUtr.trim().length < 6) {
      setMessage('Please enter a valid UTR number');
      return;
    }
    if (!depositMobileLast4.trim() || depositMobileLast4.trim().length < 4) {
      setMessage('Please enter the last 4 digits of the payer mobile number');
      return;
    }

    setDepositLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/wallet/deposit-request`, {
        amount,
        utr: depositUtr.trim(),
        mobileLast4: depositMobileLast4.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage('✅ Deposit request submitted. Admin will verify it and credit your wallet.');
      setDepositAmount('');
      setDepositUtr('');
      setDepositMobileLast4('');
      fetchWalletData();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit deposit request.');
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
                {[30,50,150,300].map((amt) => (
                  <button key={amt} onClick={() => setDepositAmount(String(amt))} className="px-3 py-2 rounded-lg bg-[#0B0B0B] border border-[#2A2A2A] text-sm text-white">₹{amt}</button>
                ))}
              </div>
              <p className="text-xs text-[#A1A1A1] mb-2">Minimum: ₹30</p>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">UTR Number</label>
              <input
                type="text"
                value={depositUtr}
                onChange={(e) => setDepositUtr(e.target.value.toUpperCase())}
                placeholder="Enter UTR number"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">Last 4 Digits of Payer Mobile</label>
              <input
                type="text"
                value={depositMobileLast4}
                onChange={(e) => setDepositMobileLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="5678"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
              />
            </div>

            <button
              onClick={handleDeposit}
              disabled={depositLoading || !depositAmount || parseFloat(depositAmount) <= 0}
              className="w-full rounded-3xl bg-[#FF6A00] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {depositLoading ? 'Submitting...' : 'Submit Deposit Request'}
            </button>

            <div className="text-xs text-[#A1A1A1]">Admin verifies UTR, amount, and last 4 digits before your wallet is credited.</div>
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
                min="100"
                max={balance}
              />
            </div>

            <button
              onClick={handleWithdrawalRequest}
              disabled={loading || !withdrawalUpi || !withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > balance}
              className="w-full rounded-3xl bg-[#FF6A00] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Submitting...' : 'Request Withdrawal'}
            </button>

            <div className="mt-2 text-xs text-[#A1A1A1]">Note: Withdrawals require admin approval and may take 24-48 hours.</div>
          </div>
        )}
      </div>

      {/* Deposit History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Deposit History</h2>
        {deposits.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-6">No deposit requests yet</div>
        ) : (
          <div className="space-y-3">
            {deposits.map((deposit) => (
              <div key={deposit._id || deposit.depositId} className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">₹{Number(deposit.amount).toLocaleString()}</div>
                    <div className="text-xs text-[#A1A1A1]">UTR: {deposit.utr} • Mobile: ****{deposit.mobileLast4}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${deposit.status === 'approved' ? 'bg-[#022c0b] text-[#22C55E]' : deposit.status === 'rejected' ? 'bg-[#3d1c1c] text-[#EF4444]' : 'bg-[#2A2A2A] text-[#F59E0B]'}`}>{deposit.status}</span>
                </div>
                <div className="mt-2 text-xs text-[#A1A1A1]">Requested: {new Date(deposit.requestedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-6">No withdrawal requests yet</div>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal._id} className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">₹{Number(withdrawal.amount).toLocaleString()}</div>
                    <div className="text-xs text-[#A1A1A1]">UPI: {withdrawal.upi || '—'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${withdrawal.status === 'approved' ? 'bg-[#022c0b] text-[#22C55E]' : withdrawal.status === 'rejected' ? 'bg-[#3d1c1c] text-[#EF4444]' : 'bg-[#2A2A2A] text-[#F59E0B]'}`}>{withdrawal.status}</span>
                </div>
                <div className="mt-2 text-xs text-[#A1A1A1]">Requested: {new Date(withdrawal.requestedAt || withdrawal.createdAt).toLocaleString()}</div>
                {withdrawal.processedAt && <div className="text-xs text-[#A1A1A1]">Processed: {new Date(withdrawal.processedAt).toLocaleString()}</div>}
              </div>
            ))}
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

