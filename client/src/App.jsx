import { useEffect, useState } from 'react';
import axios from 'axios';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { PairingScreen } from './screens/PairingScreen';
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
        const response = await axios.get(`${API_BASE}/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setUser(response.data.user);
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
      const response = await axios.post(`${API_BASE}/auth/login`, {
        username: username.trim(),
        password,
      });
      setSession(response.data.user, response.data.token);
    } catch (error) {
      alert(error.response?.data?.error || 'Login failed');
    }
  };

  const handleRegister = async ({ username, password }) => {
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const response = await axios.post(`${API_BASE}/auth/register`, {
        username: normalizedUsername,
        password,
      });
      setSession(response.data.user, response.data.token);
    } catch (error) {
      if (error.response?.status === 409) {
        alert('Username already exists. Choose a different username.');
      } else {
        alert(error.response?.data?.error || 'Registration failed');
      }
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
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
      setUser(response.data.user);
      alert('Profile updated successfully');
    } catch (error) {
      alert(error.response?.data?.error || 'Could not save profile changes');
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
        return <HomeScreen user={user} onFindMatch={setCurrentMatch} onScreenChange={setCurrentScreen} currentMatch={currentMatch} />;
      case 'match':
        return <MatchScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} />;
      case 'result':
        return <ResultScreen match={currentMatch} user={user} onScreenChange={setCurrentScreen} />;
      case 'pairing':
        return (
          <PairingScreen
            match={currentMatch}
            user={user}
            onScreenChange={setCurrentScreen}
            onMatchSelect={setCurrentMatch}
          />
        );
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
