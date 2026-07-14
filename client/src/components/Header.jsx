import { useState } from 'react';
import { useUser } from '../contexts/UserContext';

export const Header = ({ user, currentScreen, onNavigate, onLogout }) => {
  const { user: currentUser } = useUser();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((open) => !open);
  const handleNavigate = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.isAdmin === true;

  const menuItems = [
    { key: 'profile', label: 'Profile', screen: 'profile' },
    { key: 'inbox', label: `Inbox${currentUser?.notifications?.some((n) => !n.read) ? ` (${currentUser.notifications.filter((n) => !n.read).length})` : ''}`, screen: 'inbox' },
    { key: 'settings', label: 'Settings', screen: 'settings' },
    { key: 'privacy-policy', label: 'Privacy Policy', screen: 'privacy-policy' },
    { key: 'terms-conditions', label: 'Terms & Conditions', screen: 'terms-conditions' },
    { key: 'refund-policy', label: 'Refund Policy', screen: 'refund-policy' },
    { key: 'fair-play', label: 'Fair Play Policy', screen: 'fair-play' },
    { key: 'responsible-gaming', label: 'Responsible Gaming Policy', screen: 'responsible-gaming' },
    { key: 'contacts', label: 'Contacts', screen: 'contacts' },
    { key: 'instructions', label: 'Instructions', screen: 'instructions' },
  ];

  const wallpaperNavItems = [
    { key: 'wallpaper-home', label: 'Home', screen: 'wallpaper-home' },
    { key: 'wallpaper-collection', label: 'Collection', screen: 'wallpaper-collection' },
    { key: 'wallpaper-library', label: 'My Library', screen: 'wallpaper-library' },
    { key: 'about-us', label: 'About Us', screen: 'about-us' },
  ];

  return (
    <header className="topbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div className="logo">
          <div className="logo-hex"></div>
          <div className="logo-text">CLUTCH <span>ZONE</span></div>
        </div>
        <div className="topbar-right">
          {currentUser && (
            <>
              <div className="wallet-balance">CZ - {currentUser.wallet?.balance?.toLocaleString() || '0'}</div>
              <div className="trust-badge">TG: {currentUser.trustScore}</div>
              {isAdmin && <div className="admin-badge">ADMIN</div>}
              <button className="menu-button" type="button" onClick={toggleMenu}>
                ☰
              </button>
              {menuOpen && (
                <div className="menu-popup">
                  <div className="menu-list">
                    {menuItems.map((item) => (
                      <button key={item.key} className="menu-item" type="button" onClick={() => handleNavigate(item.screen)}>
                        {item.label}
                      </button>
                    ))}
                    {isAdmin && (
                      <>
                        <div className="menu-divider" />
                        <button className="menu-item" type="button" onClick={() => handleNavigate('admin')} style={{ color: '#FF6A00', fontWeight: 'bold' }}>
                          Admin Dashboard
                        </button>
                        <button className="menu-item" type="button" onClick={() => handleNavigate('wallpaper-manager')} style={{ color: '#FF6A00', fontWeight: 'bold' }}>
                          Wallpaper Manager
                        </button>
                      </>
                    )}
                    <div className="menu-divider" />
                    <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); if (onLogout) onLogout(); }}>
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {wallpaperNavItems.map((item) => {
          const isActive = currentScreen === item.screen;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavigate(item.screen)}
              style={{
                border: isActive ? '1px solid #FF6A00' : '1px solid #1F1F1F',
                background: isActive ? '#1a0c00' : 'transparent',
                color: isActive ? '#FF6A00' : '#F4F2EA',
                padding: '6px 10px',
                fontSize: 12,
                fontFamily: 'Rajdhani, sans-serif',
                letterSpacing: '1px',
                cursor: 'pointer',
              }}
            >
              {item.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => handleNavigate('home')}
          style={{
            border: '1px solid #FF6A00',
            background: 'transparent',
            color: '#FF6A00',
            padding: '6px 10px',
            fontSize: 12,
            fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '1px',
            cursor: 'pointer',
          }}
        >
          Enter Clutch Zone
        </button>
      </div>
    </header>
  );
};