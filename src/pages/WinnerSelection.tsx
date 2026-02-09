/**
 * Winner Selection Page
 * 
 * The main feature of the app - users pick which mascot wins each matchup.
 * 
 * How it works:
 * 1. Bracket data is loaded based on selected year
 * 2. Users see two teams at a time and click to pick a winner
 * 3. Selections advance through rounds until a champion is picked
 * 4. Progress is shown for each region
 */

import { useState, useEffect, useRef, Fragment, useCallback, useMemo } from 'react';
import { useTitle } from '../hooks/useTitle';
import { useTournament } from '../hooks/useTournament';
import { useAuth } from '../hooks/useAuth';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker';
import { formatTeamName, formatMascotName } from '../constants/nicknames';
import { Team, Region, initializeBracket, saveBracket, publishBracket, loadBracket, saveTemporaryBracket, loadTemporaryBracket, addContributor, getSharedBrackets, loadBracketByUserId, leaveBracket, deleteBracket, TemporaryBracketData } from '../services/bracketService';
import { logAnalyticsEvent } from '../utils/analytics';
import ComingSoon from '../components/ComingSoon';
import RegionProgress from '../components/RegionProgress';
import ChampionView from '../components/ChampionView';
import TeamCard from '../components/TeamCard';
import SplitTeamCard from '../components/SplitTeamCard';
import { ImageModal, useImageExpansion, RenderImageWithMagnifier } from '../components/ImageModal';
import AddContributorModal from '../components/AddContributorModal';
import type { Gender, GenderCode } from '../types/bracket';
import type { RegionData, TeamData } from '../types/bracket';
import './WinnerSelection.css';

// Type for previous picks storage
type PreviousPicksMap = Record<string, Record<number, (TeamData | null)[]>>;

function WinnerSelection(): React.ReactElement {
    useTitle('Pick Your Bracket');
    const { safeNavigate, setBlocker, clearBlocker } = useNavigationBlocker();
    const { selectedYear, selectedGender, setSelectedGender, getBracketData, getRegionOrder, getFirstFourMapping, getCutoffTime, hasBracketData, getSelectionSundayTime } = useTournament();
    const { user } = useAuth();

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath: Gender = selectedGender === 'W' ? 'women' : 'men';

    // Bracket state
    const [regions, setRegions] = useState<Record<string, Region>>({});
    const [currentRegionName, setCurrentRegionName] = useState<string>('');
    const [currentMatchup, setCurrentMatchup] = useState<Team[]>([]);
    const [champion, setChampion] = useState<Team | null>(null);
    const [bracketName, setBracketName] = useState<string>('');
    const [saved, setSaved] = useState<boolean>(false);
    const [published, setPublished] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(true);
    const isInitializing = useRef<boolean>(false);
    const [hasOtherGenderBracket, setHasOtherGenderBracket] = useState<boolean>(true); // Default true to hide prompts until checked
    const { expandedImage, expandImage, closeImage } = useImageExpansion(); // For magnifying glass popup
    const [isModified, setIsModified] = useState<boolean>(false); // Track if bracket changed since last save
    const [previousPicks, setPreviousPicks] = useState<PreviousPicksMap>({}); // To track picks before reset

    // Contributor modal state
    const [showAddContributorModal, setShowAddContributorModal] = useState<boolean>(false);
    const [contributors, setContributors] = useState<string[]>([]);

    // Secondary owner state - when user is viewing a shared bracket they contribute to
    const [isSecondaryOwner, setIsSecondaryOwner] = useState<boolean>(false);
    const [ownerUid, setOwnerUid] = useState<string | null>(null);

    // --- Helper Functions ---

    // Check if we're past the cutoff time (no more saves/publishes allowed)
    const isPastCutoff = useCallback((): boolean => {
        const cutoff = getCutoffTime();
        return !!cutoff && new Date() >= cutoff;
    }, [getCutoffTime]);

    // Check if user has unsaved completed bracket
    const hasUnsavedBracket = useMemo(() => champion && !saved, [champion, saved]);

    // Randomize matchup order so higher seed isn't always first
    const setRandomizedMatchup = useCallback((matchup: [Team, Team] | null): void => {
        if (!matchup || matchup.length !== 2) {
            setCurrentMatchup(matchup || []);
            return;
        }
        // Simple random shuffle
        const shuffled = Math.random() > 0.5 ? [matchup[0], matchup[1]] : [matchup[1], matchup[0]];
        setCurrentMatchup(shuffled);
    }, []);

    // Save bracket state to memory
    const saveToMemory = useCallback((regionsData: Record<string, Region>, name: string, regionName: string, matchup: Team[]): void => {
        try {
            const memoryData: TemporaryBracketData = {
                regions: Object.keys(regionsData).reduce((acc, key) => {
                    acc[key] = regionsData[key]?.toDict?.() || null;
                    return acc;
                }, {} as Record<string, RegionData | null>),
                bracketName: name,
                currentRegionName: regionName,
                currentMatchup: matchup?.map(t => t?.toDict?.() || null) || []
            };
            saveTemporaryBracket(selectedYear, memoryData, genderPath);
        } catch (error) {
            console.error('Error saving to memory:', error);
        }
    }, [selectedYear, genderPath]);

    // Load bracket state from memory
    const loadFromMemory = useCallback((): { regions: Record<string, Region>; bracketName: string; currentRegionName: string; currentMatchup: (TeamData | null)[] } | null => {
        try {
            const memoryData = loadTemporaryBracket(selectedYear, genderPath);
            if (!memoryData) return null;

            const loadedRegions: Record<string, Region> = {};
            Object.keys(memoryData.regions).forEach(key => {
                const regionData = memoryData.regions[key];
                if (regionData) {
                    loadedRegions[key] = Region.fromDict(regionData, selectedYear);
                }
            });

            return {
                regions: loadedRegions,
                bracketName: memoryData.bracketName || '',
                currentRegionName: memoryData.currentRegionName || '',
                currentMatchup: memoryData.currentMatchup || []
            };
        } catch (error) {
            console.error('Error loading from memory:', error);
            return null;
        }
    }, [selectedYear, genderPath]);

    interface LoadedBracketData {
        regions: Record<string, Region>;
        name?: string;
        bracketName?: string;
        published?: boolean;
        contributors?: string[];
        contributorUids?: string[];
        ownerUid?: string;
    }

    // Apply a loaded bracket (from Firebase or memory) to state
    const applyLoadedBracket = useCallback((savedBracket: LoadedBracketData): void => {
        const regionOrderList = getRegionOrder() || [];
        setRegions(savedBracket.regions);
        setBracketName(savedBracket.name || savedBracket.bracketName || '');
        setSaved(!!savedBracket.name);
        setPublished(savedBracket.published || false);
        setIsModified(false);
        setContributors(savedBracket.contributors || []);

        // Check if we have a champion
        const finalFour = savedBracket.regions.final_four;
        if (finalFour && finalFour.getChampion()) {
            setChampion(finalFour.getChampion());
        } else {
            setChampion(null);
        }

        // Find first incomplete region to show
        const allRegions = [...regionOrderList, 'final_four'];
        let foundIncomplete = false;
        for (const regionName of allRegions) {
            const region = savedBracket.regions[regionName];
            if (region && !region.getChampion()) {
                setCurrentRegionName(regionName);
                setRandomizedMatchup(region.getCurrentMatchup() || null);
                foundIncomplete = true;
                break;
            }
        }
        // If all regions complete, show final four
        if (!foundIncomplete && savedBracket.regions.final_four) {
            setCurrentRegionName('final_four');
            setCurrentMatchup([]);
        }
    }, [getRegionOrder, setRandomizedMatchup]);

    // Check Firebase for saved bracket when user logs in
    const checkFirebaseBracket = useCallback(async (): Promise<void> => {
        if (!user) return;
        try {
            const sharedBrackets = await getSharedBrackets(user, selectedYear, genderPath);
            if (sharedBrackets.length > 0) {
                const sharedBracket = sharedBrackets[0];
                const fullBracket = await loadBracketByUserId(sharedBracket.ownerUid, selectedYear, genderPath);
                if (fullBracket) {
                    applyLoadedBracket({ ...fullBracket, ownerUid: sharedBracket.ownerUid });
                    setIsSecondaryOwner(true);
                    setOwnerUid(sharedBracket.ownerUid);
                    saveTemporaryBracket(selectedYear, null, genderPath);
                    return;
                }
            }
            setIsSecondaryOwner(false);
            setOwnerUid(null);
            const savedBracket = await loadBracket(user, selectedYear, genderPath);
            if (savedBracket) {
                applyLoadedBracket(savedBracket);
                saveTemporaryBracket(selectedYear, null, genderPath);
            }
        } catch (error) {
            console.error('Error checking Firebase bracket:', error);
        }
    }, [user, selectedYear, genderPath, applyLoadedBracket]);

    const initializeOrLoadBracket = useCallback(async (): Promise<void> => {
        if (isInitializing.current) return;
        isInitializing.current = true;
        setLoading(true);

        const bracketData = getBracketData();
        if (!bracketData) {
            setLoading(false);
            isInitializing.current = false;
            return;
        }

        const firstRegionKey = Object.keys(bracketData)[0];
        const memoryBracket = loadFromMemory();
        if (memoryBracket && Object.keys(memoryBracket.regions).length > 0) {
            applyLoadedBracket(memoryBracket);
        } else {
            const savedBracket = await loadBracket(user, selectedYear, genderPath);
            if (savedBracket) {
                applyLoadedBracket(savedBracket);
            } else {
                const regionOrderForYear = getRegionOrder();
                const firstFourMappingForYear = getFirstFourMapping();
                const newRegions = initializeBracket(selectedYear, bracketData, regionOrderForYear, firstFourMappingForYear);
                setRegions(newRegions);
                setBracketName('');
                setSaved(false);
                setPublished(false);
                setIsModified(false);
                setChampion(null);
                setContributors([]);
                setCurrentRegionName(firstRegionKey);
                setRandomizedMatchup(newRegions[firstRegionKey]?.getCurrentMatchup() || null);
            }
        }
        setLoading(false);
        isInitializing.current = false;
    }, [user, selectedYear, genderPath, applyLoadedBracket, getBracketData, getRegionOrder, getFirstFourMapping, loadFromMemory, setRandomizedMatchup]);

    const handleCreateOtherGender = useCallback((): void => {
        const newGender: GenderCode = selectedGender === 'M' ? 'W' : 'M';
        setSelectedGender(newGender);
    }, [selectedGender, setSelectedGender]);

    // --- Interaction Handlers ---

    const getCurrentRegion = useCallback((): Region | undefined => {
        return regions[currentRegionName];
    }, [regions, currentRegionName]);

    const selectWinner = useCallback((winner: Team): void => {
        const currentRegion = getCurrentRegion();
        if (!currentRegion) return;

        currentRegion.selectWinner(winner);

        let nextMatchup: [Team, Team] | null = null;
        let nextRegionName = currentRegionName;

        const regionChampion = currentRegion.getChampion();
        if (regionChampion) {
            const regionOrderList = [...(getRegionOrder() || []), 'final_four'];
            if (currentRegionName !== 'final_four') {
                const finalFour = regions.final_four;
                const idx = (getRegionOrder() || []).indexOf(currentRegionName);
                if (finalFour) finalFour.addTeam(regionChampion, idx);
            }

            let foundNext = false;
            for (const regionName of regionOrderList) {
                const region = regions[regionName];
                if (region && !region.getChampion()) {
                    nextRegionName = regionName;
                    nextMatchup = region.getCurrentMatchup() || null;
                    foundNext = true;
                    break;
                }
            }

            if (!foundNext) {
                setChampion(regions.final_four?.getChampion() || null);
            }
        } else {
            nextMatchup = currentRegion.getCurrentMatchup() || null;
        }

        const newRegions = { ...regions };
        setRegions(newRegions);
        setCurrentRegionName(nextRegionName);
        setRandomizedMatchup(nextMatchup);
        setSaved(false);
        setIsModified(true);
        saveToMemory(newRegions, bracketName, nextRegionName, nextMatchup || []);
    }, [regions, currentRegionName, getCurrentRegion, getRegionOrder, bracketName, saveToMemory, setRandomizedMatchup]);

    const resetRegion = useCallback((regionName: string): void => {
        const region = regions[regionName];
        if (region) {
            const bracketSnapshot = JSON.parse(JSON.stringify(region.toDict().bracket));
            setPreviousPicks(prev => ({ ...prev, [regionName]: bracketSnapshot }));

            region.reset();
            setChampion(null);
            setSaved(false);
            setIsModified(true);

            if (regionName !== 'final_four') {
                const finalFour = regions.final_four;
                const idx = (getRegionOrder() || []).indexOf(regionName);
                if (finalFour) finalFour.clearSlot(idx);
            }

            const newRegions = { ...regions };
            setRegions(newRegions);
            setCurrentRegionName(regionName);
            setRandomizedMatchup(region.getCurrentMatchup() || null);
        }
    }, [regions, getRegionOrder, setRandomizedMatchup]);

    const switchToRegion = useCallback((regionName: string): void => {
        const region = regions[regionName];
        if (region) {
            setCurrentRegionName(regionName);
            setRandomizedMatchup(region.getCurrentMatchup() || null);
        }
    }, [regions, setRandomizedMatchup]);

    const checkPreviousPick = useCallback((teamName: string): boolean => {
        const region = regions[currentRegionName];
        const prevBracket = previousPicks[currentRegionName];
        if (!region || !prevBracket) return false;

        const roundIndex = region.roundIndex;
        const matchupIndex = region.currentMatchupIndex;
        const nextRoundIndex = roundIndex + 1;
        const position = Math.floor(matchupIndex / 2);

        if (prevBracket[nextRoundIndex] && prevBracket[nextRoundIndex][position]) {
            return prevBracket[nextRoundIndex][position]?.name === teamName;
        }
        return false;
    }, [regions, currentRegionName, previousPicks]);

    const handleSaveBracket = useCallback(async (): Promise<void> => {
        if (!user) {
            safeNavigate('/login?redirect=/bracket/pick');
            return;
        }
        if (!bracketName.trim()) {
            alert('Please enter a bracket name');
            return;
        }

        try {
            if (published) {
                await publishBracket(user, selectedYear, regions, bracketName, champion, genderPath, true);
            } else {
                await saveBracket(user, selectedYear, regions, bracketName, false, genderPath);
            }
            setSaved(true);
            setIsModified(false);
            logAnalyticsEvent('bracket_save', { tournament_year: selectedYear, gender: genderPath, has_champion: !!champion, bracket_name: bracketName, user_name: user.displayName || '', has_saved_bracket: saved });
            alert('Bracket saved successfully!');
        } catch (error) {
            console.error('Error saving bracket:', error);
            alert('Failed to save bracket.');
        }
    }, [user, bracketName, published, selectedYear, regions, champion, genderPath, safeNavigate]);

    const handlePublishBracket = useCallback(async (): Promise<void> => {
        if (!saved) await handleSaveBracket();
        try {
            await publishBracket(user!, selectedYear, regions, bracketName, champion, genderPath);
            setPublished(true);
            logAnalyticsEvent('bracket_publish', { tournament_year: selectedYear, gender: genderPath, bracket_name: bracketName, user_name: user!.displayName || '', has_saved_bracket: saved });
            alert('Bracket published!');
            safeNavigate('/leaderboard');
        } catch (error) {
            console.error('Error publishing bracket:', error);
            alert('Failed to publish.');
        }
    }, [saved, handleSaveBracket, user, selectedYear, regions, bracketName, champion, genderPath, safeNavigate]);

    const handleAddContributor = useCallback(async (username: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: 'Not logged in' };
        const result = await addContributor(user, username, selectedYear, genderPath);
        if (result.success) {
            setContributors(prev => [...prev, result.addedDisplayName || username]);
            logAnalyticsEvent('add_contributor', { tournament_year: selectedYear, gender: genderPath, bracket_name: bracketName, user_name: user.displayName || '', has_saved_bracket: saved });
        }
        return result;
    }, [user, selectedYear, genderPath]);

    const handleLeaveBracket = useCallback(async (): Promise<void> => {
        if (!user || !ownerUid) return;
        if (!window.confirm('Leave this bracket?')) return;
        const result = await leaveBracket(user, ownerUid, selectedYear, genderPath);
        if (result.success) {
            logAnalyticsEvent('leave_bracket', { tournament_year: selectedYear, gender: genderPath, bracket_name: bracketName, user_name: user.displayName || '', has_saved_bracket: saved });
            setIsSecondaryOwner(false);
            setOwnerUid(null);
            await initializeOrLoadBracket();
        } else {
            alert(result.error);
        }
    }, [user, ownerUid, selectedYear, genderPath, initializeOrLoadBracket]);

    const handleDeleteBracket = useCallback(async (): Promise<void> => {
        if (!user) return;
        if (!window.confirm('Delete this bracket?')) return;
        const result = await deleteBracket(user, selectedYear, genderPath);
        if (result.success) {
            logAnalyticsEvent('bracket_delete', { tournament_year: selectedYear, gender: genderPath, bracket_name: bracketName, user_name: user.displayName || '', has_saved_bracket: saved });
            saveTemporaryBracket(selectedYear, null, genderPath);
            safeNavigate('/');
        }
    }, [user, selectedYear, genderPath, safeNavigate]);

    const handleEditPicks = useCallback((): void => {
        setChampion(null);
        const currentPicks: PreviousPicksMap = {};
        Object.keys(regions).forEach(name => {
            currentPicks[name] = JSON.parse(JSON.stringify(regions[name].toDict().bracket));
        });
        setPreviousPicks(currentPicks);
    }, [regions]);

    // --- Effects ---

    useEffect(() => {
        if (hasUnsavedBracket) {
            setBlocker(() => true, "Unsaved changes! Stay and save?");
        } else {
            clearBlocker();
        }
        return () => clearBlocker();
    }, [hasUnsavedBracket, setBlocker, clearBlocker]);

    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedBracket) {
                e.preventDefault();
                return e.returnValue = 'Unsaved changes!';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedBracket]);

    useEffect(() => {
        async function checkOtherGender() {
            if (user && champion) {
                const otherPath: Gender = selectedGender === 'W' ? 'men' : 'women';
                try {
                    const otherBracket = await loadBracket(user, selectedYear, otherPath);
                    setHasOtherGenderBracket(!!otherBracket);
                } catch (e) { console.error(e); }
            }
        }
        checkOtherGender();
    }, [user, champion, selectedYear, selectedGender]);

    useEffect(() => {
        const init = async () => {
            await Promise.resolve(); // Async tick to avoid synchronous setState linter error
            isInitializing.current = false;
            await initializeOrLoadBracket();
            if (user) await checkFirebaseBracket();
        };
        init();
    }, [user, initializeOrLoadBracket, checkFirebaseBracket]);

    useEffect(() => {
        const check = async () => {
            await Promise.resolve();
            if (user && !isInitializing.current) await checkFirebaseBracket();
        };
        check();
    }, [user, checkFirebaseBracket]);

    // --- Render logic ---

    if (loading) return <div className="winner-selection-container"><p>Loading...</p></div>;
    if (!hasBracketData()) return <ComingSoon year={selectedYear} selectionSundayTime={getSelectionSundayTime()} />;

    if (champion) {
        return (
            <>
                <ChampionView
                    champion={champion}
                    bracketName={bracketName}
                    setBracketName={setBracketName}
                    isPastCutoff={isPastCutoff()}
                    saved={saved}
                    published={published}
                    isModified={isModified}
                    user={user}
                    hasOtherGenderBracket={hasOtherGenderBracket}
                    selectedGender={selectedGender}
                    onEditPicks={handleEditPicks}
                    onViewBracket={() => safeNavigate('/bracket/view/full')}
                    onLogin={() => safeNavigate('/login?redirect=/bracket/pick')}
                    onSignup={() => safeNavigate('/signup')}
                    onSave={handleSaveBracket}
                    onPublish={handlePublishBracket}
                    onCreateOtherGender={handleCreateOtherGender}
                    setSaved={setSaved}
                    setIsModified={setIsModified}
                    contributors={contributors}
                    onOpenAddContributorModal={() => setShowAddContributorModal(true)}
                    isSecondaryOwner={isSecondaryOwner}
                    onLeaveBracket={handleLeaveBracket}
                    onDeleteBracket={handleDeleteBracket}
                />
                <AddContributorModal
                    isOpen={showAddContributorModal}
                    onClose={() => setShowAddContributorModal(false)}
                    onSubmit={handleAddContributor}
                    existingContributors={contributors}
                />
            </>
        );
    }

    const regionChamp = getCurrentRegion()?.getChampion() || null;

    return (
        <div className="winner-selection-container">
            <h2>Select Which Mascot You Like Best</h2>
            {isPastCutoff() && <div className="cutoff-warning-banner">⚠️ Tournament started. Changes cannot be saved.</div>}
            <p className="current-region">Region: <strong>{formatTeamName(currentRegionName)}</strong></p>

            {regionChamp ? (
                <div className="region-winner-display">
                    <h3>🏆 {formatTeamName(currentRegionName)} Region Winner</h3>
                    {regionChamp.image && <RenderImageWithMagnifier src={regionChamp.image} alt={regionChamp.name} className="region-winner-image" onExpand={expandImage} />}
                    <p className="mascot-name">{formatMascotName(regionChamp.name)}</p>
                    <p className="team-name">{formatTeamName(regionChamp.name)}</p>
                    <button className="secondary-btn" onClick={() => resetRegion(currentRegionName)} style={{ marginTop: '20px', width: '100%' }}>Reset This Region</button>
                </div>
            ) : currentMatchup.length === 2 && (
                <div className="matchup">
                    {currentMatchup.map((team, index) => (
                        <Fragment key={team.name}>
                            {team.name.includes('_or_') ? (
                                <SplitTeamCard team={team} onSelect={selectWinner} onExpandImage={expandImage} checkPreviousPick={checkPreviousPick} />
                            ) : (
                                <TeamCard team={team} onSelect={selectWinner} onExpandImage={expandImage} isPreviousPick={checkPreviousPick(team.name)} />
                            )}
                            {index === 0 && <span className="vs">VS</span>}
                        </Fragment>
                    ))}
                </div>
            )}

            <RegionProgress
                regionNames={[...(getRegionOrder() || []), 'final_four']}
                regions={regions}
                currentRegionName={currentRegionName}
                getRegionProgress={(name) => regions[name]?.getProgress() || [0, 0]}
                onSwitchRegion={switchToRegion}
            />
            <ImageModal src={expandedImage} onClose={closeImage} />
        </div>
    );
}

export default WinnerSelection;
