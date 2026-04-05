import { Card } from '../components/Card';
import { TrustBadge } from '../components/TrustBadge';
import { User, Trophy, Target, AlertTriangle, TrendingUp } from 'lucide-react';

export const ProfileScreen = ({ user }) => {
  if (!user) {
    return (
      <div className="profile-screen">
        <Card>
          <div className="loading-state">
            <h2>Loading Profile...</h2>
          </div>
        </Card>
      </div>
    );
  }

  const winRate = user.matchesPlayed > 0
    ? Math.round((user.matchesWon / user.matchesPlayed) * 100)
    : 0;

  const trustLevel = user.trustScore >= 80 ? 'high' : user.trustScore >= 40 ? 'medium' : 'low';

  return (
    <div className="profile-screen">
      {/* Profile Header */}
      <Card className="profile-header">
        <div className="profile-avatar">
          <User size={48} />
        </div>
        <div className="profile-info">
          <h2>{user.username}</h2>
          <TrustBadge score={user.trustScore} size="lg" />
          <span className={`trust-label trust-${trustLevel}`}>
            {trustLevel === 'high' ? 'Trusted Player' :
             trustLevel === 'medium' ? 'Good Standing' : 'Low Trust'}
          </span>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="stats-grid">
        <Card className="stat-card">
          <Trophy className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{user.matchesWon}</span>
            <span className="stat-label">Wins</span>
          </div>
        </Card>

        <Card className="stat-card">
          <Target className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{user.matchesPlayed - user.matchesWon}</span>
            <span className="stat-label">Losses</span>
          </div>
        </Card>

        <Card className="stat-card">
          <TrendingUp className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{winRate}%</span>
            <span className="stat-label">Win Rate</span>
          </div>
        </Card>

        <Card className="stat-card">
          <AlertTriangle className="stat-icon" />
          <div className="stat-content">
            <span className="stat-value">{user.disputesRaised}</span>
            <span className="stat-label">Disputes</span>
          </div>
        </Card>
      </div>

      {/* Trust Score Breakdown */}
      <Card className="trust-breakdown">
        <h3>Trust Score Breakdown</h3>
        <div className="trust-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${user.trustScore}%` }}
            ></div>
          </div>
          <div className="progress-labels">
            <span>0</span>
            <span>100</span>
          </div>
        </div>

        <div className="trust-factors">
          <div className="factor-item">
            <span className="factor-label">Matches Completed</span>
            <span className="factor-value positive">+{user.matchesPlayed * 5}</span>
          </div>
          <div className="factor-item">
            <span className="factor-label">Disputes Lost</span>
            <span className="factor-value negative">-{user.disputesRaised * 15}</span>
          </div>
          <div className="factor-item">
            <span className="factor-label">Valid Submissions</span>
            <span className="factor-value positive">+{Math.max(0, user.matchesPlayed - user.disputesRaised) * 10}</span>
          </div>
        </div>
      </Card>

      {/* Account Status */}
      <Card className="account-status">
        <h3>Account Status</h3>
        <div className="status-items">
          <div className="status-item">
            <span className="status-label">Account Status</span>
            <span className="status-value active">Active</span>
          </div>
          <div className="status-item">
            <span className="status-label">Member Since</span>
            <span className="status-value">January 2024</span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Activity</span>
            <span className="status-value">2 hours ago</span>
          </div>
        </div>
      </Card>

      {/* Trust Score Info */}
      <Card className="trust-info">
        <h3>How Trust Score Works</h3>
        <div className="info-list">
          <div className="info-item">
            <span className="info-bullet positive">+</span>
            <span>Complete matches fairly (+5 points)</span>
          </div>
          <div className="info-item">
            <span className="info-bullet positive">+</span>
            <span>Both players agree on result (+10 points)</span>
          </div>
          <div className="info-item">
            <span className="info-bullet negative">-</span>
            <span>Lose a dispute (-15 points)</span>
          </div>
          <div className="info-item">
            <span className="info-bullet negative">-</span>
            <span>Submit conflicting results (-10 points)</span>
          </div>
        </div>
      </Card>
    </div>
  );
};