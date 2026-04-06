import { useState } from 'react';

export const Header = ({ user, onNavigate, onLogout }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const handleNavigate = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-hex"></div>
        <div className="logo-text">CLUTCH <span>ZONE</span></div>
      </div>
      <div className="topbar-right">
        {user && (
          <>
            <div className="wallet-pill"><span className="sym">₹</span><span className="amt">{user.balance}</span></div>
            <div className="trust-badge">TG: {user.trustScore}</div>
            <button className="menu-button" type="button" onClick={toggleMenu}>
              ☰
            </button>
            {menuOpen && (
              <div className="menu-popup">
                <button className="menu-item" type="button" onClick={() => handleNavigate('profile')}>
                  Profile
                </button>
                <button className="menu-item" type="button" onClick={() => handleNavigate('pairing')}>
                  Pairing
                </button>
                <button className="menu-item" type="button" onClick={() => handleNavigate('settings')}>
                  Settings
                </button>
                <div className="menu-divider" />
                <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); if (onLogout) onLogout(); }}>
                  Logout
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </header>
  );
};