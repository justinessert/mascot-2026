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

import { useState, useEffect, useRef } from 'react';
import { useTournament } from '../hooks/useTournament.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { useNavigationBlocker } from '../hooks/useNavigationBlocker.jsx';
import { bracketData, cutOffTimes, regionOrder, womensBracketData, womensCutOffTimes } from '../constants/bracketData';
import { getMascotName, formatTeamName, formatMascotName } from '../constants/nicknames';
import { Team, Region, initializeBracket, saveBracket, publishBracket, loadBracket, saveTemporaryBracket, loadTemporaryBracket } from '../services/bracketService';
import ComingSoon from '../components/ComingSoon';
import './WinnerSelection.css';

function WinnerSelection() {
    const { safeNavigate, setBlocker, clearBlocker } = useNavigationBlocker();
    const { selectedYear, selectedGender, setSelectedGender, getBracketData, getRegionOrder, getFirstFourMapping } = useTournament();
    const { user } = useAuth();

    // Convert UI gender ('M'/'W') to service gender ('men'/'women')
    const genderPath = selectedGender === 'W' ? 'women' : 'men';

    // Bracket state
    const [regions, setRegions] = useState({});
    const [currentRegionName, setCurrentRegionName] = useState('');
    const [currentMatchup, setCurrentMatchup] = useState([]);
    const [champion, setChampion] = useState(null);
    const [bracketName, setBracketName] = useState('');
    const [saved, setSaved] = useState(false);
    const [published, setPublished] = useState(false);
    const [loading, setLoading] = useState(true);
    const isInitializing = useRef(false);
    const [hasOtherGenderBracket, setHasOtherGenderBracket] = useState(true); // Default true to hide prompts until checked
    const [expandedImage, setExpandedImage] = useState(null); // For magnifying glass popup
    const [isModified, setIsModified] = useState(false); // Track if bracket changed since last save
    const [previousPicks, setPreviousPicks] = useState({}); // To track picks before reset

    // Check if we're past the cutoff time (no more saves/publishes allowed)
    const isPastCutoff = () => {
        const cutoffMap = selectedGender === 'W' ? womensCutOffTimes : cutOffTimes;
        const cutoff = cutoffMap[selectedYear];
        return cutoff && new Date() >= cutoff;
    };

    // Check if user has unsaved completed bracket
    const hasUnsavedBracket = champion && !saved;

    // Register navigation blocker when there's an unsaved bracket
    useEffect(() => {
        if (hasUnsavedBracket) {
            setBlocker(
                () => true,  // Block condition - always block when this is set
                "You haven't saved your bracket yet! If you leave now, your selections won't be saved."
            );
        } else {
            clearBlocker();
        }

        // Cleanup on unmount
        return () => clearBlocker();
    }, [hasUnsavedBracket, setBlocker, clearBlocker]);

    // Handle browser refresh/close (this still needs to be in the component)
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            if (hasUnsavedBracket) {
                e.preventDefault();
                e.returnValue = 'You have an unsaved bracket. Are you sure you want to leave?';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [hasUnsavedBracket]);

    // Check if user has the OTHER gender bracket for this year
    useEffect(() => {
        const checkOtherGender = async () => {
            if (user && champion) {
                // Determine opposite gender path
                const otherGenderPath = selectedGender === 'W' ? 'men' : 'women';
                try {
                    const otherBracket = await loadBracket(user, selectedYear, otherGenderPath);
                    setHasOtherGenderBracket(!!otherBracket);
                } catch (error) {
                    console.error('Error checking other gender bracket:', error);
                }
            }
        };
        checkOtherGender();
    }, [user, champion, selectedYear, selectedGender]);

    const handleCreateOtherGender = () => {
        const newGender = selectedGender === 'M' ? 'W' : 'M';
        setSelectedGender(newGender);
        // The change in selectedGender will trigger the main useEffect to re-initialize the bracket
    };

    // Save bracket state to memory
    const saveToMemory = (regionsData, name, regionName, matchup) => {
        try {
            const memoryData = {
                regions: Object.keys(regionsData).reduce((acc, key) => {
                    acc[key] = regionsData[key]?.toDict?.() || null;
                    return acc;
                }, {}),
                bracketName: name,
                currentRegionName: regionName,
                currentMatchup: matchup?.map(t => t?.toDict?.() || null) || []
            };
            saveTemporaryBracket(selectedYear, memoryData, genderPath);
        } catch (error) {
            console.error('Error saving to memory:', error);
        }
    };

    // Load bracket state from memory
    const loadFromMemory = () => {
        try {
            const memoryData = loadTemporaryBracket(selectedYear, genderPath);
            if (!memoryData) return null;

            const loadedRegions = {};
            Object.keys(memoryData.regions).forEach(key => {
                if (memoryData.regions[key]) {
                    loadedRegions[key] = Region.fromDict(memoryData.regions[key], selectedYear);
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
    };

    // Randomize matchup order so higher seed isn't always first
    const setRandomizedMatchup = (matchup) => {
        if (!matchup || matchup.length !== 2) {
            setCurrentMatchup(matchup || []);
            return;
        }
        // Simple random shuffle
        const shuffled = Math.random() > 0.5 ? [matchup[0], matchup[1]] : [matchup[1], matchup[0]];
        setCurrentMatchup(shuffled);
    };

    // Initialize bracket when year or gender changes (user handled separately)
    useEffect(() => {
        isInitializing.current = false; // Reset when year/gender changes
        initializeOrLoadBracket();
    }, [selectedYear, selectedGender]);

    // Handle user login - check if Firebase has saved bracket
    useEffect(() => {
        if (user && !isInitializing.current) {
            checkFirebaseBracket();
        }
    }, [user]);

    // Check Firebase for saved bracket when user logs in
    const checkFirebaseBracket = async () => {
        try {
            const savedBracket = await loadBracket(user, selectedYear, genderPath);
            if (savedBracket) {
                // Firebase has saved bracket - use it and override memory
                applyLoadedBracket(savedBracket);
                saveTemporaryBracket(selectedYear, null, genderPath); // Clear memory if loading from persistence
            }
            // If no saved bracket in Firebase, keep current memory state
        } catch (error) {
            console.error('Error checking Firebase bracket:', error);
        }
    };

    // Apply a loaded bracket (from Firebase or memory) to state
    const applyLoadedBracket = (savedBracket) => {
        const regionOrder = getRegionOrder();
        setRegions(savedBracket.regions);
        setBracketName(savedBracket.name || savedBracket.bracketName || '');
        setSaved(!!savedBracket.name);
        setPublished(savedBracket.published || false);
        setIsModified(false);

        // Check if we have a champion
        const finalFour = savedBracket.regions.final_four;
        if (finalFour && finalFour.getChampion()) {
            setChampion(finalFour.getChampion());
        } else {
            setChampion(null);
        }

        // Find first incomplete region to show
        const allRegions = [...regionOrder, 'final_four'];
        let foundIncomplete = false;
        for (const regionName of allRegions) {
            const region = savedBracket.regions[regionName];
            if (region && !region.getChampion()) {
                setCurrentRegionName(regionName);
                setRandomizedMatchup(region.getCurrentMatchup() || []);
                foundIncomplete = true;
                break;
            }
        }
        // If all regions complete, show final four
        if (!foundIncomplete && savedBracket.regions.final_four) {
            setCurrentRegionName('final_four');
            setCurrentMatchup([]);
        }
    };

    const initializeOrLoadBracket = async () => {
        if (isInitializing.current) return;
        isInitializing.current = true;
        setLoading(true);

        const bracketData = getBracketData();
        const regionOrder = getRegionOrder();

        // Check if we have data for this year (first region has teams)
        const firstRegionKey = Object.keys(bracketData)[0];
        if (!firstRegionKey || !bracketData[firstRegionKey]?.length) {
            setLoading(false);
            isInitializing.current = false;
            return;
        }

        // First, try to load from Firebase if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear, genderPath);
                if (savedBracket) {
                    // Firebase has saved bracket - use it
                    applyLoadedBracket(savedBracket);
                    saveTemporaryBracket(selectedYear, null, genderPath);
                    setLoading(false);
                    isInitializing.current = false;
                    return;
                }
            } catch (error) {
                console.error('Error loading saved bracket:', error);
            }
        }

        // No Firebase bracket - try memory
        const memoryBracket = loadFromMemory();
        if (memoryBracket && Object.keys(memoryBracket.regions).length > 0) {
            applyLoadedBracket(memoryBracket);
            setLoading(false);
            isInitializing.current = false;
            return;
        }

        // No saved bracket anywhere - create new one
        createNewBracket();
        isInitializing.current = false;
    };

    const createNewBracket = () => {
        const bracketDataForYear = getBracketData();
        const regionOrderForYear = getRegionOrder();
        const firstFourMappingForYear = getFirstFourMapping();

        // Initialize regions (this includes final_four with empty slots)
        const newRegions = initializeBracket(selectedYear, bracketDataForYear, regionOrderForYear, firstFourMappingForYear);
        setRegions(newRegions);

        // Start with first region
        if (regionOrderForYear.length > 0) {
            setCurrentRegionName(regionOrderForYear[0]);
            const firstRegion = newRegions[regionOrderForYear[0]];
            if (firstRegion) {
                setRandomizedMatchup(firstRegion.getCurrentMatchup() || []);
            }
        }

        // Reset state for new bracket
        setChampion(null);
        setBracketName('');
        setSaved(false);
        setPublished(false);
        setIsModified(false);
        setLoading(false);
    };

    // Get the current region object
    const getCurrentRegion = () => {
        return regions[currentRegionName];
    };

    // Handle when user picks a winner
    const selectWinner = (winner) => {
        const currentRegion = getCurrentRegion();
        if (!currentRegion) return;

        // Record the selection
        currentRegion.selectWinner(winner);

        // Get the next matchup (before triggering re-render)
        let nextMatchup = [];
        let nextRegionName = currentRegionName;

        // Check if region is complete
        const regionChampion = currentRegion.getChampion();
        if (regionChampion) {
            // Move to next region or final four
            const regionOrder = [...getRegionOrder(), 'final_four'];

            // Add region champion to final four if not already final four
            if (currentRegionName !== 'final_four') {
                const finalFour = regions.final_four;
                // Define const idx based on the position of currentRegionName in regionOrder
                const idx = regionOrder.indexOf(currentRegionName);
                if (finalFour) {
                    finalFour.addTeam(regionChampion, idx);
                }
            }

            // Find next incomplete region
            let foundNext = false;
            for (const regionName of regionOrder) {
                const region = regions[regionName];
                if (region && !region.getChampion()) {
                    nextRegionName = regionName;
                    nextMatchup = region.getCurrentMatchup() || [];
                    foundNext = true;
                    break;
                }
            }

            if (!foundNext) {
                // All regions complete - we have a champion!
                setChampion(regions.final_four?.getChampion());
            }
        } else {
            // Get next matchup in current region
            nextMatchup = currentRegion.getCurrentMatchup() || [];
        }

        // Update state
        const newRegions = { ...regions };
        setRegions(newRegions);
        setCurrentRegionName(nextRegionName);
        setRandomizedMatchup(nextMatchup);
        setSaved(false);
        setIsModified(true);

        // Save to memory
        saveToMemory(newRegions, bracketName, nextRegionName, nextMatchup);
    };

    // Get progress for a specific region
    const getRegionProgress = (regionName) => {
        const region = regions[regionName];
        if (!region) return [0, 0];
        return region.getProgress();
    };

    // Switch to a specific region (for clicking progress boxes)
    const switchToRegion = (regionName) => {
        const region = regions[regionName];
        if (region) {
            setCurrentRegionName(regionName);
            // If the region is complete, we'll show the winner screen (which now has a reset button)
            // If it's not complete, we show the current matchup
            setRandomizedMatchup(region.getCurrentMatchup() || []);
        }
    };

    // Reset a specific region to allow re-picking
    const resetRegion = (regionName) => {
        const region = regions[regionName];
        if (region) {
            // Save current picks before resetting - MUST deep copy since reset() mutates in place
            const bracketSnapshot = JSON.parse(JSON.stringify(region.toDict().bracket));
            setPreviousPicks(prev => ({
                ...prev,
                [regionName]: bracketSnapshot
            }));

            region.reset(); // This mutates the bracket arrays in place

            // If we reset a region, we definitely don't have a champion anymore
            setChampion(null);
            setSaved(false);
            setIsModified(true);

            // If it's not final_four, we also need to clear that region's slot in final_four
            if (regionName !== 'final_four') {
                const finalFour = regions.final_four;
                const regionOrder = getRegionOrder();
                const idx = regionOrder.indexOf(regionName);
                if (finalFour) {
                    finalFour.clearSlot(idx); // We'll need a clearSlot method in Region class
                }
            }

            // Update state
            const newRegions = { ...regions };
            setRegions(newRegions);
            setCurrentRegionName(regionName);
            setRandomizedMatchup(region.getCurrentMatchup() || []);
        }
    };

    // Get the current region's champion (if complete)
    const getCurrentRegionChampion = () => {
        const region = getCurrentRegion();
        return region?.getChampion();
    };

    /**
     * Check if a team was the previously selected winner for the current matchup
     */
    const checkPreviousPick = (teamName) => {
        const region = getCurrentRegion();
        const prevBracket = previousPicks[currentRegionName];

        if (typeof window !== 'undefined') window.debug_previousPicks = previousPicks;

        if (!region || !prevBracket) return false;

        const roundIndex = region.roundIndex;
        const matchupIndex = region.currentMatchupIndex;
        const nextRoundIndex = String(roundIndex + 1);
        const position = Math.floor(matchupIndex / 2);

        // Check if prevBracket has this round and position
        if (prevBracket[nextRoundIndex] && prevBracket[nextRoundIndex][position]) {
            const prevWinnerName = prevBracket[nextRoundIndex][position].name;
            const match = prevWinnerName === teamName;
            return match;
        }

        return false;
    };

    // Handle saving the bracket
    const handleSaveBracket = async () => {
        if (!user) {
            safeNavigate('/login?redirect=/bracket/pick');
            return;
        }

        if (!bracketName.trim()) {
            alert('Please enter a bracket name');
            return;
        }

        try {
            // If already published, update both the saved bracket AND the leaderboard entry
            if (published) {
                await publishBracket(user, selectedYear, regions, bracketName, champion, genderPath, true);
            } else {
                await saveBracket(user, selectedYear, regions, bracketName, false, genderPath);
            }

            setSaved(true);
            setIsModified(false);
            alert('Bracket updated successfully!');
        } catch (error) {
            console.error('Error saving bracket:', error);
            alert('Failed to save bracket. Please try again.');
        }
    };

    // Handle publishing the bracket
    const handlePublishBracket = async () => {
        if (!saved) {
            await handleSaveBracket();
        }

        try {
            await publishBracket(user, selectedYear, regions, bracketName, champion, genderPath);
            setPublished(true);
            alert('Bracket published to leaderboard!');
        } catch (error) {
            console.error('Error publishing bracket:', error);
            alert('Failed to publish bracket. Please try again.');
        }
    };

    // Start editing picks again
    const handleEditPicks = () => {
        setChampion(null);

        // Populate previousPicks with current state of all regions before hiding champion view
        // Deep copy to avoid mutation issues
        const currentPicks = {};
        Object.keys(regions).forEach(name => {
            currentPicks[name] = JSON.parse(JSON.stringify(regions[name].toDict().bracket));
        });
        setPreviousPicks(currentPicks);
        if (typeof window !== 'undefined') window.debug_previousPicks = currentPicks;

        // Just stay on current region or go to first region
        const regionOrder = getRegionOrder();
        if (!currentRegionName) {
            setCurrentRegionName(regionOrder[0]);
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="winner-selection-container">
                <p>Loading bracket...</p>
            </div>
        );
    }

    // No data for selected year
    const bracketData = getBracketData();
    const firstRegionKey = Object.keys(bracketData)[0];
    if (!firstRegionKey || !bracketData[firstRegionKey]?.length) {
        return <ComingSoon year={selectedYear} />;
    }

    // Champion view - show when all picks are complete
    if (champion) {
        return (
            <div className="winner-selection-container">
                <div className="champion-display">
                    <h2>🏆 Your Champion</h2>

                    {/* Cutoff warning banner */}
                    {isPastCutoff() && (
                        <div className="cutoff-warning-banner">
                            ⚠️ The tournament has started. Brackets are now locked and cannot be saved or published.
                        </div>
                    )}

                    <p>You have picked <strong>{formatTeamName(champion.name)}</strong> to win the tournament!</p>
                    <p className="mascot-name">{getMascotName(champion.name)}</p>

                    {champion.image && (
                        <img src={champion.image} alt={champion.name} className="champion-image" />
                    )}

                    <div className="bracket-form">
                        <div className="form-group">
                            <label htmlFor="bracketName">Bracket Name:</label>
                            <input
                                type="text"
                                id="bracketName"
                                value={bracketName}
                                onChange={(e) => {
                                    setBracketName(e.target.value);
                                    setSaved(false);
                                    setIsModified(true);
                                }}
                                placeholder="My Bracket 2025"
                            />
                        </div>

                        <div className="button-group">
                            <button
                                onClick={handleEditPicks}
                                className="secondary-btn"
                                disabled={isPastCutoff()}
                                title={isPastCutoff() ? 'Bracket locked - tournament has started' : ''}
                            >
                                {isPastCutoff() ? 'Editing Locked 🔒' : 'Edit Picks'}
                            </button>
                            <button
                                onClick={() => safeNavigate('/bracket/view/full')}
                                className="secondary-btn"
                            >
                                View Bracket
                            </button>

                            {!user && (
                                <>
                                    <button onClick={() => safeNavigate('/login?redirect=/bracket/pick')} className="secondary-btn">
                                        Log In
                                    </button>
                                    <button onClick={() => safeNavigate('/signup')} className="secondary-btn">
                                        Sign Up
                                    </button>
                                </>
                            )}

                            {user && (
                                <>
                                    <button
                                        onClick={handleSaveBracket}
                                        disabled={(saved && !isModified) || isPastCutoff()}
                                        className="primary-btn"
                                        title={isPastCutoff() ? 'Bracket lock - tournament has started' : ''}
                                    >
                                        {isPastCutoff() ? 'Locked 🔒' : (saved ? (isModified ? 'Update Changes' : 'Saved ✓') : 'Save Bracket')}
                                    </button>
                                    <button
                                        onClick={handlePublishBracket}
                                        disabled={published || isPastCutoff()}
                                        className="primary-btn"
                                        title={isPastCutoff() ? 'Bracket locked - tournament has started' : ''}
                                    >
                                        {isPastCutoff() ? 'Locked 🔒' : (published ? 'Published ✓' : 'Publish to Leaderboard')}
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Cross-Gender Promotion */}
                        {user && !hasOtherGenderBracket && (
                            <div className="cross-gender-promo">
                                <p>You haven't filled out a {selectedGender === 'M' ? "Women's" : "Men's"} bracket yet!</p>
                                <p>First, save and/or publish your current bracket and then you can create a {selectedGender === 'M' ? "Women's" : "Men's"} bracket.</p>
                                <button
                                    onClick={handleCreateOtherGender}
                                    className="create-bracket-btn"
                                    style={{ marginTop: '10px', width: '100%' }}
                                >
                                    Create {selectedGender === 'M' ? "Women's" : "Men's"} Bracket
                                </button>
                            </div>
                        )}

                        {!user && (
                            <div className="info-banner">
                                ℹ️ Log in to save and publish your bracket to the leaderboard
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Get current region champion for showing region winner state
    const regionChamp = getCurrentRegionChampion();

    // Helper to render image with magnifier
    const RenderImageWithMagnifier = ({ src, alt, className }) => (
        <div className={`image-container ${className || ''}`}>
            <img src={src} alt={alt} />
            <div
                className="magnify-icon"
                onClick={(e) => {
                    e.stopPropagation();
                    setExpandedImage(src);
                }}
                title="Expand Image"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
            </div>
        </div>
    );

    // Main matchup selection view
    return (
        <div className="winner-selection-container">
            <h2>Select Which Mascot You Like Best</h2>

            {/* Cutoff warning banner */}
            {isPastCutoff() && (
                <div className="cutoff-warning-banner">
                    ⚠️ The tournament has started. Any changes you make cannot be saved or published.
                </div>
            )}

            <p className="current-region">
                Region: <strong>{formatTeamName(currentRegionName)}</strong>
            </p>

            {/* Show region winner if this region is complete */}
            {regionChamp && (
                <div className="region-winner-display">
                    <h3>🏆 {formatTeamName(currentRegionName)} Region Winner</h3>
                    {regionChamp.image && (
                        <RenderImageWithMagnifier
                            src={regionChamp.image}
                            alt={regionChamp.name}
                            className="region-winner-image"
                        />
                    )}
                    <p className="mascot-name">{formatMascotName(regionChamp.name)}</p>
                    <p className="team-name">{formatTeamName(regionChamp.name)}</p>
                    <button
                        className="secondary-btn"
                        onClick={() => resetRegion(currentRegionName)}
                        style={{ marginTop: '20px', width: '100%' }}
                    >
                        Reset Picks for This Region
                    </button>
                </div>
            )}

            {/* Show matchup if region is not complete */}
            {!regionChamp && currentMatchup.length === 2 && (
                <div className="matchup">
                    {currentMatchup.map((team, index) => {
                        const isPlayIn = team.name.includes('_or_');
                        const cardContent = isPlayIn ? (
                            (() => {
                                const subTeamNames = team.name.split('_or_');
                                const subTeams = subTeamNames.map(name => ({
                                    name,
                                    displayName: formatTeamName(name),
                                    mascot: getMascotName(name),
                                    image: `/assets/teams/${name}.jpg`
                                }));
                                return (
                                    <div
                                        key={team.name}
                                        className="team-card split-team-card"
                                        onClick={() => selectWinner(team)}
                                    >
                                        <div className="sub-team top">
                                            <div className="sub-team-info">
                                                <p className="team-name">{subTeams[0].displayName}</p>
                                                <p className="mascot-name">
                                                    {subTeams[0].mascot}
                                                    {checkPreviousPick(subTeams[0].name) && <span className="previous-pick-star">*</span>}
                                                </p>
                                            </div>
                                            <RenderImageWithMagnifier src={subTeams[0].image} alt={subTeams[0].name} />
                                        </div>
                                        <div className="split-divider"></div>
                                        <div className="sub-team bottom">
                                            <div className="sub-team-info">
                                                <p className="team-name">{subTeams[1].displayName}</p>
                                                <p className="mascot-name">
                                                    {subTeams[1].mascot}
                                                    {checkPreviousPick(subTeams[1].name) && <span className="previous-pick-star">*</span>}
                                                </p>
                                            </div>
                                            <RenderImageWithMagnifier src={subTeams[1].image} alt={subTeams[1].name} />
                                        </div>
                                    </div>
                                );
                            })()
                        ) : (
                            <div
                                key={team.name}
                                className="team-card"
                                onClick={() => selectWinner(team)}
                            >
                                {team.image && (
                                    <RenderImageWithMagnifier src={team.image} alt={team.name} />
                                )}
                                <p className="mascot-name">
                                    {formatMascotName(team.name)}
                                    {checkPreviousPick(team.name) && <span className="previous-pick-star">*</span>}
                                </p>
                                <p className="team-name">{formatTeamName(team.name)}</p>
                            </div>
                        );

                        return (
                            <>
                                {cardContent}
                                {index === 0 && <span className="vs">VS</span>}
                            </>
                        );
                    })}
                </div>
            )}

            {/* Play-In Game Info Box */}
            {!regionChamp && currentMatchup.some(team => team.name.includes('_or_')) && (
                (() => {
                    const playInTeams = currentMatchup.filter(team => team.name.includes('_or_'));

                    const cutoffMap = selectedGender === 'M' ? cutOffTimes : womensCutOffTimes;
                    const cutoffDate = cutoffMap[selectedYear];

                    const timeString = cutoffDate ? cutoffDate.toLocaleString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        timeZoneName: 'short'
                    }) : 'the start of the Round of 64';

                    return (
                        <div className="play-in-info">
                            {playInTeams.map(team => {
                                const subTeams = team.name.split('_or_').map(name => formatTeamName(name));
                                return (
                                    <p key={team.name}>
                                        <strong>{subTeams[0]}</strong> and <strong>{subTeams[1]}</strong> will compete for their spot in the tournament in a play-in game prior to the beginning of the Round of 64.
                                    </p>
                                );
                            })}
                            <p>
                                When the winner of the play-in game is known, this website will be updated and you will only see one team here.
                            </p>
                            <p className="cutoff-note">
                                Please fill out the bracket assuming one of the two teams wins the play-in game and feel free to come back later and edit your bracket if you are wrong.
                                Note that editing is only allowed until <strong>{timeString}</strong>.
                            </p>
                        </div>
                    );
                })()
            )}

            {/* Progress for each region - clickable to switch */}
            <div className="progress-container">
                {[...getRegionOrder(), 'final_four'].map(regionName => {
                    const progress = getRegionProgress(regionName);
                    const region = regions[regionName];
                    const isComplete = region?.getChampion();
                    return (
                        <div
                            key={regionName}
                            className={`progress-box ${regionName === currentRegionName ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                            onClick={() => switchToRegion(regionName)}
                        >
                            <span className="region-title">{formatTeamName(regionName)}</span>
                            <span className="progress-text">
                                {isComplete ? '✓' : `${progress[0]} / ${progress[1]}`}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Expanded Image Modal */}
            {expandedImage && (
                <div className="image-modal-overlay" onClick={() => setExpandedImage(null)}>
                    <div className="image-modal-content" onClick={e => e.stopPropagation()}>
                        <button className="close-modal-btn" onClick={() => setExpandedImage(null)}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        </button>
                        <img src={expandedImage} alt="Expanded Mascot" className="modal-image" />
                    </div>
                </div>
            )}
        </div>
    );
}

export default WinnerSelection;
