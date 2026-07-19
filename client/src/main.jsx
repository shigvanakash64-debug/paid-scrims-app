import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MatchProvider } from './contexts/MatchContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <NotificationProvider>
        <MatchProvider>
          <App />
        </MatchProvider>
      </NotificationProvider>
    </UserProvider>
  </StrictMode>,
)
