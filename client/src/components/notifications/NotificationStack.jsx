import { FloatingNotification } from './FloatingNotification';

export const NotificationStack = ({ notifications, onClose }) => {
  if (!notifications?.length) return null;

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex flex-col gap-3">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto">
          <FloatingNotification notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
