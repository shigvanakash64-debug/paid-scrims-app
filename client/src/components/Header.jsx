export const Header = ({ user }) => {
  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-hex"></div>
        <div className="logo-text">SCRIM<span>PRO</span></div>
      </div>
      <div className="topbar-right">
        <div className="wallet-pill"><span className="sym">₹</span><span className="amt">{user?.balance ?? 0}</span></div>
        <div className="trust-badge">TG: {user?.trustScore ?? 0}</div>
      </div>
    </header>
  );
};