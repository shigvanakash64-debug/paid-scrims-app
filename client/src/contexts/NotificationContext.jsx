import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { NotificationStack } from '../components/notifications/NotificationStack';
import { useUser } from './UserContext';
import { getFloatingNotificationPayload, getNewNotifications, normalizeNotificationPayload } from '../utils/notificationUtils';

const NotificationContext = createContext(null);
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';
const notificationHandlers = new Set();

export const registerNotificationHandler = (handler) => {
  notificationHandlers.add(handler);
  return () => notificationHandlers.delete(handler);
};

export const showNotification = (payload) => {
  notificationHandlers.forEach((handler) => handler(payload));
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notificationState, setNotificationState] = useState({ active: [], queued: [] });
  const { user } = useUser();
  const previousNotificationKeysRef = useRef('');

  const queueNotification = useCallback((payload) => {
    const safePayload = normalizeNotificationPayload(payload);
    const floatingPayload = getFloatingNotificationPayload(safePayload);

    if (!floatingPayload) return;

    setNotificationState((prev) => {
      const nextActive = prev.active.filter((item) => item.id !== floatingPayload.id);
      if (nextActive.length < 4) {
        return {
          active: [...nextActive, floatingPayload],
          queued: prev.queued,
        };
      }

      return {
        active: nextActive,
        queued: [...prev.queued, floatingPayload],
      };
    });
  }, []);

  const dismissNotification = useCallback((id) => {
    setNotificationState((prev) => {
      const activeWithoutCurrent = prev.active.filter((item) => item.id !== id);
      if (activeWithoutCurrent.length < 4 && prev.queued.length > 0) {
        const [nextQueued, ...restQueued] = prev.queued;
        return {
          active: [...activeWithoutCurrent, nextQueued],
          queued: restQueued,
        };
      }

      return {
        active: activeWithoutCurrent,
        queued: prev.queued,
      };
    });
  }, []);

  useEffect(() => {
    return registerNotificationHandler(queueNotification);
  }, [queueNotification]);

  useEffect(() => {
    const notificationItems = user?.notifications || [];
    const previousKeys = previousNotificationKeysRef.current;
    const currentKeys = notificationItems
      .filter((item) => !item.read)
      .map((item) => `${item.id || item._id || ''}-${item.createdAt || ''}`);

    if (previousKeys && currentKeys.length > 0) {
      const newItems = getNewNotifications(
        previousKeys.split('|').map((key) => ({ id: key.split('-')[0], createdAt: key.split('-').slice(1).join('-'), read: false })),
        notificationItems
      );

      newItems.forEach((item) => {
        queueNotification(item);
      });
    }

    previousNotificationKeysRef.current = currentKeys.join('|');
  }, [queueNotification, user?.notifications]);

  useEffect(() => {
    const syncNotifications = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || !user?.id) return;

      try {
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000,
        });

        const remoteNotifications = response?.data?.user?.notifications || [];
        const remoteUnread = remoteNotifications.filter((item) => !item.read);
        const remoteKeys = remoteUnread.map((item) => `${item.id || item._id || ''}-${item.createdAt || ''}`);
        const previousKeys = previousNotificationKeysRef.current;

        if (previousKeys && remoteKeys.length > 0) {
          const newItems = getNewNotifications(
            previousKeys.split('|').map((key) => ({ id: key.split('-')[0], createdAt: key.split('-').slice(1).join('-'), read: false })),
            remoteUnread
          );

          newItems.forEach((item) => {
            queueNotification(item);
          });
        }

        previousNotificationKeysRef.current = remoteKeys.join('|');
      } catch (error) {
        console.warn('Could not sync in-app notifications:', error.message || error);
      }
    };

    void syncNotifications();
    const intervalId = window.setInterval(() => {
      void syncNotifications();
    }, 15000);

    return () => window.clearInterval(intervalId);
  }, [queueNotification, user?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.showClutchZoneNotification = (payload) => queueNotification(payload);
      window.dismissClutchZoneNotification = dismissNotification;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showClutchZoneNotification;
        delete window.dismissClutchZoneNotification;
      }
    };
  }, [dismissNotification, queueNotification]);

  const notifications = notificationState.active;

  const value = useMemo(() => ({
    notifications,
    showNotification: queueNotification,
    dismissNotification,
  }), [dismissNotification, notifications, queueNotification]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <NotificationStack notifications={notifications} onClose={dismissNotification} />
    </NotificationContext.Provider>
  );
};
