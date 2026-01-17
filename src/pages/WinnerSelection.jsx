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
import { useYear } from '../hooks/useYear.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getMascotName, formatTeamName } from '../constants/nicknames';
import { Team, Region, initializeBracket, saveBracket, publishBracket, loadBracket } from '../services/bracketService';
import './WinnerSelection.css';

// Session storage key for bracket state
const getSessionKey = (year) => `bracket_session_${year}`;

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
    const { selectedYear, getBracketData, getRegionOrder } = useYear();
    const { user } = useAuth();

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

    // Save bracket state to sessionStorage
    const saveToSession = (regionsData, name, regionName, matchup) => {
        try {
            const sessionData = {
                regions: Object.keys(regionsData).reduce((acc, key) => {
                    acc[key] = regionsData[key]?.toDict?.() || null;
                    return acc;
                }, {}),
                bracketName: name,
                currentRegionName: regionName,
                currentMatchup: matchup?.map(t => t?.toDict?.() || null) || []
            };
            sessionStorage.setItem(getSessionKey(selectedYear), JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error saving to session:', error);
        }
    };

    // Load bracket state from sessionStorage
    const loadFromSession = () => {
        try {
            const sessionData = sessionStorage.getItem(getSessionKey(selectedYear));
            if (!sessionData) return null;

            const parsed = JSON.parse(sessionData);
            const loadedRegions = {};
            Object.keys(parsed.regions).forEach(key => {
                if (parsed.regions[key]) {
                    loadedRegions[key] = Region.fromDict(parsed.regions[key], selectedYear);
                }
            });

            return {
                regions: loadedRegions,
                bracketName: parsed.bracketName || '',
                currentRegionName: parsed.currentRegionName || '',
                currentMatchup: parsed.currentMatchup || []
            };
        } catch (error) {
            console.error('Error loading from session:', error);
            return null;
        }
    };

    // Initialize bracket when year changes (user handled separately)
    useEffect(() => {
        initializeOrLoadBracket();
    }, [selectedYear]);

    // Handle user login - check if Firebase has saved bracket
    useEffect(() => {
        if (user && !isInitializing.current) {
            checkFirebaseBracket();
        }
    }, [user]);

    // Check Firebase for saved bracket when user logs in
    const checkFirebaseBracket = async () => {
        try {
            const savedBracket = await loadBracket(user, selectedYear);
            if (savedBracket) {
                // Firebase has saved bracket - use it and override session
                applyLoadedBracket(savedBracket);
                sessionStorage.removeItem(getSessionKey(selectedYear));
            }
            // If no saved bracket in Firebase, keep current session state
        } catch (error) {
            console.error('Error checking Firebase bracket:', error);
        }
    };

    // Apply a loaded bracket (from Firebase or session) to state
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
                setCurrentMatchup(region.getCurrentMatchup() || []);
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

        // Check if we have data for this year
        if (!bracketData.south.length && !bracketData.east.length) {
            setLoading(false);
            isInitializing.current = false;
            return;
        }

        // First, try to load from Firebase if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear);
                if (savedBracket) {
                    // Firebase has saved bracket - use it
                    applyLoadedBracket(savedBracket);
                    sessionStorage.removeItem(getSessionKey(selectedYear));
                    setLoading(false);
                    isInitializing.current = false;
                    return;
                }
            } catch (error) {
                console.error('Error loading saved bracket:', error);
            }
        }

        // No Firebase bracket - try session storage
        const sessionBracket = loadFromSession();
        if (sessionBracket && Object.keys(sessionBracket.regions).length > 0) {
            applyLoadedBracket(sessionBracket);
            setLoading(false);
            isInitializing.current = false;
            return;
        }

        // No saved bracket anywhere - create new one
        createNewBracket();
        isInitializing.current = false;
    };

    const createNewBracket = () => {
        const regionOrder = getRegionOrder();

        // Initialize regions (this includes final_four with empty slots)
        const newRegions = initializeBracket(selectedYear);
        setRegions(newRegions);

        // Start with first region
        if (regionOrder.length > 0) {
            setCurrentRegionName(regionOrder[0]);
            const firstRegion = newRegions[regionOrder[0]];
            if (firstRegion) {
                setCurrentMatchup(firstRegion.getCurrentMatchup() || []);
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
                if (finalFour) {
                    finalFour.addTeam(regionChampion);
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
        setCurrentMatchup(nextMatchup);

        // Save to session storage
        saveToSession(newRegions, bracketName, nextRegionName, nextMatchup);
    };

    // Move to the next incomplete region
    const moveToNextRegion = (regionChampion) => {
        const regionOrder = [...getRegionOrder(), 'final_four'];

        // Add region champion to final four if not already final four
        if (currentRegionName !== 'final_four') {
            const finalFour = regions.final_four;
            if (finalFour) {
                finalFour.addTeam(regionChampion);
            }
        }

        // Find next incomplete region
        for (const regionName of regionOrder) {
            const region = regions[regionName];
            if (region && !region.getChampion()) {
                setCurrentRegionName(regionName);
                setCurrentMatchup(region.getCurrentMatchup() || []);
                return;
            }
        }

        // All regions complete - we have a champion!
        setChampion(regions.final_four?.getChampion());
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
            setCurrentMatchup(region.getCurrentMatchup() || []);
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
            await saveBracket(user, selectedYear, regions, bracketName);
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
            await publishBracket(user, selectedYear, regions, bracketName, champion);
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
    if (!bracketData.south.length && !bracketData.east.length) {
        return (
            <div className="winner-selection-container">
                <div className="no-data-message">
                    <h2>🏀 Bracket Not Available</h2>
                    <p>The {selectedYear} bracket data is not available yet.</p>
                    <p>Please select a different year or check back later.</p>
                </div>
            </div>
        );
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
