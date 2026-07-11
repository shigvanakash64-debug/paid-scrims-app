export const Footer = ({ onNavigate }) => {
  const links = [
    { key: 'privacy-policy', label: 'Privacy Policy', screen: 'privacy-policy' },
    { key: 'terms-conditions', label: 'Terms & Conditions', screen: 'terms-conditions' },
    { key: 'refund-policy', label: 'Refund Policy', screen: 'refund-policy' },
    { key: 'fair-play', label: 'Fair Play Policy', screen: 'fair-play' },
    { key: 'responsible-gaming', label: 'Responsible Gaming Policy', screen: 'responsible-gaming' },
    { key: 'contacts', label: 'Contact Us', screen: 'contacts' },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer__content">
        <div className="site-footer__brand">
          <div className="site-footer__title">CLUTCH ZONE</div>
          <div className="site-footer__tagline">Compete. Win. Get Paid.</div>
          <div className="site-footer__meta">Operated by: Akash Dinesh Shigvan</div>
          <div className="site-footer__meta">GSTIN: 27SQJPS2378E1Z0</div>
          <div className="site-footer__meta">
            Support Email: <a className="site-footer__link site-footer__link--mail" href="mailto:supportclutchzone@gmail.com" style={{display:'inline'}}>supportclutchzone@gmail.com</a>
          </div>
        </div>

        <div className="site-footer__links">
          <div className="site-footer__links-title">Quick Links</div>
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

      <div className="site-footer__bottom">
        © 2026 Clutch Zone. All Rights Reserved.










        
      </div>
    </footer>
  );
};
