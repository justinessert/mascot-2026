/**
 * BracketView Page
 * 
 * Displays another user's bracket from the leaderboard.
 * Uses the same layout as FullBracket but loads data by user ID.
 * Does NOT affect the current user's picks or session storage.
 */

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadBracketByUserId } from '../services/bracketService';
import FullBracketDisplay from '../components/FullBracketDisplay';
import './FullBracket.css'; // Reuse FullBracket styles

function BracketView() {
    const { year, uuid } = useParams();
    const numericYear = parseInt(year, 10);

    const [regions, setRegions] = useState({});
    const [loading, setLoading] = useState(true);
    const [bracketName, setBracketName] = useState('');
    const [userName, setUserName] = useState('');
    const [error, setError] = useState(null);

    // Load the shared bracket on mount
    useEffect(() => {
        loadSharedBracket();
    }, [year, uuid]);

    const loadSharedBracket = async () => {
        setLoading(true);
        setError(null);

        try {
            const bracket = await loadBracketByUserId(uuid, numericYear);
            if (bracket) {
                setRegions(bracket.regions);
                setBracketName(bracket.name || 'Unnamed Bracket');
                setUserName(bracket.userName || 'Anonymous');
            } else {
                setError('Bracket not found');
            }
        } catch (err) {
            console.error('Error loading shared bracket:', err);
            setError('Failed to load bracket');
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="full-bracket-container">
                <p>Loading bracket...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="full-bracket-container">
                <div className="bracket-error">
                    <h2>⚠️ {error}</h2>
                    <p>The bracket you're looking for could not be found.</p>
                    <Link to="/leaderboard" className="back-link">← Back to Leaderboard</Link>
                </div>
            </div>
        );
    }

    return (
        <FullBracketDisplay
            regions={regions}
            bracketName={bracketName}
            userName={userName}
            year={year}
            backLink="/leaderboard"
            backLinkText="Back to Leaderboard"
        />
    );
}

export default BracketView;
