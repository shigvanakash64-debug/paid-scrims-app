export const WalletScreen = ({ user }) => {
  const transactions = [
    { id: 1, title: 'Match Win vs GHOST_X99', date: 'Today · 2:14 PM', amount: 90, type: 'credit' },
    { id: 2, title: 'Entry Fee — 1v1', date: 'Today · 2:10 PM', amount: -50, type: 'debit' },
    { id: 3, title: 'Entry Fee — 1v1', date: 'Yesterday · 7:33 PM', amount: -50, type: 'debit' },
    { id: 4, title: 'Added Money', date: 'Apr 4 · 11:00 AM', amount: 500, type: 'credit' },
    { id: 5, title: 'Match Win vs SNIPER_KD', date: 'Apr 3 · 9:15 PM', amount: 180, type: 'credit' },
    { id: 6, title: 'Withdrawal', date: 'Apr 2 · 3:00 PM', amount: -1000, type: 'debit' }
  ];

  return (
    <div id="screen-wallet" className="screen-wallet">
      <div className="hero">
        <div className="screen-title">WALLET</div>
        <div className="screen-sub">Manage your funds</div>
      </div>
      <div className="balance-block">
        <div className="bal-label">Available Balance</div>
        <div className="bal-amount"><span className="sym">₹</span>{user?.balance ?? 0}</div>
        <div className="bal-actions">
          <button type="button" className="btn-primary" style={{ fontSize: '13px', letterSpacing: '2px', padding: '11px' }}>
            + ADD MONEY
          </button>
          <button type="button" className="btn-outline" style={{ fontSize: '13px', letterSpacing: '2px', padding: '11px' }}>
            WITHDRAW
          </button>
        </div>
      </div>
      <div style={{ padding: '0 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: '10px', letterSpacing: '3px', color: 'var(--dim)', textTransform: 'uppercase' }}>Transactions</span>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Last 30 days</span>
      </div>
      <div className="txn-list">
        {transactions.map((txn) => (
          <div key={txn.id} className="txn-row">
            <div className="txn-left">
              <div className="txn-title">{txn.title}</div>
              <div className="txn-date">{txn.date}</div>
            </div>
            <div className={`txn-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
              {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(txn.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
