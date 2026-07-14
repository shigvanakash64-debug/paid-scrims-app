export const StoreFooter = ({ onNavigate }) => {
  const links = [
    { key: 'wallpaper-home', label: 'Home', screen: 'wallpaper-home' },
    { key: 'wallpaper-collection', label: 'Collection', screen: 'wallpaper-collection' },
    { key: 'about-us', label: 'About Us', screen: 'about-us' },
    { key: 'login', label: 'Login', screen: 'login' },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__brand">
          <div className="site-footer__title">CLUTCH ZONE</div>
          <div className="site-footer__tagline">Wallpapers for your setup.</div>
          <div className="site-footer__meta">Discover premium visuals in a lightweight store experience.</div>
        </div>

        <div className="site-footer__links">
          <div className="site-footer__links-title">Store Links</div>
          <div className="site-footer__link-list">
            {links.map((link) => (
              <button
                key={link.key}
                type="button"
                className="site-footer__link"
                onClick={() => onNavigate?.(link.screen)}
              >
                {link.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">© 2026 Clutch Zone Wallpapers.</div>
    </footer>
  );
};
