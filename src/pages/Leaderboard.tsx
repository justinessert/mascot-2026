/**
 * Leaderboard Page
 * 
 * Displays all published brackets ranked by score.
 * Shows user's own bracket stats at the top if logged in.
 * Allows viewing brackets after the tournament cutoff time.
 * Supports custom leaderboards with create/join functionality.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs, DocumentData } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { Team } from '../services/bracketService';
import {
    getAllCustomLeaderboardMeta,
    getCustomLeaderboardEntries,
    createCustomLeaderboard,
    joinCustomLeaderboard,
    hasPublishedBracket,
    getCustomLeaderboard,
    getUserCustomLeaderboards,
    leaveCustomLeaderboard,
    deleteCustomLeaderboard,
    CustomLeaderboardMeta,
} from '../services/leaderboardService';
import CreateOtherBracketPrompt from '../components/CreateOtherBracketPrompt';
import { loadBracket } from '../services/bracketService';
import ComingSoon from '../components/ComingSoon';
import LeaderboardSelector from '../components/LeaderboardSelector';
import CreateLeaderboardModal from '../components/CreateLeaderboardModal';
import JoinLeaderboardModal from '../components/JoinLeaderboardModal';
import type { Gender, GenderCode } from '../types/bracket';
import './Leaderboard.css';

interface LeaderboardBracket {
    id: string;
    bracketId: string;
    bracketName: string;
    userName: string;
    contributors?: string[];
    contributorUids?: string[];
    score: number;
    maxScore: number | null;
    champion: Team | null;
    rank?: number;
}

function Leaderboard(): React.ReactElement {
    const navigate = useNavigate();
    const { selectedYear, selectedGender, setSelectedGender, getCutoffTime, hasBracketData, getSelectionSundayTime } = useTournament();
    const { user } = useAuth();

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';

    // Leaderboard data state
    const [brackets, setBrackets] = useState<LeaderboardBracket[]>([]);
    const [userBracket, setUserBracket] = useState<LeaderboardBracket | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [showLoginBanner, setShowLoginBanner] = useState<boolean>(true);
    const [showPublishBanner, setShowPublishBanner] = useState<boolean>(true);

    // Custom leaderboard state
    const [selectedLeaderboardId, setSelectedLeaderboardId] = useState<string | null>(null);
    const [customLeaderboards, setCustomLeaderboards] = useState<CustomLeaderboardMeta[]>([]);
    const [loadingCustom, setLoadingCustom] = useState<boolean>(false);

    // User state
    const [userHasPublished, setUserHasPublished] = useState<boolean>(false);
    const [userIsMember, setUserIsMember] = useState<boolean>(false);
    const [userCustomLeaderboards, setUserCustomLeaderboards] = useState<CustomLeaderboardMeta[]>([]);
    const [showCustomLbPrompt, setShowCustomLbPrompt] = useState<boolean>(true);
    const [hasOtherGenderBracket, setHasOtherGenderBracket] = useState<boolean>(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
    const [joinLeaderboardName, setJoinLeaderboardName] = useState<string>('');

    // Tooltip state for disabled buttons
    const [showCreateTooltip, setShowCreateTooltip] = useState<boolean>(false);


    // Check if we're past the cutoff time (can view all brackets)
    const isPastCutoff = useCallback((): boolean => {
        const cutoff = getCutoffTime();
        return !!cutoff && new Date() >= cutoff;
    }, [getCutoffTime]);

    // Check if a bracket row is the current user's
    const isOwnBracket = useCallback((bracketId: string): boolean => {
        return !!user && bracketId === user.uid;
    }, [user]);

    // Get selected leaderboard info
    const selectedLeaderboardMeta = useMemo(() => {
        if (!selectedLeaderboardId) return null;
        return customLeaderboards.find(lb => lb.id === selectedLeaderboardId) || null;
    }, [selectedLeaderboardId, customLeaderboards]);

    // Load custom leaderboard metadata (and reset to global on year/gender change)
    useEffect(() => {
        // Reset to global leaderboard when year/gender changes
        setSelectedLeaderboardId(null);

        const loadCustomLeaderboards = async () => {
            try {
                const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
                setCustomLeaderboards(leaderboards);
            } catch (error) {
                console.error('Error loading custom leaderboards:', error);
            }
        };
        loadCustomLeaderboards();
    }, [selectedYear, genderPath]);

    // Check if user has published bracket
    useEffect(() => {
        const checkPublished = async () => {
            if (user) {
                const published = await hasPublishedBracket(user, selectedYear, genderPath);
                setUserHasPublished(published);
            } else {
                setUserHasPublished(false);
            }
        };
        checkPublished();
    }, [user, selectedYear, genderPath]);

    // Check if user is member of selected custom leaderboard
    useEffect(() => {
        const checkMembership = async () => {
            if (!user || !selectedLeaderboardId) {
                setUserIsMember(selectedLeaderboardId === null); // Always "member" of global
                return;
            }
            const leaderboard = await getCustomLeaderboard(selectedLeaderboardId, selectedYear, genderPath);
            setUserIsMember(leaderboard?.memberIds.includes(user.uid) || false);
        };
        checkMembership();
    }, [user, selectedLeaderboardId, selectedYear, genderPath]);

    // Check what custom leaderboards the user is in
    useEffect(() => {
        const checkUserLeaderboards = async () => {
            if (user) {
                const userLbs = await getUserCustomLeaderboards(user, selectedYear, genderPath);
                setUserCustomLeaderboards(userLbs);
            } else {
                setUserCustomLeaderboards([]);
            }
        };
        checkUserLeaderboards();
    }, [user, selectedYear, genderPath]);

    // Check if user has the OTHER gender bracket for this year
    useEffect(() => {
        const checkOtherGender = async (): Promise<void> => {
            if (user) {
                // Determine opposite gender path
                const otherGenderPath: Gender = selectedGender === 'W' ? 'men' : 'women';
                try {
                    const otherBracket = await loadBracket(user, selectedYear, otherGenderPath);
                    setHasOtherGenderBracket(!!otherBracket);
                } catch (error) {
                    console.error('Error checking other gender bracket:', error);
                }
            }
        };
        checkOtherGender();
    }, [user, selectedYear, selectedGender]);

    // Load leaderboard data
    useEffect(() => {
        loadLeaderboard();
    }, [selectedYear, selectedGender, user, selectedLeaderboardId]);

    const loadLeaderboard = async (): Promise<void> => {
        setLoading(true);

        try {
            let bracketList: LeaderboardBracket[] = [];

            if (selectedLeaderboardId) {
                // Load custom leaderboard entries
                setLoadingCustom(true);
                const entries = await getCustomLeaderboardEntries(selectedLeaderboardId, selectedYear, genderPath);
                bracketList = entries.map(entry => ({
                    id: entry.id,
                    bracketId: entry.bracketId,
                    bracketName: entry.bracketName,
                    userName: entry.userName,
                    contributors: entry.contributors || [],
                    contributorUids: entry.contributorUids || [],
                    score: entry.score,
                    maxScore: entry.maxScore,
                    champion: entry.champion ? Team.fromDict(entry.champion as { name: string; seed: number }, selectedYear) : null,
                }));
                setLoadingCustom(false);
            } else {
                // Load global leaderboard entries
                const leaderboardRef = collection(db, `leaderboard/${genderPath}/years/${selectedYear}/entries`);
                const snapshot = await getDocs(leaderboardRef);

                snapshot.forEach(doc => {
                    const data: DocumentData = doc.data();
                    bracketList.push({
                        id: doc.id,
                        bracketId: data.bracketId || '',
                        bracketName: data.bracketName || 'Unknown',
                        userName: data.userName || 'Anonymous',
                        contributors: data.contributors || [],
                        contributorUids: data.contributorUids || [],
                        score: data.score ?? 0,
                        maxScore: data.maxScore ?? null,
                        champion: data.champion ? Team.fromDict(data.champion, selectedYear) : null,
                    });
                });
            }

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
    const viewBracket = (bracketId: string): void => {
        // Allow viewing if past cutoff OR if it's the user's own bracket
        if (isPastCutoff() || isOwnBracket(bracketId)) {
            const genderParam = selectedGender === 'W' ? 'women' : 'men';
            navigate(`/bracket/${selectedYear}/${bracketId}/${genderParam}`);
        }
    };

    // Handle create leaderboard
    const handleCreateLeaderboard = async (name: string, description: string, password: string): Promise<void> => {
        if (!user) throw new Error('Must be logged in');

        const leaderboardId = await createCustomLeaderboard(user, selectedYear, name, description, password, genderPath);

        // Refresh custom leaderboards list
        const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
        setCustomLeaderboards(leaderboards);

        // Switch to the newly created leaderboard
        setSelectedLeaderboardId(leaderboardId);
    };

    // Handle join leaderboard button click
    const handleJoinClick = (): void => {
        if (!selectedLeaderboardId) {
            // On global leaderboard - can't join that
            return;
        }

        if (!user) {
            // Not logged in - can't join
            return;
        }



        // Check if leaderboard has password
        if (selectedLeaderboardMeta?.hasPassword) {
            setJoinLeaderboardName(selectedLeaderboardMeta.name);
            setShowJoinModal(true);
        } else {
            // No password - join directly
            handleJoinLeaderboard('');
        }
    };

    // Handle join leaderboard
    const handleJoinLeaderboard = async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!user || !selectedLeaderboardId) {
            return { success: false, error: 'Must be logged in and select a leaderboard' };
        }

        const result = await joinCustomLeaderboard(user, selectedLeaderboardId, selectedYear, password, genderPath);

        if (result.success) {
            // Refresh membership status
            setUserIsMember(true);
            // Refresh leaderboard data
            await loadLeaderboard();
            // Refresh custom leaderboards to update member count
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
        }

        return result;
    };

    // Handle leave leaderboard
    const handleLeaveLeaderboard = async (): Promise<void> => {
        if (!user || !selectedLeaderboardId) return;

        if (!window.confirm('Are you sure you want to leave this leaderboard?')) {
            return;
        }

        const result = await leaveCustomLeaderboard(user, selectedLeaderboardId, selectedYear, genderPath);

        if (result.success) {
            setUserIsMember(false);
            await loadLeaderboard();
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
            // Optional: Switch to global if they leave? Or stay and show "Join"?
            // Staying and showing "Join" is fine.
        } else {
            alert(result.error || 'Failed to leave leaderboard');
        }
    };

    // Handle delete leaderboard
    const handleDeleteLeaderboard = async (): Promise<void> => {
        if (!user || !selectedLeaderboardId) return;

        if (!window.confirm('Are you sure you want to delete this leaderboard? This action cannot be undone.')) {
            return;
        }

        const result = await deleteCustomLeaderboard(user, selectedLeaderboardId, selectedYear, genderPath);

        if (result.success) {
            // Reset to global
            setSelectedLeaderboardId(null);
            // Refresh list
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
        } else {
            alert(result.error || 'Failed to delete leaderboard');
        }
    };

    // Handle dismissing the custom leaderboard prompt
    const dismissCustomLbPrompt = (): void => {
        setShowCustomLbPrompt(false);
    };

    // Handle create button click (with disabled state handling)
    const handleCreateClick = (): void => {
        if (!userHasPublished) {
            setShowCreateTooltip(true);
            setTimeout(() => setShowCreateTooltip(false), 2000);
            return;
        }
        setShowCreateModal(true);
    };

    const handleCreateOtherGender = (): void => {
        const newGender: GenderCode = selectedGender === 'M' ? 'W' : 'M';
        setSelectedGender(newGender);
        navigate('/bracket/pick');
    };

    // Check if user is a contributor on any bracket in the list
    const isContributor = useMemo(() => {
        if (!user || brackets.length === 0) return false;
        return brackets.some(b => b.contributorUids?.includes(user.uid));
    }, [user, brackets]);

    const canCreate = user && userHasPublished;

    const canJoin = user && userHasPublished && selectedLeaderboardId !== null && !userIsMember;

    const canLeave = user && selectedLeaderboardId !== null && userIsMember;

    const canDelete = user && selectedLeaderboardId !== null && selectedLeaderboardMeta?.creatorId === user.uid;

    // Show coming soon if no bracket data for this year
    if (!hasBracketData()) {
        return <ComingSoon year={selectedYear} selectionSundayTime={getSelectionSundayTime()} />;
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
            {user && !userBracket && !isContributor && showPublishBanner && !loading && selectedLeaderboardId === null && (
                <CreateOtherBracketPrompt
                    targetGender={selectedGender}
                    onCreate={() => navigate('/bracket/pick')}
                    onDismiss={() => setShowPublishBanner(false)}
                    message="Create & publish a bracket to get on the leaderboard"
                />
            )}

            {/* Custom Leaderboard Prompt - Show if published but only in global (no custom groups) */}
            {user && userHasPublished && userCustomLeaderboards.length === 0 && showCustomLbPrompt && (
                <div className="info-banner custom-lb-prompt">
                    <div className="prompt-content">
                        <strong>Want to compete with friends?</strong>
                        <span>Create or join a custom leaderboard to see how you stack up against them!</span>
                    </div>
                    <button className="close-btn" onClick={dismissCustomLbPrompt}>×</button>
                </div>
            )}

            {/* Leaderboard Controls Row (Selector + Action Buttons) */}
            <div className="leaderboard-controls">
                <div className="selector-row">
                    <LeaderboardSelector
                        customLeaderboards={customLeaderboards}
                        selectedId={selectedLeaderboardId}
                        onSelect={setSelectedLeaderboardId}
                        loading={loading || loadingCustom}
                    />
                </div>

                <div className="leaderboard-actions">
                    <div className="action-button-wrapper">
                        <button
                            className={`action-btn ${!canCreate ? 'disabled' : ''}`}
                            onClick={handleCreateClick}
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            Create Leaderboard
                        </button>
                        {showCreateTooltip && (
                            <div className="action-tooltip">
                                Publish a bracket first to create a leaderboard
                            </div>
                        )}
                    </div>

                    {canJoin && (
                        <div className="action-button-wrapper">
                            <button
                                className="action-btn"
                                onClick={handleJoinClick}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                    <circle cx="8.5" cy="7" r="4"></circle>
                                    <line x1="20" y1="8" x2="20" y2="14"></line>
                                    <line x1="23" y1="11" x2="17" y2="11"></line>
                                </svg>
                                Join
                            </button>
                        </div>
                    )}

                    {canLeave && (
                        <div className="action-button-wrapper">
                            <button
                                className="action-btn danger-btn"
                                onClick={handleLeaveLeaderboard}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                                    <polyline points="16 17 21 12 16 7"></polyline>
                                    <line x1="21" y1="12" x2="9" y2="12"></line>
                                </svg>
                                Leave
                            </button>
                        </div>
                    )}

                    {canDelete && (
                        <div className="action-button-wrapper">
                            <button
                                className="action-btn danger-btn"
                                onClick={handleDeleteLeaderboard}
                                title="Delete Leaderboard"
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            </div>

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
                    <p>
                        {selectedLeaderboardId
                            ? 'Be the first to join and appear on this leaderboard.'
                            : 'Be the first to publish your bracket and claim the top spot.'}
                    </p>
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
                                        <td>
                                            {bracket.contributors && bracket.contributors.length > 0
                                                ? `${bracket.userName} & ${bracket.contributors.join(' & ')}`
                                                : bracket.userName
                                            }
                                        </td>
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

            {/* Cross-Gender Promotion - only if top prompt is NOT visible */}
            {user && !hasOtherGenderBracket && !(user && !userBracket && !isContributor && showPublishBanner && selectedLeaderboardId === null) && (
                <CreateOtherBracketPrompt
                    targetGender={selectedGender === 'M' ? 'W' : 'M'}
                    onCreate={handleCreateOtherGender}
                    message={`Compete in the ${selectedGender === 'M' ? "Women's" : "Men's"} leaderboard${userHasPublished ? ' as well' : ''}!`}
                />
            )}

            {/* Modals */}
            <CreateLeaderboardModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                onCreate={handleCreateLeaderboard}
            />

            <JoinLeaderboardModal
                isOpen={showJoinModal}
                leaderboardName={joinLeaderboardName}
                onClose={() => setShowJoinModal(false)}
                onJoin={handleJoinLeaderboard}
            />
        </div >
    );
}

export default Leaderboard;
