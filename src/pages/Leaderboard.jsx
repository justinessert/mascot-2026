/**
 * Leaderboard Page
 * 
 * Displays all published brackets ranked by score.
 * Shows user's own bracket stats at the top if logged in.
 * Allows viewing brackets after the tournament cutoff time.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useYear } from '../hooks/useYear.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { Team } from '../services/bracketService';
import { cutOffTimes } from '../constants/bracketData';
import ComingSoon from '../components/ComingSoon';
import './Leaderboard.css';

function Leaderboard() {
    const navigate = useNavigate();
    const { selectedYear, hasBracketData } = useYear();
    const { user } = useAuth();

    const [brackets, setBrackets] = useState([]);
    const [userBracket, setUserBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginBanner, setShowLoginBanner] = useState(true);
    const [showPublishBanner, setShowPublishBanner] = useState(true);

    // Check if we're past the cutoff time (can view brackets)
    const isPastCutoff = () => {
        const cutoff = cutOffTimes[selectedYear];
        return cutoff && new Date() >= cutoff;
    };

    // Load leaderboard data
    useEffect(() => {
        loadLeaderboard();
    }, [selectedYear, user]);

    const loadLeaderboard = async () => {
        setLoading(true);

        try {
            const leaderboardRef = collection(db, `leaderboard/${selectedYear}/data`);
            const snapshot = await getDocs(leaderboardRef);

            const bracketList = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                bracketList.push({
                    id: doc.id,
                    bracketId: data.bracketId || '',
                    bracketName: data.bracketName || 'Unknown',
                    userName: data.userName || 'Anonymous',
                    score: data.score ?? 0,
                    maxScore: data.maxScore ?? null,
                    champion: data.champion ? Team.fromDict(data.champion, selectedYear) : null,
                });
            });

            // Sort by score (descending)
            bracketList.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

            // Assign ranks with tie handling
            let rank = 1;
            for (let i = 0; i < bracketList.length; i++) {
                if (i > 0 && bracketList[i].score === bracketList[i - 1].score) {
                    bracketList[i].rank = bracketList[i - 1].rank;
                } else {
                    bracketList[i].rank = rank;
                }
                rank++;
            }

            setBrackets(bracketList);

            // Find user's bracket if logged in
            if (user) {
                const userEntry = bracketList.find(b => b.bracketId === user.uid);
                setUserBracket(userEntry || null);
            } else {
                setUserBracket(null);
            }

        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }

        setLoading(false);
    };

    // Handle clicking on a bracket row
    const viewBracket = (bracketId) => {
        if (isPastCutoff()) {
            navigate(`/bracket/${selectedYear}/${bracketId}`);
        }
    };

    // Show coming soon if no bracket data for this year
    if (!hasBracketData()) {
        return <ComingSoon year={selectedYear} />;
    }

    return (
        <div className="leaderboard-container">
            {/* Info Banners */}
            {!user && showLoginBanner && (
                <div className="info-banner">
                    ℹ️ Log in to see your stats!
                    <button className="close-btn" onClick={() => setShowLoginBanner(false)}>×</button>
                </div>
            )}
            {user && !userBracket && showPublishBanner && !loading && (
                <div className="info-banner">
                    ℹ️ Create & publish a bracket to get on the leaderboard
                    <button className="close-btn" onClick={() => setShowPublishBanner(false)}>×</button>
                </div>
            )}

            {/* User Stats Header */}
            {user && (
                <div className="leaderboard-header">
                    <div className="header-item">
                        <span className="header-label">Your Bracket</span>
                        <span className="header-value">{userBracket?.bracketName || 'N/A'}</span>
                    </div>
                    <div className="header-item">
                        <span className="header-label">Score</span>
                        <span className="header-value">{userBracket?.score ?? 'N/A'}</span>
                    </div>
                    <div className="header-item">
                        <span className="header-label">Rank</span>
                        <span className="header-value">{userBracket?.rank ?? 'N/A'}</span>
                    </div>
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="loading-message">Loading leaderboard...</div>
            )}

            {/* Empty State */}
            {!loading && brackets.length === 0 && (
                <div className="empty-message">
                    <h3>🏀 No brackets published yet!</h3>
                    <p>Be the first to publish your bracket and claim the top spot.</p>
                </div>
            )}

            {/* Leaderboard Table */}
            {!loading && brackets.length > 0 && (
                <div className="table-wrapper">
                    <table className="leaderboard-table">
                        <thead>
                            <tr>
                                <th>Rank</th>
                                {isPastCutoff() && <th>Champion</th>}
                                <th>Bracket Name</th>
                                <th>User</th>
                                <th>Score</th>
                                {isPastCutoff() && <th>Max</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {brackets.map((bracket) => (
                                <tr
                                    key={bracket.id}
                                    onClick={() => viewBracket(bracket.bracketId)}
                                    className={`
                                        ${isPastCutoff() ? 'clickable' : ''}
                                        ${user && bracket.bracketId === user.uid ? 'user-row' : ''}
                                    `}
                                >
                                    <td className="rank-cell">{bracket.rank}</td>
                                    {isPastCutoff() && (
                                        <td className="champion-cell">
                                            {bracket.champion?.image && (
                                                <img src={bracket.champion.image} alt={bracket.champion.name} />
                                            )}
                                        </td>
                                    )}
                                    <td>{bracket.bracketName}</td>
                                    <td>{bracket.userName}</td>
                                    <td className="score-cell">{bracket.score}</td>
                                    {isPastCutoff() && <td>{bracket.maxScore ?? '-'}</td>}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {!isPastCutoff() && !loading && brackets.length > 0 && (
                <div className="info-note">
                    🔒 Brackets will be viewable after the tournament starts
                </div>
            )}
        </div>
    );
}

export default Leaderboard;
