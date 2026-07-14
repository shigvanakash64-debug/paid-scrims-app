import { BottomNav } from '../components/BottomNav';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const ClutchZoneLayout = ({ children, user, currentScreen, navVisible, onNavigate, onLogout }) => {
  const hideBottomNavScreens = ['admin', 'privacy-policy', 'terms-conditions', 'refund-policy', 'fair-play', 'responsible-gaming'];
  const showBottomNav = Boolean(user && !hideBottomNavScreens.includes(currentScreen));
  const showFooter = ['home', 'contacts', 'privacy-policy', 'terms-conditions', 'refund-policy', 'fair-play', 'responsible-gaming', 'instructions'].includes(currentScreen);

  return (
    <div className={`app ${currentScreen === 'admin' ? 'app-admin' : ''}`}>
      <Header user={user} currentScreen={currentScreen} onNavigate={onNavigate} onLogout={onLogout} />
      <div className="scroll-area">{children}</div>
      {showFooter && <Footer onNavigate={onNavigate} />}
      {showBottomNav && <BottomNav currentScreen={currentScreen} onScreenChange={onNavigate} isVisible={navVisible} />}
    </div>
  );
};
