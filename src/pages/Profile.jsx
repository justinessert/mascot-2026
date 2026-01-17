import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { getUserBracketHistory } from '../services/bracketService';
import './Profile.css';
import '../pages/Leaderboard.css'; // Reuse table styles

function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user) {
            loadHistory();
        }
    }, [user]);

    const loadHistory = async () => {
        setLoading(true);
        try {
            const data = await getUserBracketHistory(user);
            setHistory(data);
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
                    <h3>Bracket History</h3>
                    {loading && <div className="loading-text">Loading history...</div>}

                    {!loading && history.length === 0 && (
                        <p className="no-history">No brackets created yet.</p>
                    )}

                    {!loading && history.length > 0 && (
                        <div className="table-wrapper">
                            <table className="leaderboard-table profile-table">
                                <thead>
                                    <tr>
                                        <th>Year</th>
                                        <th>Champion</th>
                                        <th>Bracket Name</th>
                                        <th>Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((bracket) => (
                                        <tr
                                            key={bracket.year}
                                            onClick={() => navigate(`/bracket/${bracket.year}/${bracket.bracketId}`, { state: { from: 'profile' } })}
                                            className="clickable"
                                        >
                                            <td className="year-cell">{bracket.year}</td>
                                            <td className="champion-cell">
                                                {bracket.champion?.image && (
                                                    <img src={bracket.champion.image} alt={bracket.champion.name} />
                                                )}
                                            </td>
                                            <td>{bracket.bracketName}</td>
                                            <td className="score-cell">{bracket.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
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
