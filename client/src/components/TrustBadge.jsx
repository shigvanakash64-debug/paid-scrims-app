import { Shield } from 'lucide-react';

export const TrustBadge = ({ score, size = 'sm' }) => {
  const getTrustLevel = (score) => {
    if (score >= 80) return { level: 'high', color: 'green', label: 'Trusted' };
    if (score >= 40) return { level: 'medium', color: 'yellow', label: 'Good' };
    return { level: 'low', color: 'red', label: 'Low Trust' };
  };

  const { level, color, label } = getTrustLevel(score);

  return (
    <div className={`trust-badge trust-${level} trust-${size}`}>
      <Shield size={size === 'sm' ? 12 : 16} />
      <span>{score}</span>
    </div>
  );
};