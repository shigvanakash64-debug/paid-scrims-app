import { Trophy, Coins } from 'lucide-react';

export const Header = ({ user }) => {
  return (
    <header className="header">
      <div className="header-content">
        <div className="logo">
          <Trophy className="logo-icon" />
          <span className="logo-text">ScrimPro</span>
        </div>

        {user && (
          <div className="user-info">
            <div className="balance">
              <Coins size={16} />
              <span>₹{user.balance}</span>
            </div>
            <div className={`trust-badge trust-${user.trustScore >= 80 ? 'high' : user.trustScore >= 40 ? 'medium' : 'low'}`}>
              {user.trustScore}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};