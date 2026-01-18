import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useTournament } from '../hooks/useTournament.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { getUserBracketHistory } from '../services/bracketService';
import HistoryTable from '../components/HistoryTable';
import { bracketData, womensBracketData } from '../constants/bracketData';
import './Profile.css';

function Profile() {
    const { user, logout } = useAuth();
    const { setSelectedYear, setSelectedGender } = useTournament();
    const navigate = useNavigate();
    const [menHistory, setMenHistory] = useState([]);
    const [womenHistory, setWomenHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
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
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleCreateBracket = (gender) => {
        // 1. Set Gender Context
        const genderCode = gender === 'men' ? 'M' : 'W';
        setSelectedGender(genderCode);

        // 2. Set Year Context (Latest available for that gender)
        const data = gender === 'men' ? bracketData : womensBracketData;
        const years = Object.keys(data).map(Number).sort((a, b) => b - a);
        const latestYear = years[0] || 2025;
        setSelectedYear(latestYear);

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
                        {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
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
