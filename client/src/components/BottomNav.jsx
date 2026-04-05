import { Home, Swords, Upload, Wallet, User } from 'lucide-react';

export const BottomNav = ({ currentScreen, onScreenChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'match', label: 'Match', icon: Swords },
    { id: 'result', label: 'Result', icon: Upload },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            className={`nav-item ${currentScreen === item.id ? 'active' : ''}`}
            onClick={() => onScreenChange(item.id)}
          >
            <Icon size={20} />
            <span className="nav-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};