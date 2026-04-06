export const WalletScreen = ({ user }) => {
  const transactions = user?.transactions || [];

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
        {transactions.length === 0 ? (
          <div className="txn-empty">No transactions to display.</div>
        ) : (
          transactions.map((txn) => (
            <div key={txn.id} className="txn-row">
              <div className="txn-left">
                <div className="txn-title">{txn.title}</div>
                <div className="txn-date">{txn.date}</div>
              </div>
              <div className={`txn-amount ${txn.type === 'credit' ? 'credit' : 'debit'}`}>
                {txn.type === 'credit' ? '+' : '-'}₹{Math.abs(txn.amount)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
