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
import { useNavigate } from 'react-router-dom';
import { useTournament } from '../hooks/useTournament.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getMascotName, formatTeamName } from '../constants/nicknames';
import { Team, Region, initializeBracket, saveBracket, publishBracket, loadBracket, saveTemporaryBracket, loadTemporaryBracket } from '../services/bracketService';
import ComingSoon from '../components/ComingSoon';
import './WinnerSelection.css';

/**
 * Capitalize mascot name (title case)
 * e.g., "crimson tide" -> "Crimson Tide"
 */
function formatMascotName(teamKey) {
    const mascot = getMascotName(teamKey);
    return mascot
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

function WinnerSelection() {
    const navigate = useNavigate();
    const { selectedYear, selectedGender, getBracketData, getRegionOrder, getFirstFourMapping } = useTournament();
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

        // Save to memory
        saveToMemory(newRegions, bracketName, nextRegionName, nextMatchup);
    };

    // // Move to the next incomplete region
    // const moveToNextRegion = (regionChampion) => {
    //     const regionOrder = [...getRegionOrder(), 'final_four'];

    //     // Add region champion to final four if not already final four
    //     if (currentRegionName !== 'final_four') {
    //         const finalFour = regions.final_four;
    //         if (finalFour) {
    //             finalFour.addTeam(regionChampion);
    //         }
    //     }

    //     // Find next incomplete region
    //     for (const regionName of regionOrder) {
    //         const region = regions[regionName];
    //         if (region && !region.getChampion()) {
    //             setCurrentRegionName(regionName);
    //             setRandomizedMatchup(region.getCurrentMatchup() || []);
    //             return;
    //         }
    //     }

    //     // All regions complete - we have a champion!
    //     setChampion(regions.final_four?.getChampion());
    // };

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
            setRandomizedMatchup(region.getCurrentMatchup() || []);
        }
    };

    // Get the current region's champion (if complete)
    const getCurrentRegionChampion = () => {
        const region = getCurrentRegion();
        return region?.getChampion();
    };

    // Handle saving the bracket
    const handleSaveBracket = async () => {
        if (!user) {
            navigate('/login?redirect=/bracket/pick');
            return;
        }

        if (!bracketName.trim()) {
            alert('Please enter a bracket name');
            return;
        }

        try {
            await saveBracket(user, selectedYear, regions, bracketName, false, genderPath);
            setSaved(true);
            alert('Bracket saved successfully!');
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
                                onChange={(e) => setBracketName(e.target.value)}
                                placeholder="My Bracket 2025"
                                disabled={saved}
                            />
                        </div>

                        <div className="button-group">
                            <button
                                onClick={() => navigate('/bracket/view/full')}
                                className="secondary-btn"
                            >
                                View Bracket
                            </button>

                            {!user && (
                                <>
                                    <button onClick={() => navigate('/login?redirect=/bracket/pick')} className="secondary-btn">
                                        Log In
                                    </button>
                                    <button onClick={() => navigate('/signup')} className="secondary-btn">
                                        Sign Up
                                    </button>
                                </>
                            )}

                            {user && (
                                <>
                                    <button
                                        onClick={handleSaveBracket}
                                        disabled={saved}
                                        className="primary-btn"
                                    >
                                        {saved ? 'Saved ✓' : 'Save Bracket'}
                                    </button>
                                    <button
                                        onClick={handlePublishBracket}
                                        disabled={published}
                                        className="primary-btn"
                                    >
                                        {published ? 'Published ✓' : 'Publish to Leaderboard'}
                                    </button>
                                </>
                            )}
                        </div>

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

    // Main matchup selection view
    return (
        <div className="winner-selection-container">
            <h2>Select Which Mascot You Like Best</h2>
            <p className="current-region">
                Region: <strong>{formatTeamName(currentRegionName)}</strong>
            </p>

            {/* Show region winner if this region is complete */}
            {regionChamp && (
                <div className="region-winner-display">
                    <h3>🏆 {formatTeamName(currentRegionName)} Region Winner</h3>
                    {regionChamp.image && (
                        <img src={regionChamp.image} alt={regionChamp.name} className="region-winner-image" />
                    )}
                    <p className="mascot-name">{formatMascotName(regionChamp.name)}</p>
                    <p className="team-name">{formatTeamName(regionChamp.name)}</p>
                    <p className="winner-message">Select another region below to continue picking</p>
                </div>
            )}

            {/* Show matchup if region is not complete */}
            {!regionChamp && currentMatchup.length === 2 && (
                <div className="matchup">
                    <div
                        className="team-card"
                        onClick={() => selectWinner(currentMatchup[0])}
                    >
                        {currentMatchup[0].image && (
                            <img src={currentMatchup[0].image} alt={currentMatchup[0].name} />
                        )}
                        <p className="mascot-name">{formatMascotName(currentMatchup[0].name)}</p>
                        <p className="team-name">{formatTeamName(currentMatchup[0].name)}</p>
                    </div>

                    <span className="vs">VS</span>

                    <div
                        className="team-card"
                        onClick={() => selectWinner(currentMatchup[1])}
                    >
                        {currentMatchup[1].image && (
                            <img src={currentMatchup[1].image} alt={currentMatchup[1].name} />
                        )}
                        <p className="mascot-name">{formatMascotName(currentMatchup[1].name)}</p>
                        <p className="team-name">{formatTeamName(currentMatchup[1].name)}</p>
                    </div>
                </div>
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
        </div>
    );
}

export default WinnerSelection;
