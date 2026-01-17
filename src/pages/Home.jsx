import { Link } from 'react-router-dom';
import { useYear } from '../hooks/useYear.jsx';
import './Home.css';

/**
 * Home page component
 * Entry point for the application
 */
function Home() {
    const { selectedYear } = useYear();

    return (
        <div className="home-container">
            <div className="hero-section">
                <h1>🏀 Mascot Madness {selectedYear}</h1>
                <p className="tagline">Build your bracket based on who has the better mascot!</p>

                <div className="cta-buttons">
                    <Link to="/bracket/pick" className="primary-button">
                        Start Picking
                    </Link>
                    <Link to="/leaderboard" className="secondary-button">
                        View Leaderboard
                    </Link>
                </div>
            </div>

            <div className="info-section">
                <h2>How It Works</h2>
                <div className="steps">
                    <div className="step">
                        <span className="step-number">1</span>
                        <h3>Pick Your Winners</h3>
                        <p>Choose which mascot you think would win in each matchup</p>
                    </div>
                    <div className="step">
                        <span className="step-number">2</span>
                        <h3>View Your Bracket</h3>
                        <p>See your complete bracket and share it with friends</p>
                    </div>
                    <div className="step">
                        <span className="step-number">3</span>
                        <h3>Compete</h3>
                        <p>Watch the leaderboard as the tournament progresses</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;
