import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Coins, Plus, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

export const WalletScreen = ({ user }) => {
  // Mock transaction data
  const transactions = [
    { id: 1, type: 'match_win', amount: 180, description: 'Match win bonus', date: '2024-01-15' },
    { id: 2, type: 'match_loss', amount: -50, description: 'Match entry fee', date: '2024-01-14' },
    { id: 3, type: 'deposit', amount: 500, description: 'Wallet deposit', date: '2024-01-13' },
    { id: 4, type: 'match_win', amount: 90, description: 'Match win bonus', date: '2024-01-12' },
  ];

  const getTransactionIcon = (type) => {
    switch (type) {
      case 'deposit':
      case 'match_win':
        return <ArrowDownLeft className="transaction-icon positive" />;
      case 'match_loss':
      case 'withdrawal':
        return <ArrowUpRight className="transaction-icon negative" />;
      default:
        return <Coins className="transaction-icon" />;
    }
  };

  const getTransactionColor = (type) => {
    return ['deposit', 'match_win'].includes(type) ? 'positive' : 'negative';
  };

  return (
    <div className="wallet-screen">
      {/* Balance Card */}
      <Card className="balance-card">
        <div className="balance-header">
          <Coins className="balance-icon" />
          <span className="balance-label">Current Balance</span>
        </div>
        <div className="balance-amount">
          ₹{user?.balance || 0}
        </div>
        <Button variant="secondary" className="add-money-btn">
          <Plus size={16} />
          Add Money
        </Button>
      </Card>

      {/* Quick Actions */}
      <Card className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <Button variant="primary" className="action-btn">
            <Plus size={16} />
            Deposit
          </Button>
          <Button variant="secondary" className="action-btn">
            <ArrowUpRight size={16} />
            Withdraw
          </Button>
        </div>
      </Card>

      {/* Transaction History */}
      <Card className="transactions-card">
        <h3>Transaction History</h3>
        <div className="transactions-list">
          {transactions.map((transaction) => (
            <div key={transaction.id} className="transaction-item">
              <div className="transaction-icon">
                {getTransactionIcon(transaction.type)}
              </div>
              <div className="transaction-details">
                <div className="transaction-description">
                  {transaction.description}
                </div>
                <div className="transaction-date">
                  {transaction.date}
                </div>
              </div>
              <div className={`transaction-amount ${getTransactionColor(transaction.type)}`}>
                {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Wallet Stats */}
      <Card className="wallet-stats">
        <h3>Statistics</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Deposited</span>
            <span className="stat-value">₹2,500</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Withdrawn</span>
            <span className="stat-value">₹1,200</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Wagered</span>
            <span className="stat-value">₹3,400</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Net Profit</span>
            <span className="stat-value positive">+₹1,080</span>
          </div>
        </div>
      </Card>
    </div>
  );
};