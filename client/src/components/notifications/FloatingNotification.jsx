import { useEffect, useMemo, useState } from 'react';

const typeStyles = {
  match: {
    icon: '🎮',
    accent: 'border-[#FF6A00] text-[#FF6A00]',
    badge: 'bg-[#FF6A00]/15',
  },
  wallet: {
    icon: '💰',
    accent: 'border-[#36D399] text-[#36D399]',
    badge: 'bg-[#36D399]/15',
  },
  result: {
    icon: '🏆',
    accent: 'border-[#FFD166] text-[#FFD166]',
    badge: 'bg-[#FFD166]/15',
  },
  warning: {
    icon: '⚠️',
    accent: 'border-[#FF5C5C] text-[#FF5C5C]',
    badge: 'bg-[#FF5C5C]/15',
  },
  info: {
    icon: '🔔',
    accent: 'border-[#FF6A00] text-[#FF6A00]',
    badge: 'bg-[#FF6A00]/15',
  },
};

export const FloatingNotification = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsVisible(true));
    const timer = window.setTimeout(() => {
      setIsExiting(true);
    }, notification.duration || 5000);

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [notification.duration]);

  const handleClose = () => {
    setIsExiting(true);
    window.setTimeout(() => onClose(notification.id), 180);
  };

  const styles = useMemo(() => typeStyles[notification.type] || typeStyles.info, [notification.type]);

  return (
    <div
      className={`w-[320px] max-w-[92vw] rounded-2xl border border-[#2A2A2A] bg-[#111111]/95 p-3 shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur transition-all duration-300 ${isVisible && !isExiting ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'}`}
      style={{ WebkitTapHighlightColor: 'transparent' }}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${styles.badge}`}>
          {styles.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${styles.accent}`}>{notification.title}</p>
              <p className="mt-1 text-sm leading-5 text-[#F5F5F5]">{notification.message}</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="shrink-0 rounded-full p-1 text-[#A1A1A1] transition hover:bg-[#222222] hover:text-white"
              aria-label="Close notification"
            >
              ✕
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-[#8E8E8E]">Just now</span>
            <span className={`text-xs font-medium ${styles.accent}`}>Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};
