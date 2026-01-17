/**
 * FullBracket Page
 * 
 * Displays the complete bracket with all 4 regions and the Final Four.
 * Layout: Left regions | Final Four + Champion | Right regions
 */

import { useState, useEffect } from 'react';
import { useYear } from '../hooks/useYear.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { formatTeamName, getMascotName } from '../constants/nicknames';
import { initializeBracket, loadBracket } from '../services/bracketService';
import BracketSegment from '../components/BracketSegment';
import Matchup from '../components/Matchup';
import { regionOrder } from '../constants/bracketData';
import './FullBracket.css';

function FullBracket() {
    const { selectedYear, getBracketData, getRegionOrder } = useYear();
    const { user } = useAuth();

    const [regions, setRegions] = useState({});
    const [loading, setLoading] = useState(true);
    const [bracketName, setBracketName] = useState('');

    // Load bracket on mount and when year/user changes
    useEffect(() => {
        loadBracketData();
    }, [selectedYear, user]);

    const loadBracketData = async () => {
        setLoading(true);

        const bracketData = getBracketData();

        // Check if we have data for this year
        if (!bracketData.south.length && !bracketData.east.length) {
            setLoading(false);
            return;
        }

        // Try to load saved bracket if user is logged in
        if (user) {
            try {
                const savedBracket = await loadBracket(user, selectedYear);
                if (savedBracket) {
                    setRegions(savedBracket.regions);
                    setBracketName(savedBracket.name || '');
                    setLoading(false);
                    return;
                }
            } catch (error) {
                console.error('Error loading bracket:', error);
            }
        }

        // Create a fresh bracket for viewing structure
        const newRegions = initializeBracket(selectedYear);
        setRegions(newRegions);
        setBracketName('');
        setLoading(false);
    };

    // Get region bracket data
    const getRegionBracket = (regionName) => {
        return regions[regionName]?.bracket || [];
    };

    // Get the final four matchups
    const getFinalFourMatchups = () => {
        const finalFour = regions.final_four;
        if (!finalFour || !finalFour.bracket || !finalFour.bracket[0]) {
            return [];
        }

        const bracket = finalFour.bracket;
        const semiFinalLeft = [bracket[0][0], bracket[0][1]];
        const semiFinalRight = [bracket[0][2], bracket[0][3]];
        const final = bracket[1] ? [bracket[1][0], bracket[1][1]] : [null, null];

        return [semiFinalLeft, final, semiFinalRight];
    };

    // Get champion
    const getChampion = () => {
        return regions.final_four?.getChampion?.() || null;
    };

    // Get left and right regions based on year's order
    const order = regionOrder[selectedYear] || regionOrder[2025];
    const leftRegions = [order[0], order[3]];
    const rightRegions = [order[1], order[2]];

    if (loading) {
        return (
            <div className="full-bracket-container">
                <p>Loading bracket...</p>
            </div>
        );
    }

    const bracketData = getBracketData();
    if (!bracketData.south.length && !bracketData.east.length) {
        return (
            <div className="full-bracket-container">
                <div className="no-data-message">
                    <h2>🏀 Bracket Not Available</h2>
                    <p>The {selectedYear} bracket data is not available yet.</p>
                </div>
            </div>
        );
    }

    const champion = getChampion();
    const finalFourMatchups = getFinalFourMatchups();

    return (
        <div className="full-bracket-container">
            <h2>
                {bracketName ? `${bracketName}` : `${selectedYear} Bracket`}
            </h2>

            <div className="bracket-layout">
                {/* Left side - Two regions */}
                <div className="bracket-side left-side">
                    <div className="region-wrapper">
                        <h3>{formatTeamName(leftRegions[0])} Region</h3>
                        <BracketSegment
                            bracket={getRegionBracket(leftRegions[0])}
                            reverseOrder={false}
                        />
                    </div>
                    <div className="region-wrapper">
                        <h3>{formatTeamName(leftRegions[1])} Region</h3>
                        <BracketSegment
                            bracket={getRegionBracket(leftRegions[1])}
                            reverseOrder={false}
                        />
                    </div>
                </div>

                {/* Center - Final Four */}
                <div className="final-four-section">
                    {champion && (
                        <div className="champion-display">
                            <h3>🏆 Champion</h3>
                            {champion.image && (
                                <img src={champion.image} alt={champion.name} className="champion-image" />
                            )}
                            <p className="champion-name">{formatTeamName(champion.name)}</p>
                            <p className="champion-mascot">{getMascotName(champion.name)}</p>
                        </div>
                    )}

                    <h3>Final Four</h3>

                    <div className="final-four-matchups">
                        {finalFourMatchups.map((matchup, index) => (
                            <div key={index} className={`ff-matchup ${index === 1 ? 'championship' : 'semifinal'}`}>
                                <span className="ff-label">
                                    {index === 0 ? 'Semifinal' : index === 1 ? 'Championship' : 'Semifinal'}
                                </span>
                                <Matchup topTeam={matchup[0]} bottomTeam={matchup[1]} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right side - Two regions (reversed) */}
                <div className="bracket-side right-side">
                    <div className="region-wrapper">
                        <h3>{formatTeamName(rightRegions[0])} Region</h3>
                        <BracketSegment
                            bracket={getRegionBracket(rightRegions[0])}
                            reverseOrder={true}
                        />
                    </div>
                    <div className="region-wrapper">
                        <h3>{formatTeamName(rightRegions[1])} Region</h3>
                        <BracketSegment
                            bracket={getRegionBracket(rightRegions[1])}
                            reverseOrder={true}
                        />
                    </div>
                </div>
            </div>

            {!user && (
                <div className="info-banner">
                    ℹ️ Log in to view your saved bracket
                </div>
            )}
        </div>
    );
}

export default FullBracket;
