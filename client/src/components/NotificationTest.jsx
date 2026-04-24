import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';

const NotificationTest = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/notifications/status');
      setStatus(response.data.status);
    } catch (error) {
      console.error('Failed to fetch notification status:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setLoading(true);
      setTestResult(null);
      const response = await api.post('/auth/notifications/test');
      setTestResult(response.data);
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔔 Notification Debug Panel</h1>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Current Status</h2>
        {loading && <p>Loading...</p>}
        {status && (
          <div className="space-y-2">
            <p><strong>User:</strong> {status.username}</p>
            <p><strong>Player ID:</strong> {status.hasPlayerId ? status.playerIdPreview : '❌ None'}</p>
            <p><strong>Role:</strong> {status.role}</p>
            <p><strong>Preferences:</strong> {JSON.stringify(status.notificationPreferences, null, 2)}</p>
          </div>
        )}
        {status?.error && (
          <p className="text-red-600">Error: {status.error}</p>
        )}
        <button
          onClick={fetchStatus}
          className="mt-3 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={loading}
        >
          Refresh Status
        </button>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3">Test Notification</h2>
        <p className="text-sm text-gray-600 mb-3">
          Send a test notification to verify your setup is working.
        </p>
        <button
          onClick={sendTestNotification}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={loading || !status?.hasPlayerId}
        >
          {loading ? 'Sending...' : 'Send Test Notification'}
        </button>
        {!status?.hasPlayerId && (
          <p className="text-red-600 text-sm mt-2">
            ⚠️ No player ID found. Grant notification permissions first.
          </p>
        )}
        {testResult && (
          <div className="mt-3 p-3 bg-white rounded border">
            <pre className="text-sm">{JSON.stringify(testResult, null, 2)}</pre>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Debug Instructions</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Check that you have a Player ID above</li>
          <li>Send a test notification and check if it arrives</li>
          <li>If no notification arrives, check browser console for errors</li>
          <li>Verify OneSignal dashboard shows your device as "Subscribed"</li>
          <li>Check server logs for notification sending attempts</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationTest;