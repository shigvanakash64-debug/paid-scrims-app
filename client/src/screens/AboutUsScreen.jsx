export const AboutUsScreen = ({ onOpenConfirmExit }) => {
  return (
    <div className="screen-home" style={{ paddingBottom: 24 }}>
      <div className="section hero">
        <h1 className="screen-title">About Us</h1>
        <p className="screen-sub">Clutch Zone is a simple and direct gaming platform built for players who want a clean experience.</p>
      </div>

      <div className="section">
        <div className="card" style={{ padding: 16 }}>
          <p className="screen-sub" style={{ marginTop: 0 }}>
            We focus on easy access, fair play, and a smooth experience for players who want to stay connected to their matches, wallets, and rewards without extra clutter.
          </p>
          <p className="screen-sub" style={{ marginTop: 8 }}>
            The wallpaper store is a lightweight companion layer that lets users browse and own premium visuals while still keeping the main Clutch Zone experience available as a separate entry point.
          </p>
          <div className="btn-cta-wrap" style={{ justifyContent: 'flex-start', padding: 0, marginTop: 12 }}>
            <button className="btn-primary" type="button" onClick={onOpenConfirmExit}>Enter Clutch Zone</button>
          </div>
        </div>
      </div>
    </div>
  );
};
