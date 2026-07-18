import { useMemo, useState } from 'react';
import { StoreHeader } from '../components/store/StoreHeader';
import { StoreFooter } from '../components/store/StoreFooter';
import { WallpaperConfirmModal } from '../components/WallpaperConfirmModal';

export const StoreLayout = ({ children, user, currentScreen, onNavigate, onBack, canGoBack, onLogout, onOpenClutchZone }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const handleEnterClutchZone = () => {
    setShowConfirmModal(false);
    if (onOpenClutchZone) onOpenClutchZone();
  };

  const headerProps = useMemo(() => ({
    user,
    currentScreen,
    onNavigate,
    onBack,
    canGoBack,
    onLogout,
    onOpenConfirmExit: () => setShowConfirmModal(true),
  }), [user, currentScreen, onNavigate, onBack, canGoBack, onLogout]);

  return (
    <div className="app app-store">
      <StoreHeader {...headerProps} />
      <div className="scroll-area">{children}</div>
      <StoreFooter onNavigate={onNavigate} />
      <WallpaperConfirmModal
        open={showConfirmModal}
        onCancel={() => setShowConfirmModal(false)}
        onContinue={handleEnterClutchZone}
      />
    </div>
  );
};
