import { useCallback, useEffect, useState, lazy, Suspense, useRef } from 'react';
import axios from 'axios';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PairingScreen } from './screens/PairingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { WalletScreen } from './screens/WalletScreen';
import { PaymentStatusScreen } from './screens/PaymentStatusScreen';
import { InboxScreen } from './screens/InboxScreen';
import { InstructionsScreen } from './screens/InstructionsScreen';
import { ContactsScreen } from './screens/ContactsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { InfoScreen } from './screens/InfoScreen';
import NotificationTest from './components/NotificationTest';
import { useMatch } from './contexts/MatchContext';
import { StoreLayout } from './layouts/StoreLayout';
import { ClutchZoneLayout } from './layouts/ClutchZoneLayout';
import { useUser } from './contexts/UserContext';
import { WallpaperHomeScreen } from './screens/WallpaperHomeScreen';
import { WallpaperCollectionScreen } from './screens/WallpaperCollectionScreen';
import { WallpaperDetailScreen } from './screens/WallpaperDetailScreen';
import { WallpaperLibraryScreen } from './screens/WallpaperLibraryScreen';
import { WallpaperAdminScreen } from './screens/WallpaperAdminScreen';
import { AboutUsScreen } from './screens/AboutUsScreen';
import { StoreInfoScreen } from './screens/StoreInfoScreen';
import { StoreContactScreen } from './screens/StoreContactScreen';
import './App.css';

// Lazy load admin dashboard
const AdminLayout = lazy(() => import('./components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
const TOKEN_KEY = 'clutchzone_token';
const VALID_SCREENS = ['home', 'match', 'result', 'pairing', 'profile', 'wallet', 'settings', 'admin', 'inbox', 'instructions', 'contacts', 'privacy-policy', 'terms-conditions', 'refund-policy', 'responsible-gaming', 'wallpaper-home', 'wallpaper-collection', 'wallpaper-details', 'wallpaper-library', 'about-us', 'wallpaper-manager', 'store-terms', 'store-privacy', 'store-refund', 'store-shipping', 'store-disclaimer', 'store-license', 'store-dmca', 'store-contact', 'payment-status'];

const getInitialScreen = () => {
  if (typeof window === 'undefined') return 'home';
  const savedScreen = localStorage.getItem('clutchzone_currentScreen');
  return savedScreen && VALID_SCREENS.includes(savedScreen) ? savedScreen : 'home';
};

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
  const [currentScreen, setCurrentScreen] = useState(getInitialScreen);
  const [screenHistory, setScreenHistory] = useState([]);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [navVisible, setNavVisible] = useState(true);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedWallpaper, setSelectedWallpaper] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);
  const lastScrollPosRef = useRef(0);
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

      const pathScreen = typeof window !== 'undefined' && window.location.pathname === '/payment-status' ? 'payment-status' : null;
      const fallbackScreen = 'home';
      const targetScreen = pathScreen || (savedScreen && VALID_SCREENS.includes(savedScreen) ? savedScreen : fallbackScreen);

      if (!token) {
        setCurrentScreen(pathScreen || savedScreen || fallbackScreen);
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

  const purchasePendingWallpaper = useCallback(async (token, wallpaper) => {
    if (!wallpaper?._id) return;

    try {
      const response = await axios.post(`${API_BASE}/wallpapers/${wallpaper._id}/purchase`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setSelectedWallpaper(wallpaper);
        setCurrentScreen('wallpaper-library');
        setPendingAction(null);
      }
    } catch (error) {
      alert(error.response?.data?.error || 'Purchase failed');
      setPendingAction(null);
    }
  }, []);

  const setSession = (userData, token) => {
    updateUser(userData);
    localStorage.setItem(TOKEN_KEY, token);

    if (pendingAction?.type === 'purchase' && pendingAction.wallpaper) {
      setSelectedWallpaper(pendingAction.wallpaper);
      navigateTo('wallpaper-details', pendingAction.wallpaper, true);
      setPendingAction(null);
      void purchasePendingWallpaper(token, pendingAction.wallpaper);
      return;
    }

    if (pendingAction === 'clutch-zone') {
      setPendingAction(null);
      navigateTo('home', null, true);
    } else {
      setPendingAction(null);
      navigateTo('wallpaper-home', null, true);
    }

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
    setScreenHistory([]);
    navigateTo('wallpaper-home', null, true);
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

  const navigateTo = (screen, wallpaper = null, replace = false) => {
    setScreenHistory((prev) => {
      if (replace || screen === currentScreen) return prev;
      if (prev.length === 0 || prev[prev.length - 1] !== currentScreen) {
        return [...prev, currentScreen];
      }
      return prev;
    });
    setCurrentScreen(screen);
    if (screen === 'wallpaper-details' && wallpaper) {
      setSelectedWallpaper(wallpaper);
    } else {
      setSelectedWallpaper(null);
    }
  };

  const handleScreenChange = (screen, wallpaper = null, replace = false) => {
    navigateTo(screen, wallpaper, replace);
  };

  const handleBack = () => {
    setScreenHistory((prev) => {
      if (prev.length === 0) return prev;
      const previous = prev[prev.length - 1];
      setCurrentScreen(previous);
      return prev.slice(0, -1);
    });
  };

  const openClutchZone = () => {
    setShowConfirmModal(false);
    if (user) {
      navigateTo('home', null, true);
    } else {
      setPendingAction('clutch-zone');
      navigateTo('login', null, true);
    }
  };

  const handleStartPurchase = (wallpaper) => {
    setPendingAction({ type: 'purchase', wallpaper });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const safeScreen = VALID_SCREENS.includes(currentScreen) ? currentScreen : 'home';
      localStorage.setItem('clutchzone_currentScreen', safeScreen);
    }
  }, [currentScreen]);

  const canGoBack = screenHistory.length > 0;

  useEffect(() => {
    const scrollArea = document.querySelector('.scroll-area');
    const appEl = document.querySelector('.app');
    const docScrollEl = document.scrollingElement || document.documentElement || document.body;

    const debug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('navdebug');

    const candidates = [scrollArea, appEl, docScrollEl, document.documentElement, document.body];

    const findScrollable = () => {
      for (const el of candidates) {
        if (!el) continue;
        try {
          if (el.scrollHeight > el.clientHeight) return el;
        } catch (e) {
          // ignore
        }
      }
      // fallback to window
      return window;
    };

    let activeContainer = findScrollable();
    if (debug) console.log('nav debug: initial activeContainer', activeContainer === window ? 'window' : activeContainer.tagName);

    const getScrollTop = () => {
      try {
        if (activeContainer && activeContainer !== window && typeof activeContainer.scrollTop === 'number') return activeContainer.scrollTop;
      } catch (e) {
        // ignore
      }
      return window.scrollY || window.pageYOffset || 0;
    };

    // initialize last scroll position
    lastScrollPosRef.current = getScrollTop();

    // Make the detection more sensitive for small scrolls/touches
    const SENSITIVITY = 3; // pixels
    let ticking = false;
    const touchStartYRef = { current: null };

    const handleScrollDelta = (delta) => {
      if (delta > SENSITIVITY) {
        // Scrolling down / content moving down -> hide nav
        setNavVisible(false);
      } else if (delta < -SENSITIVITY) {
        // Scrolling up / content moving up -> show nav
        setNavVisible(true);
      }
    };

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentScrollPos = getScrollTop();
        const lastScrollPos = lastScrollPosRef.current;
        const delta = currentScrollPos - lastScrollPos;

        handleScrollDelta(delta);

        lastScrollPosRef.current = currentScrollPos;
        ticking = false;
      });
    };

    const handleTouchStart = (e) => {
      const t = e.touches && e.touches[0];
      if (t) touchStartYRef.current = t.clientY;
      // Reset baseline for touch interactions
      try {
        lastScrollPosRef.current = getScrollTop();
      } catch (err) {
        // ignore
      }
    };

    const handleTouchMove = (e) => {
      const t = e.touches && e.touches[0];
      if (!t) return;
      // Use actual scrollTop/read handleScroll for consistent behavior
      handleScroll();
      // update start to allow continuous small moves
      touchStartYRef.current = t.clientY;
    };

    const handleWheel = (e) => {
      // Normalize wheel delta across deltaMode
      let wheelDelta = e.deltaY;
      if (e.deltaMode === 1) wheelDelta *= 16; // lines -> pixels approx
      else if (e.deltaMode === 2) wheelDelta *= window.innerHeight; // pages -> pixels

      if (Math.abs(wheelDelta) < 0.5) return;
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        handleScrollDelta(wheelDelta);
        ticking = false;
      });
    };

    // Helper to attach listeners to the active container
    const attachTo = (c) => {
      try {
        if (c === window) {
          window.addEventListener('scroll', handleScroll, { passive: true });
          window.addEventListener('touchstart', handleTouchStart, { passive: true });
          window.addEventListener('touchmove', handleTouchMove, { passive: true });
          window.addEventListener('wheel', handleWheel, { passive: true });
        } else {
          c.addEventListener('scroll', handleScroll, { passive: true });
          c.addEventListener('touchstart', handleTouchStart, { passive: true });
          c.addEventListener('touchmove', handleTouchMove, { passive: true });
          c.addEventListener('wheel', handleWheel, { passive: true });
        }
      } catch (err) {
        // ignore
      }
    };

    const detachFrom = (c) => {
      try {
        if (c === window) {
          window.removeEventListener('scroll', handleScroll);
          window.removeEventListener('touchstart', handleTouchStart);
          window.removeEventListener('touchmove', handleTouchMove);
          window.removeEventListener('wheel', handleWheel);
        } else {
          c.removeEventListener('scroll', handleScroll);
          c.removeEventListener('touchstart', handleTouchStart);
          c.removeEventListener('touchmove', handleTouchMove);
          c.removeEventListener('wheel', handleWheel);
        }
      } catch (err) {
        // ignore
      }
    };

    attachTo(activeContainer);

    // Polling fallback to detect scrollbar drags or cases where scroll events are not firing
    const POLL_MS = 120;
    const pollId = setInterval(() => {
      try {
        const top = getScrollTop();
        const last = lastScrollPosRef.current;
        const delta = top - last;
        if (Math.abs(delta) > 0) {
          handleScrollDelta(delta);
          lastScrollPosRef.current = top;
        }
      } catch (e) {
        // ignore
      }
    }, POLL_MS);

    // Watch for changes in which element is scrollable (e.g., layout change)
    const observer = new MutationObserver(() => {
      const newActive = findScrollable();
      if (newActive !== activeContainer) {
        if (debug) console.log('nav debug: activeContainer changed', newActive === window ? 'window' : newActive.tagName);
        detachFrom(activeContainer);
        activeContainer = newActive;
        attachTo(activeContainer);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      clearInterval(pollId);
      observer.disconnect();
      detachFrom(activeContainer);
    };
  }, []);

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
      if (currentScreen === 'login') {
        return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => setCurrentScreen('register')} />;
      }
      return <WallpaperHomeScreen user={user} onScreenChange={handleScreenChange} onOpenConfirmExit={() => setShowConfirmModal(true)} />;
    }
    // Admin route protection
    if (currentScreen === 'admin') {
      if (!isAdmin) {
        alert('Admin access required');
        setCurrentScreen('home');
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={handleScreenChange} currentMatch={currentMatch} />;
      }
      return (
        <Suspense fallback={<div className="loading-screen">Loading Admin Dashboard...</div>}>
          <AdminLayout />
        </Suspense>
      );
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={handleScreenChange} currentMatch={currentMatch} />;
      case 'match':
        return <MatchScreen match={currentMatch} user={user} onScreenChange={handleScreenChange} />;
      case 'result':
        return <ResultScreen match={currentMatch} user={user} onScreenChange={handleScreenChange} onUserUpdate={handleUserUpdate} />;
      case 'pairing':
        return (
          <PairingScreen
            match={currentMatch}
            user={user}
            onScreenChange={handleScreenChange}
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
      case 'payment-status':
        return <PaymentStatusScreen user={user} onNavigate={handleScreenChange} />;
      case 'settings':
        return <SettingsScreen user={user} />;
      case 'privacy-policy':
        return <InfoScreen page="privacy-policy" />;
      case 'terms-conditions':
        return <InfoScreen page="terms-conditions" />;
      case 'refund-policy':
        return <InfoScreen page="refund-policy" />;
      case 'fair-play':
        return <InfoScreen page="fair-play" />;
      case 'responsible-gaming':
        return <InfoScreen page="responsible-gaming" />;
      case 'instructions':
        return <InstructionsScreen />;
      case 'notification-test':
        return <NotificationTest />;
      case 'wallpaper-home':
        return <WallpaperHomeScreen user={user} onScreenChange={handleScreenChange} onOpenConfirmExit={() => setShowConfirmModal(true)} />;
      case 'wallpaper-collection':
        return <WallpaperCollectionScreen onScreenChange={handleScreenChange} />;
      case 'wallpaper-details':
        return <WallpaperDetailScreen wallpaper={selectedWallpaper} user={user} onScreenChange={handleScreenChange} onStartPurchase={handleStartPurchase} />;
      case 'wallpaper-library':
        return <WallpaperLibraryScreen user={user} onScreenChange={handleScreenChange} />;
      case 'wallpaper-manager':
        if (!isAdmin) {
          alert('Admin access required');
          return <WallpaperHomeScreen user={user} onScreenChange={handleScreenChange} onOpenConfirmExit={() => setShowConfirmModal(true)} />;
        }
        return <WallpaperAdminScreen />;
      case 'about-us':
        return <AboutUsScreen onNavigateToClutchZone={openClutchZone} />;
      case 'payment-status':
        return <PaymentStatusScreen user={user} onNavigate={handleScreenChange} />;
      case 'store-terms':
      case 'store-privacy':
      case 'store-refund':
      case 'store-shipping':
      case 'store-disclaimer':
      case 'store-license':
      case 'store-dmca':
        return <StoreInfoScreen page={currentScreen} />;
      case 'store-contact':
        return <StoreContactScreen />;
      default:
        return <HomeScreen user={user} onFindMatch={setMatch} onScreenChange={handleScreenChange} />;
    }
  };

  const isStoreScreen = ['wallpaper-home', 'wallpaper-collection', 'wallpaper-details', 'wallpaper-library', 'wallpaper-manager', 'about-us', 'login', 'register', 'store-terms', 'store-privacy', 'store-refund', 'store-shipping', 'store-disclaimer', 'store-license', 'store-dmca', 'store-contact'].includes(currentScreen);

  const layoutContent = renderScreen();

  if (isStoreScreen) {
    return (
      <StoreLayout
        user={user}
        currentScreen={currentScreen}
        onNavigate={handleScreenChange}
        onBack={handleBack}
        canGoBack={canGoBack}
        onLogout={handleLogout}
        onOpenClutchZone={openClutchZone}
      >
        {layoutContent}
      </StoreLayout>
    );
  }

  return (
    <ClutchZoneLayout
      user={user}
      currentScreen={currentScreen}
      navVisible={navVisible}
      onNavigate={handleScreenChange}
      onBack={handleBack}
      canGoBack={canGoBack}
      onLogout={handleLogout}
    >
      {layoutContent}
    </ClutchZoneLayout>
  );
}

export default App;

