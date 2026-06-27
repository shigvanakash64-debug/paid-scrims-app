import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export const WalletScreen = ({ user, onUserUpdate }) => {
  const [balance, setBalance] = useState(user?.wallet?.balance || 0);
  const [bonusBalance, setBonusBalance] = useState(user?.wallet?.bonusBalance || 0);
  const [referralEarningsBalance, setReferralEarningsBalance] = useState(user?.wallet?.referralEarningsBalance || 0);
  const [referralCode, setReferralCode] = useState(user?.wallet?.referralCode || '');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit');
  const [withdrawalAmount, setRedeemalAmount] = useState('');
  const [withdrawalUpi, setRedeemalUpi] = useState('');
  const [withdrawalWallet, setRedeemalWallet] = useState('main');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositUtr, setDepositUtr] = useState('');
  const [payerName, setPayerName] = useState('');
  const [depositUpiInfo, setDepositUpiInfo] = useState({ upi: '', upis: [] });
  const [depositLoading, setDepositLoading] = useState(false);
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setRedeemals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    deposits: false,
    withdrawals: false,
    transactions: false,
  });

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      const [meResponse, depositResponse, withdrawalResponse, upiResponse] = await Promise.all([
        axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/deposits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/deposit-upi`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData = meResponse.data.user;
      setBalance(userData.wallet?.balance || 0);
      setBonusBalance(userData.wallet?.bonusBalance || 0);
      setReferralEarningsBalance(userData.wallet?.referralEarningsBalance || 0);
      setReferralCode(userData.wallet?.referralCode || '');
      setTransactions(userData.wallet?.transactions || []);
      setDeposits(depositResponse.data.deposits || []);
      setRedeemals(withdrawalResponse.data.withdrawals || []);
      setDepositUpiInfo({ upi: upiResponse.data.upi || '', upis: upiResponse.data.upis || [] });
      onUserUpdate(userData);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    }
  };

  const sortByDateDesc = (items, dateKey) =>
    [...items].sort((a, b) => new Date(b[dateKey] || b.createdAt || b.timestamp || 0) - new Date(a[dateKey] || a.createdAt || a.timestamp || 0));

  const sortedDeposits = sortByDateDesc(deposits, 'requestedAt');
  const sortedRedeemals = sortByDateDesc(withdrawals, 'requestedAt');
  const sortedTransactions = sortByDateDesc(transactions, 'timestamp').filter(Boolean);

  const visibleDeposits = expandedSections.deposits ? sortedDeposits.slice(0, 50) : sortedDeposits.slice(0, 10);
  const visibleRedeemals = expandedSections.withdrawals ? sortedRedeemals.slice(0, 50) : sortedRedeemals.slice(0, 10);
  const visibleTransactions = expandedSections.transactions ? sortedTransactions.slice(0, 100) : sortedTransactions.slice(0, 10);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleRedeemalRequest = async () => {
    if (!withdrawalUpi?.trim()) {
      setMessage('Please enter your UPI ID');
      return;
    }

    const amount = parseFloat(withdrawalAmount);

    if (!withdrawalAmount || amount < 100) {
      setMessage('Minimum redemption amount is CZ100');
      return;
    }

    const selectedBalance = withdrawalWallet === 'referral' ? referralEarningsBalance : balance;

    if (amount > selectedBalance) {
      setMessage(`Insufficient ${withdrawalWallet === 'referral' ? 'referral earnings' : 'main wallet'} balance`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/wallet/withdraw`, {
        amount,
        upi: withdrawalUpi.trim(),
        wallet: withdrawalWallet,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Redemption request submitted successfully. Admin approval required.');
      setRedeemalAmount('');
      setRedeemalUpi('');
      setRedeemalWallet('main');
      fetchWalletData(); // Refresh data
    } catch (error) {
      setMessage(error.response?.data?.error || 'Failed to submit redemption request');
    } finally {
      setLoading(false);
    }
  };

  const getDisplayReferralCode = () => {
    if (referralCode) return referralCode;
    const username = String(user?.username || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '');
    return username ? `${username}CZ` : '';
  };

  const copyReferralCode = async () => {
    const code = getDisplayReferralCode();
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Referral code copied');
    } catch (error) {
      setMessage('Unable to copy referral code');
    }
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (!depositAmount || amount <= 0) {
      setMessage('Please enter a valid deposit amount');
      return;
    }
    if (amount < 5) {
      setMessage('Minimum deposit amount is CZ5');
      return;
    }
    if (!depositUtr.trim() || depositUtr.trim().length < 6) {
      setMessage('Please enter a valid UTR number');
      return;
    }
    if (!payerName.trim()) {
      setMessage('Please enter the payer full name');
      return;
    }

    setDepositLoading(true);
    setMessage('');
    try {
      const token = localStorage.getItem('clutchzone_token');
      await axios.post(`${API_BASE}/wallet/deposit-request`, {
        amount,
        utr: depositUtr.trim(),
        payerName: payerName.trim(),
      }, { headers: { Authorization: `Bearer ${token}` } });

      setMessage('✅ Deposit request submitted. Admin will verify it and credit your wallet.');
      setDepositAmount('');
      setDepositUtr('');
      setPayerName('');
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
        <p className="text-sm text-[#A1A1A1] mt-2">Manage your earnings and redemptions</p>
      </div>

      <div className="wallet-top-cards">
        <div className="wallet-small-card wallet-small-card--success">
          <div className="wallet-small-card-label">2% CASHBACK</div>
          <div className="wallet-small-card-title">Get 2% cashback on every match entry</div>
          <div className="wallet-small-card-action">Use cashback to play more matches</div>
        </div>
        <div className="wallet-small-card wallet-small-card--accent">
          <div className="wallet-small-card-label">REFER & EARN</div>
          <div className="wallet-small-card-title">Refer your friends and earn 20% commission</div>
          <div className="wallet-small-card-action">On lifetime platform fees</div>
        </div>
      </div>

      <div className="wallet-balance-card rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <div className="wallet-balance-card-top text-center">
          <div className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1] mb-2">Current Balance</div>
          <div className="text-5xl font-bold text-[#FF6A00] mb-3">CZ - {balance.toLocaleString()}</div>
          <div className="text-sm text-[#A1A1A1]">Available for redemption</div>
        </div>

        <div className="wallet-balance-grid mt-6">
          <div className="wallet-balance-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Bonus Balance</div>
            <div className="mt-2 text-lg font-semibold text-white">CZ - {bonusBalance.toLocaleString()}</div>
          </div>
          <div className="wallet-balance-metric">
            <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Referral Earnings</div>
            <div className="mt-2 text-lg font-semibold text-white">CZ - {referralEarningsBalance.toLocaleString()}</div>
          </div>
        </div>

        <div className="wallet-referral-card mt-5">
          <div>
            <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Referral Code</div>
            <div className="mt-2 text-lg font-semibold text-white">{getDisplayReferralCode() || 'Generating...'}</div>
          </div>
          <button className="wallet-copy-btn" type="button" onClick={copyReferralCode}>COPY</button>
        </div>
      </div>

      {/* Deposit / Redemption Tabs */}
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
              Redeem
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
              <label className="block text-sm text-[#A1A1A1] mb-2">Amount 1 CZ = to 1 RS</label>
              <div className="flex gap-2 mb-2">
                {[30,50,150,300].map((amt) => (
                  <button key={amt} onClick={() => setDepositAmount(String(amt))} className="px-3 py-2 rounded-lg bg-[#0B0B0B] border border-[#2A2A2A] text-sm text-white">CZ - {amt}</button>
                ))}
              </div>
              <p className="text-xs text-[#A1A1A1] mb-2">Minimum: CZ - 5</p>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter deposit amount"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
                min="1"
              />
            </div>
            <div className="rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] p-4 text-sm text-[#E5E7EB] space-y-2">
              <div className="text-xs uppercase tracking-[0.18em] text-[#A1A1A1]">Current Deposit UPI</div>
              <div className="text-base font-semibold text-white">{depositUpiInfo.upi || 'Loading...'}</div>
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
              <label className="block text-sm text-[#A1A1A1] mb-2">Full Name of Payer</label>
              <input
                type="text"
                value={payerName}
                onChange={(e) => setPayerName(e.target.value)}
                placeholder="Enter payer full name"
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

            <div className="text-xs text-[#A1A1A1]">Admin verifies UTR, amount, and the payer name before your wallet is credited.</div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">Select Wallet</label>
              <div className="grid gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setRedeemalWallet('main')}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${withdrawalWallet === 'main' ? 'border-[#FF6A00] bg-[#1a0c00] text-white' : 'border-[#2A2A2A] bg-[#0B0B0B] text-[#A1A1A1]'}`}
                >
                  Main Wallet
                  <div className="mt-1 text-xs font-normal text-[#A1A1A1]">CZ - {balance.toLocaleString()}</div>
                </button>
                <button
                  type="button"
                  onClick={() => setRedeemalWallet('referral')}
                  className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${withdrawalWallet === 'referral' ? 'border-[#FF6A00] bg-[#1a0c00] text-white' : 'border-[#2A2A2A] bg-[#0B0B0B] text-[#A1A1A1]'}`}
                >
                  Referral Wallet
                  <div className="mt-1 text-xs font-normal text-[#A1A1A1]">CZ - {referralEarningsBalance.toLocaleString()}</div>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">UPI ID</label>
              <input
                type="text"
                value={withdrawalUpi}
                onChange={(e) => setRedeemalUpi(e.target.value)}
                placeholder="Enter UPI ID"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
              />
            </div>
            <div>
              <label className="block text-sm text-[#A1A1A1] mb-2">Amount</label>
              <input
                type="number"
                value={withdrawalAmount}
                onChange={(e) => setRedeemalAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-white outline-none focus:border-[#FF6A00]"
                min="100"
                max={balance}
              />
            </div>

            <button
              onClick={handleRedeemalRequest}
              disabled={loading || !withdrawalUpi || !withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > (withdrawalWallet === 'referral' ? referralEarningsBalance : balance)}
              className="w-full rounded-3xl bg-[#FF6A00] px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-black transition disabled:cursor-not-allowed disabled:opacity-40"
            >
              {loading ? 'Submitting...' : 'Request Redemption'}
            </button>

            <div className="mt-2 text-xs text-[#A1A1A1]">Note: Minimum redemption is CZ100 for either wallet. Redemptions require admin approval and may take 24-48 hours.</div>
          </div>
        )}
      </div>

      {/* Deposit History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Deposit History</h2>
        {sortedDeposits.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-6">No deposit requests yet</div>
        ) : (
          <div className="space-y-3">
            {visibleDeposits.map((deposit) => (
              <div key={deposit._id || deposit.depositId} className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">CZ - {Number(deposit.amount).toLocaleString()}</div>
                    <div className="text-xs text-[#A1A1A1]">UTR: {deposit.utr} • Payer: {deposit.payerName || 'N/A'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${deposit.status === 'approved' ? 'bg-[#022c0b] text-[#22C55E]' : deposit.status === 'rejected' ? 'bg-[#3d1c1c] text-[#EF4444]' : 'bg-[#2A2A2A] text-[#F59E0B]'}`}>{deposit.status}</span>
                </div>
                <div className="mt-2 text-xs text-[#A1A1A1]">Requested: {new Date(deposit.requestedAt).toLocaleString()}</div>
              </div>
            ))}
            {sortedDeposits.length > 10 && (
              <button
                type="button"
                onClick={() => toggleSection('deposits')}
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-sm font-semibold text-[#FF6A00]"
              >
                {expandedSections.deposits ? 'Show less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Redemption History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Redemption History</h2>
        {sortedRedeemals.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-6">No redemption requests yet</div>
        ) : (
          <div className="space-y-3">
            {visibleRedeemals.map((withdrawal) => (
              <div key={withdrawal._id} className="rounded-2xl border border-[#1F1F1F] bg-[#0B0B0B] p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-semibold">CZ - {Number(withdrawal.amount).toLocaleString()}</div>
                    <div className="text-xs text-[#A1A1A1]">UPI: {withdrawal.upi || '—'}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${withdrawal.status === 'approved' ? 'bg-[#022c0b] text-[#22C55E]' : withdrawal.status === 'rejected' ? 'bg-[#3d1c1c] text-[#EF4444]' : 'bg-[#2A2A2A] text-[#F59E0B]'}`}>{withdrawal.status}</span>
                </div>
                <div className="mt-2 text-xs text-[#A1A1A1]">Requested: {new Date(withdrawal.requestedAt || withdrawal.createdAt).toLocaleString()}</div>
                {withdrawal.processedAt && <div className="text-xs text-[#A1A1A1]">Processed: {new Date(withdrawal.processedAt).toLocaleString()}</div>}
              </div>
            ))}
            {sortedRedeemals.length > 10 && (
              <button
                type="button"
                onClick={() => toggleSection('withdrawals')}
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-sm font-semibold text-[#FF6A00]"
              >
                {expandedSections.withdrawals ? 'Show less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Transaction History */}
      <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Transaction History</h2>

        {sortedTransactions.length === 0 ? (
          <div className="text-[#A1A1A1] text-center py-8">No transactions yet</div>
        ) : (
          <div className="space-y-3">
            {visibleTransactions.map((transaction, index) => (
              <div key={`${transaction.type}-${transaction.timestamp || transaction.date || index}`} className="flex items-center justify-between p-3 rounded-lg bg-[#0B0B0B]">
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
                  {transaction.amount > 0 ? '+' : ''}CZ - {Math.abs(transaction.amount)}
                </div>
              </div>
            ))}
            {sortedTransactions.length > 10 && (
              <button
                type="button"
                onClick={() => toggleSection('transactions')}
                className="w-full rounded-2xl border border-[#2A2A2A] bg-[#0B0B0B] px-4 py-3 text-sm font-semibold text-[#FF6A00]"
              >
                {expandedSections.transactions ? 'Show less' : 'See more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

