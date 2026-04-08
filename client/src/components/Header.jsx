import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

export const Header = ({ user, onNavigate, onLogout }) => {
  const { user: currentUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const handleNavigate = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-hex"></div>
        <div className="logo-text">CLUTCH <span>ZONE</span></div>
      </div>
      <div className="topbar-right">
        {currentUser && (
          <>
            <div className="trust-badge">TG: {currentUser.trustScore}</div>
            {isAdmin && <div className="admin-badge">ADMIN</div>}
            <button className="menu-button" type="button" onClick={toggleMenu}>
              ☰
            </button>
            {menuOpen && (
              <div className="menu-popup">
                <button className="menu-item" type="button" onClick={() => handleNavigate('profile')}>
                  Profile
                </button>
                <button className="menu-item" type="button" onClick={() => handleNavigate('settings')}>
                  Settings
                </button>
                {isAdmin && (
                  <>
                    <div className="menu-divider" />
                    <button className="menu-item" type="button" onClick={() => handleNavigate('admin')} style={{ color: '#FF6A00', fontWeight: 'bold' }}>
                      Admin Dashboard
                    </button>
                  </>
                )}
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