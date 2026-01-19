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
import { useTournament } from '../hooks/useTournament.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { Team } from '../services/bracketService';
import { cutOffTimes, womensCutOffTimes } from '../constants/bracketData';
import ComingSoon from '../components/ComingSoon';
import './Leaderboard.css';

function Leaderboard() {
    const navigate = useNavigate();
    const { selectedYear, selectedGender, hasBracketData } = useTournament();
    const { user } = useAuth();

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath = selectedGender === 'W' ? 'women' : 'men';

    const [brackets, setBrackets] = useState([]);
    const [userBracket, setUserBracket] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showLoginBanner, setShowLoginBanner] = useState(true);
    const [showPublishBanner, setShowPublishBanner] = useState(true);

    // Check if we're past the cutoff time (can view all brackets)
    const isPastCutoff = () => {
        const cutoffMap = selectedGender === 'W' ? womensCutOffTimes : cutOffTimes;
        const cutoff = cutoffMap[selectedYear];
        return cutoff && new Date() >= cutoff;
    };

    // Check if a bracket row is the current user's
    const isOwnBracket = (bracketId) => {
        return user && bracketId === user.uid;
    };

    // Load leaderboard data
    useEffect(() => {
        loadLeaderboard();
    }, [selectedYear, selectedGender, user]);

    const loadLeaderboard = async () => {
        setLoading(true);

        try {
            const leaderboardRef = collection(db, `leaderboard/${genderPath}/years/${selectedYear}/entries`);
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
        // Allow viewing if past cutoff OR if it's the user's own bracket
        if (isPastCutoff() || isOwnBracket(bracketId)) {
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
                                <th>Champion</th>
                                <th>Bracket Name</th>
                                <th>User</th>
                                <th>Score</th>
                                {isPastCutoff() && <th>Max</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {brackets.map((bracket) => {
                                const canView = isPastCutoff() || isOwnBracket(bracket.bracketId);
                                const showChampion = isPastCutoff() || isOwnBracket(bracket.bracketId);

                                return (
                                    <tr
                                        key={bracket.id}
                                        onClick={() => viewBracket(bracket.bracketId)}
                                        className={`
                                            ${canView ? 'clickable' : 'locked'}
                                            ${isOwnBracket(bracket.bracketId) ? 'user-row' : ''}
                                        `}
                                    >
                                        <td className="rank-cell">{bracket.rank}</td>
                                        <td className="champion-cell">
                                            {showChampion ? (
                                                bracket.champion?.image && (
                                                    <img src={bracket.champion.image} alt={bracket.champion.name} />
                                                )
                                            ) : (
                                                <div className="hidden-champion" title="Revealed after tournament starts">
                                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                                        <circle cx="12" cy="12" r="10"></circle>
                                                        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                                    </svg>
                                                </div>
                                            )}
                                        </td>
                                        <td>{bracket.bracketName}</td>
                                        <td>{bracket.userName}</td>
                                        <td className="score-cell">{bracket.score}</td>
                                        {isPastCutoff() && <td>{bracket.maxScore ?? '-'}</td>}
                                    </tr>
                                );
                            })}
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
