export const BottomNav = ({ currentScreen, onScreenChange }) => {
  const navItems = [
    { id: 'home', label: 'Home', icon: '⌂' },
    { id: 'match', label: 'Match', icon: '⚔' },
    { id: 'result', label: 'Result', icon: '✓' },
    { id: 'pairing', label: 'Pairing', icon: '🔗' },
    { id: 'contacts', label: 'Contacts', icon: '☎' },
    { id: 'wallet', label: 'Wallet', icon: '💰' },
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <button
          key={item.id}
          className={`nav-tab ${currentScreen === item.id ? 'active' : ''}`}
          onClick={() => onScreenChange(item.id)}
          type="button"
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};