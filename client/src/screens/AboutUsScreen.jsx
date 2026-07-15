export const AboutUsScreen = ({ onNavigateToClutchZone }) => {
  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">About Us</h1>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ color: '#F4F2EA', marginBottom: 12, fontSize: 16, fontWeight: 600 }}>
            Clutch Zone Store
          </h3>
          <p className="screen-sub" style={{ marginTop: 0 }}>
            Clutch Zone Store is a digital marketplace dedicated to high-quality wallpapers for mobile, tablet, and desktop devices.
          </p>
          <p className="screen-sub" style={{ marginTop: 8 }}>
            We create and curate premium wallpaper collections that let users personalize their devices with clean, stylish, and visually striking designs. Every purchase is delivered instantly through your personal library, making downloads simple and accessible anytime.
          </p>
          <p className="screen-sub" style={{ marginTop: 8 }}>
            Whether you're looking for gaming-inspired artwork, minimal designs, AMOLED wallpapers, abstract collections, or{' '}
            <button
              type="button"
              onClick={onNavigateToClutchZone}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                padding: 0,
                cursor: 'pointer',
                textDecoration: 'none',
                fontSize: 'inherit',
                fontFamily: 'inherit',
              }}
            >
              unique
            </button>
            {' '}digital visuals, our goal is to provide a fast, secure, and seamless shopping experience.
          </p>
        </div>
      </div>
    </div>
  );
};
