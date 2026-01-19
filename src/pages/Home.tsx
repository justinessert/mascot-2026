import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { loadBracket } from '../services/bracketService';
import HowItWorks from '../components/HowItWorks';
import type { Gender } from '../types/bracket';
import './Home.css';

/**
 * Home page component
 * Entry point for the application
 */
function Home(): React.ReactElement {
    const { selectedYear, selectedGender } = useTournament();
    const { user } = useAuth();
    const [hasBracket, setHasBracket] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';

    // Check if user has a saved bracket for the selected year
    useEffect(() => {
        const checkBracket = async (): Promise<void> => {
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
    }, [user, selectedYear, selectedGender, genderPath]);

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
