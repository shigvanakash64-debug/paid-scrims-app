import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { NotificationStack } from '../components/notifications/NotificationStack';
import { useUser } from './UserContext';

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
    const safePayload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: payload?.type || 'info',
      title: payload?.title || 'Clutch Zone',
      message: payload?.message || 'You have a new update.',
      duration: payload?.duration || 5000,
    };

    setNotificationState((prev) => {
      if (prev.active.length < 4) {
        return {
          active: [...prev.active, safePayload],
          queued: prev.queued,
        };
      }

      return {
        active: prev.active,
        queued: [...prev.queued, safePayload],
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
    const currentKeys = notificationItems
      .filter((item) => !item.read)
      .map((item) => `${item.id || item._id || ''}-${item.createdAt || ''}`);
    const previousKeys = previousNotificationKeysRef.current;

    if (previousKeys && currentKeys.length > 0) {
      const newItems = notificationItems.filter((item) => {
        if (item.read) return false;
        const key = `${item.id || item._id || ''}-${item.createdAt || ''}`;
        return !previousKeys.split('|').includes(key);
      });

      newItems.forEach((item) => {
        queueNotification({
          type: item.type || 'info',
          title: item.title || item.type?.toUpperCase?.() || 'Clutch Zone',
          message: item.message || 'You have a new update.',
        });
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
          const newItems = remoteUnread.filter((item) => {
            const key = `${item.id || item._id || ''}-${item.createdAt || ''}`;
            return !previousKeys.split('|').includes(key);
          });

          newItems.forEach((item) => {
            queueNotification({
              type: item.type || 'info',
              title: item.title || item.type?.toUpperCase?.() || 'Clutch Zone',
              message: item.message || 'You have a new update.',
            });
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
      window.showClutchZoneNotification = showNotification;
      window.dismissClutchZoneNotification = dismissNotification;
    }

    return () => {
      if (typeof window !== 'undefined') {
        delete window.showClutchZoneNotification;
        delete window.dismissClutchZoneNotification;
      }
    };
  }, [dismissNotification]);

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
