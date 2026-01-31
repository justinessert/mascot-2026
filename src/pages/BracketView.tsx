/**
 * BracketView Page
 * 
 * Displays another user's bracket from the leaderboard.
 * Uses the same layout as FullBracket but loads data by user ID.
 * Does NOT affect the current user's picks or session storage.
 */

import { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { loadBracketByUserId, Region } from '../services/bracketService';
import { loadCorrectBracket, CorrectBracket } from '../services/correctBracketService';
import { mensTournaments, womensTournaments } from '../constants/bracketData';
import FullBracketDisplay from '../components/FullBracketDisplay';
import type { Gender } from '../types/bracket';
import './FullBracket.css'; // Reuse FullBracket styles

interface LocationState {
    from?: string;
}

function BracketView(): React.ReactElement {
    const { year, uuid, gender } = useParams<{ year: string; uuid: string; gender: string }>();
    const location = useLocation();
    const numericYear = parseInt(year || '2025', 10);

    // Convert gender from URL (default to 'men' if not provided)
    const genderPath: Gender = gender === 'women' ? 'women' : 'men';

    const [regions, setRegions] = useState<Record<string, Region>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [bracketName, setBracketName] = useState<string>('');
    const [userName, setUserName] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [correctBracket, setCorrectBracket] = useState<CorrectBracket | null>(null);

    // Determine back link destination
    const locationState = location.state as LocationState | null;
    const fromProfile = locationState?.from === 'profile';
    const backLink = fromProfile ? '/profile' : '/leaderboard';
    const backLinkText = fromProfile ? 'Back to Profile' : 'Back to Leaderboard';

    // Load the shared bracket and correct bracket on mount
    useEffect(() => {
        loadSharedBracket();
        loadCorrectBracket(numericYear, genderPath).then(setCorrectBracket);
    }, [year, uuid, gender]);

    const loadSharedBracket = async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const bracket = await loadBracketByUserId(uuid!, numericYear, genderPath);
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
                    <Link to={backLink} className="back-link">← {backLinkText}</Link>
                </div>
            </div>
        );
    }

    // Get region order from tournament config
    const tournaments = genderPath === 'women' ? womensTournaments : mensTournaments;
    const config = tournaments[numericYear] || tournaments[2025];
    const currentRegionOrder = config?.regionOrder || [];

    return (
        <FullBracketDisplay
            regions={regions}
            bracketName={bracketName}
            userName={userName}
            year={year || '2025'}
            backLink={backLink}
            backLinkText={backLinkText}
            regionOrder={currentRegionOrder}
            correctBracket={correctBracket}
            showCorrectAnswers={true}
        />
    );
}

export default BracketView;

