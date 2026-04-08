import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { MatchProvider } from './contexts/MatchContext.jsx'
import { UserProvider } from './contexts/UserContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserProvider>
      <MatchProvider>
        <App />
      </MatchProvider>
    </UserProvider>
  </StrictMode>,
)
