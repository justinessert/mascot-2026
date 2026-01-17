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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useYear } from '../hooks/useYear.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getMascotName, formatTeamName } from '../constants/nicknames';
import { Team, Region, initializeBracket, saveBracket, publishBracket, loadBracket } from '../services/bracketService';
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

    // Initialize bracket when year or user changes
    useEffect(() => {
        initializeOrLoadBracket();
    }, [selectedYear, user]);

    const initializeOrLoadBracket = async () => {
        setLoading(true);

        const bracketData = getBracketData();
        const regionOrder = getRegionOrder();

        // Check if we have data for this year
        if (!bracketData.south.length && !bracketData.east.length) {
            setLoading(false);
            return;
        }

        // Try to load saved bracket from Firebase if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear);
                if (savedBracket) {
                    // Use the saved bracket
                    setRegions(savedBracket.regions);
                    setBracketName(savedBracket.name || '');
                    setSaved(true);
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
                    for (const regionName of allRegions) {
                        const region = savedBracket.regions[regionName];
                        if (region && !region.getChampion()) {
                            setCurrentRegionName(regionName);
                            setCurrentMatchup(region.getCurrentMatchup() || []);
                            break;
                        }
                    }
                    // If all regions complete, show final four
                    if (!currentRegionName && savedBracket.regions.final_four) {
                        setCurrentRegionName('final_four');
                        setCurrentMatchup([]);
                    }

                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error loading saved bracket:', error);
                // Fall through to create new bracket
            }
        }

        // Create a new bracket if no saved one
        createNewBracket();
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

        // Check if region is complete
        const regionChampion = currentRegion.getChampion();
        if (regionChampion) {
            // Move to next region or final four
            moveToNextRegion(regionChampion);
        } else {
            // Get next matchup in current region
            setCurrentMatchup(currentRegion.getCurrentMatchup() || []);
        }

        // Trigger re-render
        setRegions({ ...regions });
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
            navigate('/login');
            return;
        }

        if (!bracketName.trim()) {
            alert('Please enter a bracket name');
            return;
        }

        try {
            await saveBracket(selectedYear, user.uid, regions, bracketName);
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
            await publishBracket(selectedYear, user.uid, regions, bracketName);
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
                                    <button onClick={() => navigate('/login')} className="secondary-btn">
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
