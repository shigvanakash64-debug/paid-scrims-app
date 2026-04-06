import { useState } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RegisterScreen } from './screens/RegisterScreen';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);

  const handleLogin = ({ username }) => {
    setUser({
      id: Date.now().toString(),
      username: username.trim(),
      balance: 0,
      trustScore: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      disputesRaised: 0,
      ffUid: '',
      transactions: [],
      history: []
    });
    setCurrentScreen('home');
  };

  const handleRegister = ({ username, ffUid }) => {
    setUser({
      id: Date.now().toString(),
      username: username.trim(),
      balance: 0,
      trustScore: 0,
      matchesPlayed: 0,
      matchesWon: 0,
      disputesRaised: 0,
      ffUid: ffUid.trim(),
      transactions: [],
      history: []
    });
    setCurrentScreen('home');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentScreen('login');
    setCurrentMatch(null);
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
  };

  const renderScreen = () => {
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
        return <ProfileScreen user={user} onUserUpdate={handleUserUpdate} />;
      default:
        return <HomeScreen user={user} onFindMatch={setCurrentMatch} onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="app">
      <Header user={user} onNavigate={setCurrentScreen} onLogout={handleLogout} />
      <div className="scroll-area">
        {renderScreen()}
      </div>
      {user && <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />}
    </div>
  );
}

export default App;
