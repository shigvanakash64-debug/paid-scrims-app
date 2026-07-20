import { FloatingNotification } from './FloatingNotification';

export const NotificationStack = ({ notifications, onClose }) => {
  if (!notifications?.length) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-[9999] flex flex-col items-end gap-3 sm:right-4 sm:top-4 sm:left-auto sm:items-end">
      {notifications.map((notification) => (
        <div key={notification.id} className="pointer-events-auto w-full sm:w-auto">
          <FloatingNotification notification={notification} onClose={onClose} />
        </div>
      ))}
    </div>
  );
};
