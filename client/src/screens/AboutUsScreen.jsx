export const AboutUsScreen = ({ onScreenChange }) => {
  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">About Us</h1>
        <p className="screen-sub">A lightweight wallpaper experience that sits on top of Clutch Zone.</p>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <p className="screen-sub" style={{ marginTop: 0 }}>Clutch Zone is the gaming platform, while this store offers a simple place to discover and buy wallpapers for your setup. The experience is intentionally basic, fast, and easy to use.</p>
          <p className="screen-sub" style={{ marginTop: 8 }}>Enter Clutch Zone from here to continue to the existing gaming experience.</p>
          <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 12 }}>
            <button className="btn-primary" type="button" onClick={() => onScreenChange('clutch-zone-confirm')}>Enter Clutch Zone</button>
          </div>
        </div>
      </div>
    </div>
  );
};
