import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';

export const InboxScreen = ({ user, onUserUpdate }) => {
  const [notifications, setNotifications] = useState(user?.notifications || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setNotifications(user?.notifications || []);
  }, [user?.notifications]);

  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 5 seconds
    const interval = setInterval(fetchNotifications, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = response.data.user;
      setNotifications(userData.notifications || []);
      if (onUserUpdate) onUserUpdate(userData);
    } catch (err) {
      console.error('fetchNotifications error', err);
      setError('Unable to load notifications.');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.post(
        `${API_BASE}/auth/notifications/mark-read`,
        { notificationId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data?.success) {
        const userData = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(userData.data.user.notifications || []);
        if (onUserUpdate) onUserUpdate(userData.data.user);
      }
    } catch (err) {
      console.error('markRead error', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const token = localStorage.getItem('clutchzone_token');
      const response = await axios.post(
        `${API_BASE}/auth/notifications/read-all`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data?.success) {
        const userData = await axios.get(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setNotifications(userData.data.user.notifications || []);
        if (onUserUpdate) onUserUpdate(userData.data.user);
      }
    } catch (err) {
      console.error('markAllRead error', err);
    }
  };

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Inbox</h1>
          <p className="text-sm text-[#A1A1A1] mt-2">Track recent match updates, opponent joins, and payout notifications.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={fetchNotifications}
            className="rounded-xl border border-[#1F1F1F] bg-[#111111] px-4 py-3 text-sm text-white hover:border-[#FF6A00] transition"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="rounded-xl bg-[#FF6A00] px-4 py-3 text-sm font-semibold text-black transition disabled:opacity-50"
          >
            Mark all read
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-6 text-center text-[#A1A1A1]">Loading notifications...</div>
      ) : error ? (
        <div className="bg-[#111111] border border-[#EF4444] rounded-xl p-6 text-center text-[#EF4444]">{error}</div>
      ) : notifications.length === 0 ? (
        <div className="bg-[#111111] border border-[#1F1F1F] rounded-xl p-10 text-center text-[#A1A1A1]">
          <p className="text-xl font-semibold text-white">No notifications yet</p>
          <p className="mt-2">Your inbox will show match updates and payout alerts here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications
            .slice()
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            .map((notification) => (
              <div
                key={notification.id}
                className={`rounded-3xl border p-4 ${notification.read ? 'border-[#1F1F1F] bg-[#111111]' : 'border-[#FF6A00] bg-[#1A1A1A]'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[#A1A1A1] uppercase tracking-[0.18em]">{notification.type}</p>
                    <p className="mt-2 text-white">{notification.message}</p>
                    {notification.link && (
                      <p className="mt-2 text-xs text-[#A1A1A1]">Link: {notification.link}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#A1A1A1]">{new Date(notification.createdAt).toLocaleString()}</p>
                    {!notification.read && (
                      <span className="mt-2 inline-block rounded-full bg-[#FF6A00] px-2 py-1 text-[10px] font-semibold uppercase text-black">New</span>
                    )}
                  </div>
                </div>
                {!notification.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notification.id)}
                    className="mt-4 rounded-xl border border-[#FF6A00] bg-[#FF6A00] px-4 py-2 text-sm font-semibold text-black"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
        </div>
      )}
    </div>
  );
};
