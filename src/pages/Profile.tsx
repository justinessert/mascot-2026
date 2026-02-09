import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTournament } from '../hooks/useTournament';
import { useNavigate, Link } from 'react-router-dom';
import { useTitle } from '../hooks/useTitle';
import { getUserBracketHistory, BracketHistoryEntry } from '../services/bracketService';
import HistoryTable from '../components/HistoryTable';
import { mensTournaments, womensTournaments } from '../constants/bracketData';
import type { Gender, GenderCode, TournamentConfig } from '../types/bracket';
import { logAnalyticsEvent } from '../utils/analytics';
import './Profile.css';

function Profile(): React.ReactElement {
    useTitle('Profile');
    const { user, logout } = useAuth();
    const { setSelectedYear, setSelectedGender } = useTournament();
    const navigate = useNavigate();
    const [menHistory, setMenHistory] = useState<BracketHistoryEntry[]>([]);
    const [womenHistory, setWomenHistory] = useState<BracketHistoryEntry[]>([]);
    const [loading, setLoading] = useState<boolean>(false);

    const loadHistory = useCallback(async (): Promise<void> => {
        if (!user) return; // Added check for user
        setLoading(true);
        try {
            const [menData, womenData] = await Promise.all([
                getUserBracketHistory(user, 'men'),
                getUserBracketHistory(user, 'women')
            ]);
            setMenHistory(menData);
            setWomenHistory(womenData);
        } catch (error) {
            console.error('Error loading history:', error);
        }
        setLoading(false);
    }, [user]); // Dependency array for useCallback

    useEffect(() => {
        const load = async () => {
            await Promise.resolve(); // "Tick trick"
            if (user) {
                await loadHistory();
            }
        };
        load();
    }, [user, loadHistory]); // Added loadHistory to dependencies

    const handleLogout = async (): Promise<void> => {
        try {
            await logout();
            logAnalyticsEvent('logout');
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleCreateBracket = (gender: Gender): void => {
        // 1. Set Gender Context
        const genderCode: GenderCode = gender === 'men' ? 'M' : 'W';
        setSelectedGender(genderCode);

        // 2. Set Year Context (Latest available year that has actual data)
        const tournaments = gender === 'men' ? mensTournaments : womensTournaments;
        const years = Object.keys(tournaments).map(Number).sort((a, b) => b - a);

        // Find the first year that has actual bracket data (not null)
        const latestYearWithData = years.find(year => {
            const config: TournamentConfig | undefined = tournaments[year];
            if (!config || !config.regions) return false;
            const firstRegionKey = Object.keys(config.regions)[0];
            return firstRegionKey && config.regions[firstRegionKey]?.length > 0;
        }) || 2025;

        setSelectedYear(latestYearWithData);

        // 3. Navigate
        navigate('/bracket/pick');
    };

    if (!user) {
        return (
            <div className="profile-container">
                <div className="profile-card">
                    <p>Please log in to view your profile.</p>
                    <Link to="/login" className="profile-btn secondary">Log In</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <div className="profile-avatar">
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : (user.email?.charAt(0).toUpperCase() || 'U')}
                    </div>
                    <h1>Your Profile</h1>
                </div>

                <div className="profile-details">
                    <div className="detail-item">
                        <label>Display Name</label>
                        <div className="detail-value">{user.displayName || 'Not set'}</div>
                    </div>

                    <div className="detail-item">
                        <label>Email</label>
                        <div className="detail-value">{user.email}</div>
                    </div>
                </div>

                <div className="profile-history">
                    <HistoryTable
                        title="Men's Tournament History"
                        data={menHistory}
                        loading={loading}
                        emptyMessage="No men's brackets created yet."
                        onAction={() => handleCreateBracket('men')}
                        actionLabel="Create Men's Bracket"
                    />

                    <HistoryTable
                        title="Women's Tournament History"
                        data={womenHistory}
                        loading={loading}
                        emptyMessage="No women's brackets created yet."
                        onAction={() => handleCreateBracket('women')}
                        actionLabel="Create Women's Bracket"
                    />
                </div>

                <div className="profile-actions">
                    <button onClick={handleLogout} className="profile-btn danger">
                        Log Out
                    </button>
                    <Link to="/" className="profile-link">
                        Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default Profile;
