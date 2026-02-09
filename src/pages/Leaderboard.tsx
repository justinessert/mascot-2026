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
import { useTitle } from '../hooks/useTitle';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { Team, hasSavedBracket } from '../services/bracketService';
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
import ComingSoon from '../components/ComingSoon';
import LeaderboardSelector from '../components/LeaderboardSelector';
import CreateLeaderboardModal from '../components/CreateLeaderboardModal';
import JoinLeaderboardModal from '../components/JoinLeaderboardModal';
import type { Gender, GenderCode } from '../types/bracket';
import { logAnalyticsEvent } from '../utils/analytics';
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
    useTitle('Leaderboard');
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
    const [userHasBracket, setUserHasBracket] = useState<boolean>(false);
    const [userIsMember, setUserIsMember] = useState<boolean>(false);
    const [userCustomLeaderboards, setUserCustomLeaderboards] = useState<CustomLeaderboardMeta[]>([]);
    const [showCustomLbPrompt, setShowCustomLbPrompt] = useState<boolean>(true);
    // const [hasOtherGenderBracket, setHasOtherGenderBracket] = useState<boolean>(true);

    // Modal state
    const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
    const [showJoinModal, setShowJoinModal] = useState<boolean>(false);
    const [joinLeaderboardName, setJoinLeaderboardName] = useState<string>('');

    // Tooltip state for disabled buttons
    const [showCreateTooltip, setShowCreateTooltip] = useState<boolean>(false);

    // Track prev year/gender for reseting selection
    const [prevYear, setPrevYear] = useState(selectedYear);
    const [prevGender, setPrevGender] = useState(selectedGender);

    // Adjusting state during render is allowed for resets
    if (prevYear !== selectedYear || prevGender !== selectedGender) {
        setPrevYear(selectedYear);
        setPrevGender(selectedGender);
        if (selectedLeaderboardId !== null) {
            setSelectedLeaderboardId(null);
        }
    }

    // --- Helper Functions ---

    const isPastCutoff = useCallback((): boolean => {
        const cutoff = getCutoffTime();
        return !!cutoff && new Date() >= cutoff;
    }, [getCutoffTime]);

    const isOwnBracket = useCallback((bracketId: string): boolean => {
        return !!user && bracketId === user.uid;
    }, [user]);

    const selectedLeaderboardMeta = useMemo(() => {
        if (!selectedLeaderboardId) return null;
        return customLeaderboards.find(lb => lb.id === selectedLeaderboardId) || null;
    }, [selectedLeaderboardId, customLeaderboards]);

    const loadLeaderboard = useCallback(async (): Promise<void> => {
        setLoading(true);
        try {
            let bracketList: LeaderboardBracket[] = [];
            if (selectedLeaderboardId) {
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

            bracketList.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
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
            setUserBracket(user ? bracketList.find(b => b.bracketId === user.uid) || null : null);
        } catch (error) {
            console.error('Error loading leaderboard:', error);
        }
        setLoading(false);
    }, [selectedLeaderboardId, selectedYear, genderPath, user]);

    const handleCreateLeaderboard = async (name: string, description: string, password: string): Promise<void> => {
        if (!user) throw new Error('Must be logged in');
        const leaderboardId = await createCustomLeaderboard(user, selectedYear, name, description, password, genderPath);
        const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
        setCustomLeaderboards(leaderboards);
        setSelectedLeaderboardId(leaderboardId);
        logAnalyticsEvent('create_custom_leaderboard', { tournament_year: selectedYear, leaderboard_name: name, has_password: !!password, gender: genderPath, has_saved_bracket: userHasBracket });
    };

    const handleJoinLeaderboard = async (password: string): Promise<{ success: boolean; error?: string }> => {
        if (!user || !selectedLeaderboardId) return { success: false, error: 'Initialization error' };
        const result = await joinCustomLeaderboard(user, selectedLeaderboardId, selectedYear, password, genderPath);
        if (result.success) {
            logAnalyticsEvent('join_custom_leaderboard', { tournament_year: selectedYear, gender: genderPath, leaderboard_name: selectedLeaderboardMeta?.name || '', has_saved_bracket: userHasBracket });
            setUserIsMember(true);
            await loadLeaderboard();
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
        }
        return result;
    };

    const handleLeaveLeaderboard = async (): Promise<void> => {
        if (!user || !selectedLeaderboardId) return;
        if (!window.confirm('Leave this leaderboard?')) return;
        const result = await leaveCustomLeaderboard(user, selectedLeaderboardId, selectedYear, genderPath);
        if (result.success) {
            logAnalyticsEvent('leave_custom_leaderboard', { tournament_year: selectedYear, gender: genderPath, leaderboard_name: selectedLeaderboardMeta?.name || '', has_saved_bracket: userHasBracket });
            setUserIsMember(false);
            await loadLeaderboard();
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
        }
    };

    const handleDeleteLeaderboard = async (): Promise<void> => {
        if (!user || !selectedLeaderboardId) return;
        if (!window.confirm('Delete this leaderboard?')) return;
        const result = await deleteCustomLeaderboard(user, selectedLeaderboardId, selectedYear, genderPath);
        if (result.success) {
            logAnalyticsEvent('delete_custom_leaderboard', { tournament_year: selectedYear, gender: genderPath, leaderboard_name: selectedLeaderboardMeta?.name || '', has_saved_bracket: userHasBracket });
            setSelectedLeaderboardId(null);
            const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
            setCustomLeaderboards(leaderboards);
        }
    };

    const handleJoinClick = (): void => {
        if (!selectedLeaderboardId || !user) return;
        if (selectedLeaderboardMeta?.hasPassword) {
            setJoinLeaderboardName(selectedLeaderboardMeta.name);
            setShowJoinModal(true);
        } else {
            handleJoinLeaderboard('');
        }
    };

    const handleCreateOtherGender = (): void => {
        const newGender: GenderCode = selectedGender === 'M' ? 'W' : 'M';
        setSelectedGender(newGender);
        navigate('/bracket/pick');
    };

    // --- Effects ---

    // Reset selection when year/gender changes (render phase check to avoid effect warning)
    if (prevYear !== selectedYear || prevGender !== selectedGender) {
        setPrevYear(selectedYear);
        setPrevGender(selectedGender);
        if (selectedLeaderboardId !== null) {
            setSelectedLeaderboardId(null);
        }
    }

    useEffect(() => {
        const loadMeta = async () => {
            try {
                const leaderboards = await getAllCustomLeaderboardMeta(selectedYear, genderPath);
                setCustomLeaderboards(leaderboards);
            } catch (e) { console.error(e); }
        };
        loadMeta();
    }, [selectedYear, genderPath]);

    useEffect(() => {
        const init = async () => {
            await Promise.resolve();
            await loadLeaderboard();
        };
        init();
    }, [loadLeaderboard]);

    useEffect(() => {
        const checkStatus = async () => {
            if (user) {
                const [published, userLbs, hasBracket] = await Promise.all([
                    hasPublishedBracket(user, selectedYear, genderPath),
                    getUserCustomLeaderboards(user, selectedYear, genderPath),
                    hasSavedBracket(user, selectedYear, genderPath)
                ]);
                setUserHasPublished(published);
                setUserCustomLeaderboards(userLbs);
                setUserHasBracket(hasBracket);
            } else {
                setUserHasPublished(false);
                setUserCustomLeaderboards([]);
                setUserHasBracket(false);
            }
        };
        checkStatus();
    }, [user, selectedYear, genderPath]);

    useEffect(() => {
        const checkMembership = async () => {
            if (!user || !selectedLeaderboardId) {
                setUserIsMember(selectedLeaderboardId === null);
                return;
            }
            const lb = await getCustomLeaderboard(selectedLeaderboardId, selectedYear, genderPath);
            setUserIsMember(lb?.memberIds.includes(user.uid) || false);
        };
        checkMembership();
    }, [user, selectedLeaderboardId, selectedYear, genderPath]);

    useEffect(() => {
        // const checkOther = async () => {
        //     if (user) {
        //         const otherPath: Gender = selectedGender === 'W' ? 'men' : 'women';
        //         try {
        //             // const otherBracket = await loadBracket(user, selectedYear, otherPath);
        //             // setHasOtherGenderBracket(!!otherBracket);
        //         } catch (e) { console.error(e); }
        //     }
        // };
        // checkOther();
    }, [user, selectedYear, selectedGender]);

    // --- Render ---

    if (!hasBracketData()) return <ComingSoon year={selectedYear} selectionSundayTime={getSelectionSundayTime()} />;

    const canCreate = user && userHasPublished;
    const canJoin = user && userHasPublished && selectedLeaderboardId !== null && !userIsMember;
    const canLeave = user && selectedLeaderboardId !== null && userIsMember;
    const canDelete = user && selectedLeaderboardId !== null && selectedLeaderboardMeta?.creatorId === user.uid;

    return (
        <div className="leaderboard-container">
            {!user && showLoginBanner && (
                <div className="info-banner">
                    ℹ️ Log in to see your stats!
                    <button className="close-btn" onClick={() => setShowLoginBanner(false)}>×</button>
                </div>
            )}
            {user && !userBracket && !brackets.some(b => b.contributorUids?.includes(user.uid)) && showPublishBanner && !loading && selectedLeaderboardId === null && (
                <CreateOtherBracketPrompt targetGender={selectedGender} onCreate={() => navigate('/bracket/pick')} onDismiss={() => setShowPublishBanner(false)} message="Create & publish a bracket to get on the leaderboard" />
            )}
            {/* Cross-Gender Promotion - only if top prompt is NOT visible */}
            {user && !(user && !userBracket && !brackets.some(b => b.contributorUids?.includes(user.uid)) && showPublishBanner && selectedLeaderboardId === null) && (
                <CreateOtherBracketPrompt
                    targetGender={selectedGender === 'M' ? 'W' : 'M'}
                    onCreate={handleCreateOtherGender}
                    message={`Compete in the ${selectedGender === 'M' ? "Women's" : "Men's"} leaderboard${userHasPublished ? ' as well' : ''}!`}
                />
            )}{user && userHasPublished && userCustomLeaderboards.length === 0 && showCustomLbPrompt && (
                <div className="info-banner custom-lb-prompt">
                    <div className="prompt-content"><strong>Want to compete with friends?</strong><span>Create or join a custom leaderboard!</span></div>
                    <button className="close-btn" onClick={() => setShowCustomLbPrompt(false)}>×</button>
                </div>
            )}

            <div className="leaderboard-controls">
                <LeaderboardSelector customLeaderboards={customLeaderboards} selectedId={selectedLeaderboardId} onSelect={setSelectedLeaderboardId} loading={loading || loadingCustom} />
                <div className="leaderboard-actions">
                    <div className="action-button-wrapper">
                        <button className={`action-btn ${!canCreate ? 'disabled' : ''}`} onClick={() => !canCreate ? (setShowCreateTooltip(true), setTimeout(() => setShowCreateTooltip(false), 2000)) : setShowCreateModal(true)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            Create
                        </button>
                        {showCreateTooltip && <div className="action-tooltip">Publish a bracket first</div>}
                    </div>
                    {canJoin && <button className="action-btn" onClick={handleJoinClick}>Join</button>}
                    {canLeave && <button className="action-btn danger-btn" onClick={handleLeaveLeaderboard}>Leave</button>}
                    {canDelete && (
                        <button className="action-btn danger-btn" onClick={handleDeleteLeaderboard}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    )}
                </div>
            </div>

            {user && (
                <div className="leaderboard-header">
                    <div className="header-item"><span className="header-label">Bracket</span><span className="header-value">{userBracket?.bracketName || 'N/A'}</span></div>
                    <div className="header-item"><span className="header-label">Score</span><span className="header-value">{userBracket?.score ?? 'N/A'}</span></div>
                    <div className="header-item"><span className="header-label">Rank</span><span className="header-value">{userBracket?.rank ?? 'N/A'}</span></div>
                </div>
            )}

            {loading ? <div className="loading-message">Loading...</div> : brackets.length === 0 ? (
                <div className="empty-message"><h3>🏀 No brackets yet!</h3></div>
            ) : (
                <div className="table-wrapper">
                    <table className="leaderboard-table">
                        <thead><tr><th>Rank</th><th>Champion</th><th>Bracket</th><th>User</th><th>Score</th>{isPastCutoff() && <th>Max</th>}</tr></thead>
                        <tbody>
                            {brackets.map((b) => {
                                const canView = isPastCutoff() || isOwnBracket(b.bracketId);
                                return (
                                    <tr key={b.id} onClick={() => { if (canView) { logAnalyticsEvent('view_bracket', { tournament_year: selectedYear, gender: genderPath, is_own_bracket: isOwnBracket(b.bracketId), has_saved_bracket: userHasBracket }); navigate(`/bracket/${selectedYear}/${b.bracketId}/${selectedGender === 'W' ? 'women' : 'men'}`); } }} className={`${canView ? 'clickable' : 'locked'} ${isOwnBracket(b.bracketId) ? 'user-row' : ''}`}>
                                        <td>{b.rank}</td>
                                        <td className="champion-cell">{canView ? b.champion?.image && <img src={b.champion.image} alt="" /> : "🔒"}</td>
                                        <td>{b.bracketName}</td>
                                        <td>{b.contributors?.length ? `${b.userName} & ${b.contributors.join(' & ')}` : b.userName}</td>
                                        <td>{b.score}</td>
                                        {isPastCutoff() && <td>{b.maxScore ?? '-'}</td>}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {!isPastCutoff() && !loading && brackets.length > 0 && <div className="info-note">🔒 Brackets revealed after tournament starts</div>}

            <CreateLeaderboardModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onCreate={handleCreateLeaderboard} />
            <JoinLeaderboardModal isOpen={showJoinModal} leaderboardName={joinLeaderboardName} onClose={() => setShowJoinModal(false)} onJoin={handleJoinLeaderboard} />
        </div>
    );
}

export default Leaderboard;
