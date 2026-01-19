import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider } from './hooks/useAuth'
import { TournamentProvider } from './hooks/useTournament'

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
    <StrictMode>
        <AuthProvider>
            <TournamentProvider>
                <App />
            </TournamentProvider>
        </AuthProvider>
    </StrictMode>,
)
