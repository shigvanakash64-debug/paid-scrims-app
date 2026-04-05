import { useState, useEffect } from 'react';
import { HomeScreen } from './screens/HomeScreen';
import { MatchScreen } from './screens/MatchScreen';
import { ResultScreen } from './screens/ResultScreen';
import { WalletScreen } from './screens/WalletScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import './App.css';

function App() {
  const [currentScreen, setCurrentScreen] = useState('home');
  const [user, setUser] = useState(null);
  const [currentMatch, setCurrentMatch] = useState(null);

  // Mock user data - in real app, this would come from API
  useEffect(() => {
    setUser({
      id: '1',
      username: 'Player123',
      balance: 250,
      trustScore: 85,
      matchesPlayed: 45,
      matchesWon: 28,
      disputesRaised: 2
    });
  }, []);

  const renderScreen = () => {
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
        return <ProfileScreen user={user} />;
      default:
        return <HomeScreen user={user} onFindMatch={setCurrentMatch} onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="app">
      <Header user={user} />
      <main className="main-content">
        {renderScreen()}
      </main>
      <BottomNav currentScreen={currentScreen} onScreenChange={setCurrentScreen} />
    </div>
  );
}

export default App;
                <img className="logo" src={viteLogo} alt="" />
                Explore Vite
              </a>
            </li>
            <li>
              <a href="https://react.dev/" target="_blank">
                <img className="button-icon" src={reactLogo} alt="" />
                Learn more
              </a>
            </li>
          </ul>
        </div>
        <div id="social">
          <svg className="icon" role="presentation" aria-hidden="true">
            <use href="/icons.svg#social-icon"></use>
          </svg>
          <h2>Connect with us</h2>
          <p>Join the Vite community</p>
          <ul>
            <li>
              <a href="https://github.com/vitejs/vite" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#github-icon"></use>
                </svg>
                GitHub
              </a>
            </li>
            <li>
              <a href="https://chat.vite.dev/" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#discord-icon"></use>
                </svg>
                Discord
              </a>
            </li>
            <li>
              <a href="https://x.com/vite_js" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#x-icon"></use>
                </svg>
                X.com
              </a>
            </li>
            <li>
              <a href="https://bsky.app/profile/vite.dev" target="_blank">
                <svg
                  className="button-icon"
                  role="presentation"
                  aria-hidden="true"
                >
                  <use href="/icons.svg#bluesky-icon"></use>
                </svg>
                Bluesky
              </a>
            </li>
          </ul>
        </div>
      </section>

      <div className="ticks"></div>
      <section id="spacer"></section>
    </>
  )
}

export default App
