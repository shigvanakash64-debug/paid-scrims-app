import { useState } from 'react';

export const StoreHeader = ({ user, currentScreen, onNavigate, onBack, canGoBack, onLogout, onOpenConfirmExit }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigate = (screen) => {
    setMenuOpen(false);
    if (onNavigate) onNavigate(screen);
  };

  const isAdmin = user?.role === 'admin' || user?.isAdmin === true;
  const navItems = [
    { key: 'wallpaper-home', label: 'Home', screen: 'wallpaper-home' },
    { key: 'wallpaper-collection', label: 'Collection', screen: 'wallpaper-collection' },
    { key: 'wallpaper-library', label: 'My Library', screen: 'wallpaper-library' },
    ...(isAdmin ? [{ key: 'wallpaper-manager', label: 'Wallpaper Admin', screen: 'wallpaper-manager' }] : []),
    { key: 'about-us', label: 'About Us', screen: 'about-us' },
  ];

  return (
    <header className="topbar" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {canGoBack && (
            <button className="back-button" type="button" onClick={onBack} aria-label="Go back">
              ←
            </button>
          )}
          <div className="logo">
            <div className="logo-hex"></div>
            <div className="logo-text">CLUTCH <span>ZONE</span></div>
          </div>
        </div>
        <div className="topbar-right">
          {user ? (
            <>
              <button className="menu-button" type="button" onClick={() => setMenuOpen((open) => !open)}>
                ☰
              </button>
              {menuOpen && (
                <div className="menu-popup">
                  <div className="menu-list">
                    <button className="menu-item" type="button" onClick={() => handleNavigate('wallpaper-home')}>Home</button>
                    <button className="menu-item" type="button" onClick={() => handleNavigate('wallpaper-collection')}>Collection</button>
                    <button className="menu-item" type="button" onClick={() => handleNavigate('wallpaper-library')}>My Library</button>
                    <button className="menu-item" type="button" onClick={() => handleNavigate('about-us')}>About Us</button>
                    {isAdmin && (
                      <>
                        <div className="menu-divider" />
                        <button className="menu-item" type="button" onClick={() => { setMenuOpen(false); if (onLogout) onLogout(); }}>
                          Logout
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="menu-button" type="button" onClick={() => handleNavigate('login')}>
              Login
            </button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
        {navItems.map((item) => {
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
      </div>
    </header>
  );
};
