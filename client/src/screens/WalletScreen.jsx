import { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const AmountChip = ({ amount, selected, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(String(amount))}
    className={`rounded-2xl border px-4 py-3 text-sm font-semibold transition ${selected ? 'border-[#FF6A00] bg-[#FF6A00] text-black' : 'border-[#2A2A2A] bg-[#0B0B0B] text-white hover:border-[#FF6A00]'}`}
  >
    CZ {amount}
  </button>
);

const CheckoutSummaryCard = ({ amount }) => (
  <div className="rounded-3xl border border-[#2A2A2A] bg-[#0B0B0B] p-5 shadow-[0_18px_35px_rgba(0,0,0,0.25)]">
    <div className="flex items-center justify-between text-sm text-[#A1A1A1] mb-4">
      <span>Deposit Amount</span>
      <span className="font-semibold text-white">CZ {amount || 0}</span>
    </div>
    <div className="flex items-center justify-between text-sm text-[#A1A1A1] mb-4">
      <span>Platform Charges</span>
      <span className="font-semibold text-white">₹0</span>
    </div>
    <div className="border-t border-[#1F1F1F] pt-4 flex items-center justify-between text-lg font-semibold text-white">
      <span>Total Payable</span>
      <span>₹{amount || 0}</span>
    </div>
  </div>
);

const SecurityNoticeCard = () => (
  <div className="rounded-3xl border border-[#2A2A2A] bg-[#111111] p-4 text-sm text-[#A1A1A1]">
    <div className="font-semibold text-white mb-2">Security Notice</div>
    <ul className="list-disc space-y-2 pl-4 leading-6">
      <li>Payments are processed securely by Cashfree.</li>
      <li>Wallet is credited only after payment verification.</li>
      <li>Do not refresh or close the payment window until the transaction completes.</li>
    </ul>
  </div>
);

export const WalletScreen = ({ user, onUserUpdate }) => {
  const [balance, setBalance] = useState(user?.wallet?.balance || 0);
  const [bonusBalance, setBonusBalance] = useState(user?.wallet?.bonusBalance || 0);
  const [referralEarningsBalance, setReferralEarningsBalance] = useState(user?.wallet?.referralEarningsBalance || 0);
  const [referralCode, setReferralCode] = useState(user?.wallet?.referralCode || '');
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('deposit');
  const [withdrawalAmount, setRedeemalAmount] = useState('');
  const [withdrawalWallet, setRedeemalWallet] = useState('main');
  const [depositAmount, setDepositAmount] = useState('100');
  const [cashfreeLoading, setCashfreeLoading] = useState(false);
  const [cashfreeLoaded, setCashfreeLoaded] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState(false);
  const [depositSuccessAmount, setDepositSuccessAmount] = useState(0);
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
      const [meResponse, depositResponse, withdrawalResponse] = await Promise.all([
        axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/deposits`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE}/wallet/withdrawals`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const userData = meResponse.data.user;
      setBalance(userData.wallet?.balance || 0);
      setBonusBalance(userData.wallet?.bonusBalance || 0);
      setReferralEarningsBalance(userData.wallet?.referralEarningsBalance || 0);
      setReferralCode(userData.wallet?.referralCode || '');
      setTransactions(userData.wallet?.transactions || []);
      setDeposits(depositResponse.data.deposits || []);
      setRedeemals(withdrawalResponse.data.withdrawals || []);
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
        wallet: withdrawalWallet,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessage('Redemption request submitted successfully. Admin approval required.');
      setRedeemalAmount('');
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

  const cashfreeMode = import.meta.env.VITE_CASHFREE_ENV === 'TEST' ? 'sandbox' : 'production';

  useEffect(() => {
    const loadCashfreeSdk = async () => {
      if (window.Cashfree || window.cashfree) {
        setCashfreeLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.async = true;
      script.onload = () => {
        if (window.Cashfree) {
          window.cashfree = window.Cashfree;
          setCashfreeLoaded(true);
        } else if (window.cashfree) {
          setCashfreeLoaded(true);
        } else {
          setMessage('Unable to initialize Cashfree checkout.');
        }
      };
      script.onerror = () => setMessage('Unable to load Cashfree payment library.');
      document.body.appendChild(script);
    };

    loadCashfreeSdk();
  }, []);

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
    if (amount > 10000) {
      setMessage('Maximum deposit amount is CZ10000');
      return;
    }
    if (!cashfreeLoaded) {
      setMessage('Loading Cashfree checkout... please wait.');
      return;
    }

    setCashfreeLoading(true);
    setDepositSuccess(false);
    setMessage('Preparing secure checkout...');
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.post(`${API_BASE}/wallet/cashfree-order`, {
        amount,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const { data } = response.data;
      const paymentSessionId = data?.paymentSessionId;
      const orderId = data?.orderId;

      if (!paymentSessionId || !orderId) {
        throw new Error('Failed to create Cashfree payment session');
      }

      const cashfreeFactory = typeof window.Cashfree === 'function'
        ? window.Cashfree
        : typeof window.cashfree === 'function'
          ? window.cashfree
          : null;
      if (!cashfreeFactory) {
        throw new Error('Cashfree checkout library is not loaded');
      }

      // Use the environment returned by the backend (TEST / LIVE) when available
      // to prevent sandbox/production mismatches that make session IDs invalid.
      const sdkMode = (data?.environment === 'TEST') ? 'sandbox' : (data?.environment === 'LIVE' ? 'production' : cashfreeMode);

      const checkoutOptions = {
        paymentSessionId,
        mode: sdkMode,
        orderId,
        orderAmount: String(amount),
        orderCurrency: 'INR',
        returnUrl: window.location.href,
        redirectTarget: '_self',
      };

      const checkout = cashfreeFactory({ mode: sdkMode });
      const result = await checkout.checkout(checkoutOptions);

      if (result?.redirect) {
        setMessage('Redirecting to secure payment page...');
        return;
      }

      if (result?.paymentDetails) {
        setMessage('Payment completed, verifying transaction...');
        const verifyResponse = await axios.post(`${API_BASE}/wallet/cashfree-verify`, {
          orderId,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (verifyResponse.data?.success) {
          setMessage(`Deposit successful. Wallet credited with CZ ${amount}.`);
          setDepositSuccess(true);
          setDepositSuccessAmount(amount);
          fetchWalletData();
        } else {
          setMessage(verifyResponse.data?.message || 'Unable to verify payment. Wallet not credited yet.');
        }
      } else {
        setMessage('Payment was not completed. No wallet update was made.');
      }
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || error.message || 'Failed to start Cashfree payment');
    } finally {
      setCashfreeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-[#A1A1A1] mt-2">Manage your earnings and redemptions</p>
      </div>

      <div className="wallet-balance-card rounded-3xl border border-[#1F1F1F] bg-[#111111] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.35)]">
        <div className="wallet-balance-card-top text-center">
          <div className="text-sm uppercase tracking-[0.22em] text-[#A1A1A1] mb-2">Wallet Balance</div>
          <div className="text-5xl font-bold text-[#FF6A00] mb-3">CZ - {balance.toLocaleString()}</div>
          <div className="text-sm text-[#A1A1A1]">1 CZ = ₹1</div>
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
          <div className="space-y-5">
            <div className="rounded-3xl border border-[#1F1F1F] bg-[#111111] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
              <div className="text-sm uppercase tracking-[0.24em] text-[#A1A1A1] mb-4">Quick Amount</div>
              <div className="grid gap-3 sm:grid-cols-3">
                {[50, 100, 200, 500, 1000].map((amt) => (
                  <AmountChip
                    key={amt}
                    amount={amt}
                    selected={depositAmount === String(amt)}
                    onClick={setDepositAmount}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-[#A1A1A1]">Custom Amount</label>
                <span className="text-xs text-[#A1A1A1]">CZ 5 - CZ 10000</span>
              </div>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="Enter deposit amount"
                min="5"
                max="10000"
                className="w-full rounded-[16px] border border-[#2A2A2A] bg-[#0B0B0B] px-5 py-4 text-lg font-semibold text-white outline-none transition focus:border-[#FF6A00]"
              />
            </div>

            <CheckoutSummaryCard amount={Number(depositAmount) || 0} />

            <button
              onClick={handleDeposit}
              disabled={cashfreeLoading || !depositAmount || Number(depositAmount) < 5 || Number(depositAmount) > 10000 || !cashfreeLoaded}
              className="flex w-full items-center justify-center gap-3 rounded-[16px] bg-[#FF6A00] px-6 py-4 text-base font-semibold uppercase tracking-[0.18em] text-black transition hover:bg-[#ff9900] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cashfreeLoading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Preparing Secure Checkout...
                </>
              ) : (
                'Continue to Payment'
              )}
            </button>

            {depositSuccess && (
              <div className="rounded-3xl border border-[#22C55E] bg-[#062b0e] p-4 text-sm text-[#D9F99D]">
                <div className="font-semibold text-white">Deposit Successful</div>
                <div>Wallet credited with CZ {depositSuccessAmount}.</div>
              </div>
            )}

            <SecurityNoticeCard />
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
              disabled={loading || !withdrawalAmount || parseFloat(withdrawalAmount) < 100 || parseFloat(withdrawalAmount) > (withdrawalWallet === 'referral' ? referralEarningsBalance : balance)}
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
                    <div className="text-xs text-[#A1A1A1]">Order ID: {deposit.orderId || deposit._id}</div>
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

