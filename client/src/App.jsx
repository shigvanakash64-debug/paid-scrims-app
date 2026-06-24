import { useCallback, useEffect, useState, lazy, Suspense } from 'react';
import axios from 'axios';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PairingScreen } from './screens/PairingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WalletScreen } from './screens/WalletScreen';
import { InboxScreen } from './screens/InboxScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { InfoScreen } from './screens/InfoScreen';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import NotificationTest from './components/NotificationTest';
import { useMatch } from './contexts/MatchContext';
import { useUser } from './contexts/UserContext';
import './App.css';

// Lazy load admin dashboard
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';

// Helper function to register OneSignal player ID with backend
const registerOneSignalPlayerId = async (token, playerId = null) => {
  try {
    // Check if OneSignal is loaded
    if (!window.OneSignal) {
      console.warn('⚠️ OneSignal SDK not loaded yet');
      return;
    }

    let finalPlayerId = playerId;

    // If no playerId provided, try to get it from OneSignal or localStorage
    if (!finalPlayerId) {
      // Check permission status
      const permission = await window.OneSignal.Notifications.permission;
      console.log('🔔 Current notification permission:', permission);

      if (permission !== true) {
        console.log('⚠️ Notification permission not granted, skipping player ID registration');
        return;
      }

      // Try to get from OneSignal first
      finalPlayerId = await window.OneSignal.User.PushSubscription.id;

      // Fallback to localStorage
      if (!finalPlayerId) {
        finalPlayerId = localStorage.getItem('onesignal_player_id');
      }
    }

    if (!finalPlayerId) {
      console.warn('⚠️ OneSignal Player ID not available yet');
      return;
    }

    console.log('📱 Registering OneSignal Player ID:', finalPlayerId.substring(0, 15) + '...');

    // Send player ID to backend
    const response = await axios.post(
      `${API_BASE}/auth/notifications/register-push`,
      { onesignalPlayerId: finalPlayerId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      console.log('✅ OneSignal Player ID registered successfully');
      // Clear from localStorage once successfully registered
      localStorage.removeItem('onesignal_player_id');

      // Immediately check the status for debugging
      checkNotificationStatus(token);
    }
  } catch (error) {
    console.error('⚠️ Failed to register OneSignal Player ID:', error.message);
    // Don't throw - this is non-critical
  }
};

// Helper function to check notification status (for debugging)
const checkNotificationStatus = async (token) => {
  try {
    const response = await axios.get(
      `${API_BASE}/auth/notifications/status`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      const { status } = response.data;
      console.log('📊 Notification Status:');
      console.log(`   Username: ${status.username}`);
      console.log(`   Has Player ID: ${status.hasPlayerId ? '✅' : '❌'}`);
      console.log(`   Player ID Preview: ${status.playerIdPreview}`);
      console.log(`   Prefs: Match=${status.notificationPreferences.matchNotifications}, Wallet=${status.notificationPreferences.walletNotifications}, System=${status.notificationPreferences.systemNotifications}`);
    }
  } catch (error) {
    console.warn('⚠️ Could not check notification status:', error.message);
  }
};

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [loadingAuth, setLoadingAuth] = useState(true);
  const { currentMatch, setMatch, clearMatch, refreshMatch } = useMatch();
  const { user, updateUser, clearUser } = useUser();

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const savedScreen = localStorage.getItem('clutchzone_currentScreen');
      const savedMatchId = localStorage.getItem('clutchzone_currentMatchId');
      const cachedUser = (() => {
        try {
          return JSON.parse(localStorage.getItem('clutchzone_cached_user') || 'null');
        } catch (error) {
          return null;
        }
      })();

      const validScreens = ['home', 'match', 'result', 'pairing', 'profile', 'wallet', 'settings', 'admin', 'inbox', 'instructions', 'contacts', 'privacy-policy', 'terms-conditions', 'refund-policy', 'raise-ticket', 'fair-play', 'responsible-gaming'];
      const targetScreen = validScreens.includes(savedScreen) ? savedScreen : 'home';

      if (!token) {
        setCurrentScreen(savedScreen || 'login');
        setLoadingAuth(false);
        return;
      }

      if (cachedUser) {
        updateUser(cachedUser);
        setCurrentScreen(targetScreen);
        setLoadingAuth(false);
      } else {
        setCurrentScreen(targetScreen);
      }

      const timeoutMs = 3500;
      void axios.get(`${API_BASE}/health`, { timeout: 4000 }).catch(() => undefined);

      const authRequest = axios.get(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: timeoutMs,
      });
      const timeoutRequest = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Session verification timeout')), timeoutMs);
      });

      try {
        const response = await Promise.race([authRequest, timeoutRequest]);
        const restoredUser = response.data.user;
        updateUser(restoredUser);

        if (targetScreen === 'admin' && !restoredUser?.isAdmin && restoredUser?.role !== 'admin') {
          setCurrentScreen('home');
        }

        if (savedMatchId) {
          const refreshPromise = Promise.race([
            refreshMatch(savedMatchId),
            new Promise((resolve) => setTimeout(() => resolve(null), 2000)),
          ]);

          const refreshed = await refreshPromise;
          if (refreshed) {
            setMatch(refreshed);
          } else {
            clearMatch();
          }
        }

        const lastRegistrationTime = localStorage.getItem('clutchzone_last_player_id_registration');
        const now = Date.now();
        const timeSinceLastRegistration = lastRegistrationTime ? now - parseInt(lastRegistrationTime) : Infinity;

        if (timeSinceLastRegistration > 5 * 60 * 1000) {
          localStorage.setItem('clutchzone_last_player_id_registration', now.toString());
          registerOneSignalPlayerId(token);
        }
      } catch (error) {
        console.warn('Session restore completed with cached fallback:', error.message || error);
      } finally {
        if (!cachedUser) {
          setLoadingAuth(false);
        }
      }
    };

    restoreSession();
  }, [clearMatch, refreshMatch, setMatch, updateUser]);

  const handleNotificationClick = useCallback(async (data) => {
    console.log('🔔 Notification click navigation payload:', data);

    if (data?.matchId) {
      try {
        const refreshed = await refreshMatch(data.matchId);
        if (refreshed) {
          setMatch(refreshed);
          setCurrentScreen('match');
          window.scrollTo(0, 0);
          return;
        }
      } catch (error) {
        console.warn('Could not refresh match from notification click:', error);
      }
    }

    if (data?.eventType === 'withdrawal_requested') {
      setCurrentScreen('wallet');
      window.scrollTo(0, 0);
      return;
    }

    if (data?.eventType === 'matches_available') {
      setCurrentScreen('home');
      window.scrollTo(0, 0);
      return;
    }

    setCurrentScreen('home');
    window.scrollTo(0, 0);
  }, [refreshMatch, setMatch, setCurrentScreen]);

  useEffect(() => {
    const handlePlayerIdReady = (event) => {
      const { playerId } = event.detail;
      const token = localStorage.getItem(TOKEN_KEY);
      if (token && playerId) {
        console.log('📱 OneSignal player ID ready, registering with backend...');
        registerOneSignalPlayerId(token, playerId);
      }
    };

    window.addEventListener('onesignal-player-id-ready', handlePlayerIdReady);
    return () => window.removeEventListener('onesignal-player-id-ready', handlePlayerIdReady);
  }, []);

  useEffect(() => {
    const handleNotificationClickEvent = (event) => {
      const { data } = event.detail;
      handleNotificationClick(data);
    };

    window.addEventListener('onesignal-notification-clicked', handleNotificationClickEvent);
    return () => window.removeEventListener('onesignal-notification-clicked', handleNotificationClickEvent);
  }, [handleNotificationClick]);

  // Periodic check of notification status (for debugging)
  useEffect(() => {
    if (!user) return; // Only check when logged in

    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    // Check immediately on mount
    checkNotificationStatus(token);

    // Then check every 60 seconds
    const interval = setInterval(() => {
      checkNotificationStatus(token);
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  const setSession = (userData, token) => {
    updateUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
    setCurrentScreen('home');
    
    // Register OneSignal player ID after successful login
    registerOneSignalPlayerId(token);
  };

  const clearSession = () => {
    clearUser();
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('clutchzone_currentMatch');
    localStorage.removeItem('clutchzone_currentMatchId');
    localStorage.removeItem('clutchzone_currentScreen');
    clearMatch();
    setCurrentScreen('login');
  };

  const handleLogin = async ({ username, password }) => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: username.trim(),
        password,
      });
      setSession(response.data.user, response.data.token);
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  const handleRegister = async ({ username, password, referralCode }) => {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username: normalizedUsername,
        password,
        referralCode,
      });
      setSession(response.data.user, response.data.token);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('In Game Name already exists. Choose a different in-game name.');
      } else {
        alert(error.response?.data?.error || 'Registration failed');
      }
    }
  };

  const handleUserUpdate = (updatedUser) => {
    updateUser(updatedUser);
  };

  const handleProfileSave = async (updates) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await axios.put(`${API_BASE}/auth/profile`, updates, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      updateUser(response.data.user);
      alert('Profile updated successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Could not save profile changes');
    }
  };

  const handleLogout = () => {
    clearSession();
  };

  useEffect(() => {
    if (user) {
      localStorage.setItem('clutchzone_currentScreen', currentScreen);
    }
  }, [currentScreen, user]);

  const renderScreen = () => {
    if (loadingAuth) {
      return <div className="loading-screen">Loading...</div>;
    }

    // Check if user is admin for admin routes
    const isAdmin = user?.role === 'admin' || user?.isAdmin === true;

    if (!user) {
      if (currentScreen === 'register') {
        return <RegisterScreen onRegister={handleRegister} onNavigateLogin={() => setCurrentScreen('login')} />;
      }
      return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => setCurrentScreen('register')} />;
    }

    // Admin route protection
    if (currentScreen === 'admin') {
      if (!isAdmin) {
        alert('Admin access required');
        setCurrentScreen('home');
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={setCurrentScreen} currentMatch={currentMatch} />;
      }
      return (
        <Suspense fallback={<div className="loading-screen">Loading Admin Dashboard...</div>}>
          <AdminLayout />
        </Suspense>
      );
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={setCurrentScreen} currentMatch={currentMatch} />;
      case 'match':
        return <MatchScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} />;
      case 'result':
        return <ResultScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} onUserUpdate={handleUserUpdate} />;
      case 'pairing':
        return (
          <PairingScreen
            match={currentMatch}
            user={user}
            onScreenChange={setCurrentScreen}
            onMatchSelect={setMatch}
          />
        );
      case 'inbox':
        return <InboxScreen user={user} onUserUpdate={handleUserUpdate} />;
      case 'contacts':
        return <ContactsScreen />;
      case 'profile':
        return <ProfileScreen user={user} onUserUpdate={handleUserUpdate} onProfileSave={handleProfileSave} />;
      case 'wallet':
        return <WalletScreen user={user} onUserUpdate={handleUserUpdate} />;
      case 'settings':
        return <SettingsScreen user={user} />;
      case 'privacy-policy':
        return <InfoScreen page="privacy-policy" />;
      case 'terms-conditions':
        return <InfoScreen page="terms-conditions" />;
      case 'refund-policy':
        return <InfoScreen page="refund-policy" />;
      case 'raise-ticket':
        return <InfoScreen page="raise-ticket" />;
      case 'fair-play':
        return <InfoScreen page="fair-play" />;
      case 'responsible-gaming':
        return <InfoScreen page="responsible-gaming" />;
      case 'instructions':
        return <InstructionsScreen />;
      case 'notification-test':
        return <NotificationTest />;
      default:
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={setCurrentScreen} />;
    }
  };

  const showBottomNav = user && currentScreen !== 'admin';

  return (
    <div className={`app ${currentScreen === 'admin' ? 'app-admin' : ''}`}>
      <Header user={user} onNavigate={setCurrentScreen} onLogout={handleLogout} />
      <div className="scroll-area">{renderScreen()}</div>
      {showBottomNav && <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />}
    </div>
  );
}

export default App;

