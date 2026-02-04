/**
 * BracketView Page
 * 
 * Displays another user's bracket from the leaderboard.
 * Uses the same layout as FullBracket but loads data by user ID.
 * Does NOT affect the current user's picks or session storage.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import { loadBracketByUserId, leaveBracket, deleteBracket, Region } from '../services/bracketService';
import { loadCorrectBracket, CorrectBracket } from '../services/correctBracketService';
import { mensTournaments, womensTournaments } from '../constants/bracketData';
import { useAuth } from '../hooks/useAuth';
import FullBracketDisplay from '../components/FullBracketDisplay';
import type { Gender } from '../types/bracket';
import './FullBracket.css'; // Reuse FullBracket styles

interface LocationState {
    from?: string;
}

function BracketView(): React.ReactElement {
    const { year, uuid, gender } = useParams<{ year: string; uuid: string; gender: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const numericYear = parseInt(year || '2025', 10);

    // Convert gender from URL (default to 'men' if not provided)
    const genderPath: Gender = gender === 'women' ? 'women' : 'men';

    const [regions, setRegions] = useState<Record<string, Region>>({});
    const [loading, setLoading] = useState<boolean>(true);
    const [bracketName, setBracketName] = useState<string>('');
    const [userName, setUserName] = useState<string>('');

    useTitle(bracketName ? `${bracketName}` : 'View Bracket');
    const [contributors, setContributors] = useState<string[]>([]);
    const [contributorUids, setContributorUids] = useState<string[]>([]);
    const [ownerUid, setOwnerUid] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [correctBracket, setCorrectBracket] = useState<CorrectBracket | null>(null);

    // Determine back link destination
    const locationState = location.state as LocationState | null;
    const fromProfile = locationState?.from === 'profile';
    const backLink = fromProfile ? '/profile' : '/leaderboard';
    const backLinkText = fromProfile ? 'Back to Profile' : 'Back to Leaderboard';

    // Check if current user is a contributor to this bracket
    const isContributor = user && uuid && contributorUids.includes(user.uid);

    // Check if current user is the owner of this bracket
    const isOwner = user && ownerUid && user.uid === ownerUid;

    const loadSharedBracket = useCallback(async (): Promise<void> => {
        setLoading(true);
        setError(null);

        try {
            const bracket = await loadBracketByUserId(uuid!, numericYear, genderPath);
            if (bracket) {
                setRegions(bracket.regions);
                setBracketName(bracket.name || 'Unnamed Bracket');
                setUserName(bracket.userName || 'Anonymous');
                setContributors(bracket.contributors || []);
                setContributorUids(bracket.contributorUids || []);
                setOwnerUid(bracket.ownerUid || uuid || null);
            } else {
                setError('Bracket not found');
            }
        } catch (err) {
            console.error('Error loading shared bracket:', err);
            setError('Failed to load bracket');
        }

        setLoading(false);
    }, [uuid, numericYear, genderPath]);

    // Load the shared bracket and correct bracket on mount
    useEffect(() => {
        const loadAll = async () => {
            await Promise.resolve(); // Async tick
            await loadSharedBracket();
            const correct = await loadCorrectBracket(numericYear, genderPath);
            setCorrectBracket(correct);
        }
        loadAll();
    }, [loadSharedBracket, numericYear, genderPath]);

    // Handle leaving this bracket
    const handleLeaveBracket = async (): Promise<void> => {
        if (!user || !uuid) return;

        const confirmed = window.confirm(
            'Are you sure you want to leave this bracket? You will no longer be listed as a contributor.'
        );

        if (!confirmed) return;

        const result = await leaveBracket(user, uuid, numericYear, genderPath);

        if (result.success) {
            alert('You have left this bracket.');
            navigate('/leaderboard');
        } else {
            alert(result.error || 'Failed to leave bracket. Please try again.');
        }
    };

    // Handle deleting this bracket (owner only)
    const handleDeleteBracket = async (): Promise<void> => {
        if (!user || !isOwner) return;

        const confirmed = window.confirm(
            'Are you sure you want to delete this bracket? This action cannot be undone and will also remove your entry from the leaderboard.'
        );

        if (!confirmed) return;

        const result = await deleteBracket(user, numericYear, genderPath);

        if (result.success) {
            alert('Your bracket has been deleted.');
            navigate('/');
        } else {
            alert(result.error || 'Failed to delete bracket. Please try again.');
        }
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
            contributors={contributors}
            year={year || '2025'}
            backLink={backLink}
            backLinkText={backLinkText}
            regionOrder={currentRegionOrder}
            correctBracket={correctBracket}
            showCorrectAnswers={true}
            isContributor={isContributor || false}
            onLeaveBracket={handleLeaveBracket}
            isOwner={isOwner || false}
            onDeleteBracket={handleDeleteBracket}
        />
    );
}

export default BracketView;
