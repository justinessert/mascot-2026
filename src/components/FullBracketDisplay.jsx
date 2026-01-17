/**
 * FullBracketDisplay Component
 * 
 * Reusable full bracket view used by both "View Your Bracket" and "Shared Bracket View" pages.
 * Enforces consistent layout and styling, including mobile optimization (Final Four first).
 */

import { Link } from 'react-router-dom';
import { formatTeamName, getMascotName } from '../constants/nicknames';
import { regionOrder } from '../constants/bracketData';
import BracketSegment from './BracketSegment';
import Matchup from './Matchup';
import '../pages/FullBracket.css'; // Reuse existing styles

function FullBracketDisplay({ regions, bracketName, userName, year, onBack, backLink, backLinkText, children }) {
    const numericYear = parseInt(year, 10);

    // Get region bracket data
    const getRegionBracket = (regionName) => {
        return regions[regionName]?.bracket || [];
    };

    // Get Final Four matchups
    const getFinalFourMatchups = () => {
        const finalFour = regions.final_four;
        if (!finalFour || !finalFour.bracket || !finalFour.bracket[0]) {
            return [
                [null, null],
                [null, null],
                [null, null]
            ];
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
    const order = regionOrder[numericYear] || regionOrder[2025];
    const leftRegions = [order[0], order[3]];
    const rightRegions = [order[1], order[2]];

    const champion = getChampion();
    const finalFourMatchups = getFinalFourMatchups();

    return (
        <div className="full-bracket-container">
            {/* Header */}
            <div className="shared-bracket-header">
                <h2>{bracketName || `${year} Bracket`}</h2>
                {userName && <p className="bracket-owner">by {userName}</p>}

                {onBack && (
                    <button onClick={onBack} className="back-link-btn">← Back</button>
                )}

                {backLink && (
                    <Link to={backLink} className="back-link">
                        ← {backLinkText || 'Back'}
                    </Link>
                )}
            </div>

            <div className="bracket-layout">
                {/* Left Regions */}
                <div className="bracket-side left-side">
                    {leftRegions.map((regionName) => (
                        <div key={regionName} className="region-bracket">
                            <h3 className="region-title">{regionName.replace('_', ' ').toUpperCase()}</h3>
                            <BracketSegment
                                bracket={getRegionBracket(regionName)}
                                regionName={regionName}
                                reverseOrder={false}
                            />
                        </div>
                    ))}
                </div>

                {/* Center - Final Four */}
                <div className="bracket-center">
                    {/* Champion Display */}
                    {champion && (
                        <div className="champion-display">
                            <div className="champion-label">Champion</div>
                            <div className="champion-card">
                                <img src={champion.image} alt={champion.name} />
                                <div className="champion-info">
                                    <span className="champion-name">{formatTeamName(champion.name)} </span>
                                    <span className="champion-mascot">{getMascotName(champion.name)}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Final Four Matchups */}
                    <div className="final-four-section">
                        <h3>Final Four</h3>
                        <div className="final-four-matchups">
                            <div className="final-four-matchup">
                                <span className="matchup-label">Semifinal</span>
                                <Matchup
                                    topTeam={finalFourMatchups[0][0]}
                                    bottomTeam={finalFourMatchups[0][1]}
                                />
                            </div>
                            <div className="final-four-matchup">
                                <span className="matchup-label">Championship</span>
                                <Matchup
                                    topTeam={finalFourMatchups[1][0]}
                                    bottomTeam={finalFourMatchups[1][1]}
                                />
                            </div>
                            <div className="final-four-matchup">
                                <span className="matchup-label">Semifinal</span>
                                <Matchup
                                    topTeam={finalFourMatchups[2][0]}
                                    bottomTeam={finalFourMatchups[2][1]}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Regions */}
                <div className="bracket-side right-side">
                    {rightRegions.map((regionName) => (
                        <div key={regionName} className="region-bracket">
                            <h3 className="region-title">{regionName.replace('_', ' ').toUpperCase()}</h3>
                            <BracketSegment
                                bracket={getRegionBracket(regionName)}
                                regionName={regionName}
                                reverseOrder={true}
                            />
                        </div>
                    ))}
                </div>
            </div>
            {children}
        </div>
    );
}

export default FullBracketDisplay;
