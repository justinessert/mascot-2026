import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './hooks/useAuth.jsx'
import { TournamentProvider } from './hooks/useTournament.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <TournamentProvider>
        <App />
      </TournamentProvider>
    </AuthProvider>
  </StrictMode>,
)
