export const WallpaperConfirmModal = ({ open, onCancel, onContinue }) => {
  if (!open) return null;

  return (
    <div className="info-modal-overlay" role="dialog" aria-modal="true">
      <div className="info-modal">
        <div className="info-modal-header">
          <h3>Leave wallpaper store?</h3>
        </div>
        <div className="info-modal-content">
          You are leaving the wallpaper store and entering the Clutch Zone skill-based gaming platform.
        </div>
        <div style={{ display: 'grid', gap: 8 }}>
          <button className="btn-primary" type="button" onClick={onContinue}>Continue</button>
          <button className="btn-outline" type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};
