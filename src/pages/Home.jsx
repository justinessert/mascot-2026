import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { loadBracket } from '../services/bracketService';
import HowItWorks from '../components/HowItWorks';
import './Home.css';

/**
 * Home page component
 * Entry point for the application
 */
function Home() {
    const { selectedYear, selectedGender } = useTournament();
    const { user } = useAuth();
    const [hasBracket, setHasBracket] = useState(false);
    const [loading, setLoading] = useState(true);

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath = selectedGender === 'W' ? 'women' : 'men';

    // Check if user has a saved bracket for the selected year
    useEffect(() => {
        const checkBracket = async () => {
            if (user) {
                try {
                    const savedBracket = await loadBracket(user, selectedYear, genderPath);
                    setHasBracket(!!savedBracket);
                } catch (error) {
                    console.error('Error checking bracket:', error);
                    setHasBracket(false);
                }
            } else {
                setHasBracket(false);
            }
            setLoading(false);
        };
        checkBracket();
    }, [user, selectedYear, selectedGender]);

    return (
        <div className="home-container">
            <div className="hero-section">
                <h1>🏀 Mascot Madness {selectedYear}</h1>
                <p className="tagline">Build your bracket based on who has the better mascot!</p>

                <div className="cta-buttons">
                    {!loading && hasBracket ? (
                        <Link to="/bracket/view/full" className="primary-button">
                            View Your Bracket
                        </Link>
                    ) : (
                        <Link to="/bracket/pick" className="primary-button">
                            Start Picking
                        </Link>
                    )}
                    <Link to="/leaderboard" className="secondary-button">
                        View Leaderboard
                    </Link>
                </div>
            </div>

            <HowItWorks />
        </div>
    );
}

export default Home;

