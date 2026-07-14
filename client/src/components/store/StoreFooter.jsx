export const StoreFooter = ({ onNavigate }) => {
  const quickLinks = [
    { key: 'wallpaper-home', label: 'Home', screen: 'wallpaper-home' },
    { key: 'about-us', label: 'About Us', screen: 'about-us' },
    { key: 'contact-us', label: 'Contact Us', screen: 'store-contact' },
    { key: 'enter-cz', label: 'Enter Clutch Zone', screen: 'home' },
  ];

  const legalLinks = [
    { key: 'terms', label: 'Terms & Conditions', screen: 'store-terms' },
    { key: 'privacy', label: 'Privacy Policy', screen: 'store-privacy' },
    { key: 'refund', label: 'Refund & Cancellation Policy', screen: 'store-refund' },
    { key: 'shipping', label: 'Shipping & Delivery Policy', screen: 'store-shipping' },
    { key: 'disclaimer', label: 'Disclaimer', screen: 'store-disclaimer' },
    { key: 'license', label: 'License Agreement', screen: 'store-license' },
    { key: 'dmca', label: 'DMCA / Copyright Policy', screen: 'store-dmca' },
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
          <div className="site-footer__links-title">Quick Links</div>
          <div className="site-footer__link-list">
            {quickLinks.map((link) => (
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

        <div className="site-footer__links">
          <div className="site-footer__links-title">Legal</div>
          <div className="site-footer__link-list">
            {legalLinks.map((link) => (
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
