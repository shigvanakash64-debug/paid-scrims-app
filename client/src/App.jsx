import { useEffect, useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://paid-scrims-app.onrender.com/api';
const TOKEN_KEY = 'clutchzone_token';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setLoadingAuth(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          localStorage.removeItem(TOKEN_KEY);
          setLoadingAuth(false);
          return;
        }

        const data = await response.json();
        setUser(data.user);
        setCurrentScreen('home');
      } catch (error) {
        localStorage.removeItem(TOKEN_KEY);
      } finally {
        setLoadingAuth(false);
      }
    };

    restoreSession();
  }, []);

  const setSession = (userData, token) => {
    setUser(userData);
    localStorage.setItem(TOKEN_KEY, token);
    setCurrentScreen('home');
  };

  const clearSession = () => {
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    setCurrentMatch(null);
    setCurrentScreen('login');
  };

  const handleLogin = async ({ username, password }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Login failed');
        return;
      }

      setSession(data.user, data.token);
    } catch (error) {
      alert('Unable to login. Try again later.');
    }
  };

  const handleRegister = async ({ username, password, ffUid }) => {
    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password, ffUid: ffUid.trim() }),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Registration failed');
        return;
      }

      setSession(data.user, data.token);
    } catch (error) {
      alert('Unable to register. Try again later.');
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const handleProfileSave = async (updates) => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const response = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(data.error || 'Could not save profile changes');
        return;
      }

      setUser(data.user);
      alert('Profile updated successfully');
    } catch (error) {
      alert('Unable to update profile. Try again later.');
    }
  };

  const handleLogout = () => {
    clearSession();
  };

  const renderScreen = () => {
    if (loadingAuth) {
      return <div className="loading-screen">Loading...</div>;
    }

    if (!user) {
      if (currentScreen === 'register') {
        return <RegisterScreen onRegister={handleRegister} onNavigateLogin={() => setCurrentScreen('login')} />;
      }
      return <LoginScreen onLogin={handleLogin} onNavigateRegister={() => setCurrentScreen('register')} />;
    }

    switch (currentScreen) {
      case 'home':
        return <HomeScreen user={user} onFindMatch={setCurrentMatch} onScreenChange={setCurrentScreen} />;
      case 'match':
        return <MatchScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} />;
      case 'result':
        return <ResultScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} />;
      case 'wallet':
        return <WalletScreen user={user} />;
      case 'profile':
        return <ProfileScreen user={user} onUserUpdate={handleUserUpdate} onProfileSave={handleProfileSave} />;
      case 'settings':
        return <SettingsScreen user={user} />;
      default:
        return <HomeScreen user={user} onFindMatch={setCurrentMatch} onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="app">
      <Header user={user} onNavigate={setCurrentScreen} onLogout={handleLogout} />
      <div className="scroll-area">{renderScreen()}</div>
      {user && <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />}
    </div>
  );
}

export default App;
