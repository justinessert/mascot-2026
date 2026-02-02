/**
 * FullBracketDisplay Component
 * 
 * Reusable full bracket view used by both "View Your Bracket" and "Shared Bracket View" pages.
 * Enforces consistent layout and styling, including mobile optimization (Final Four first).
 */

import { Link } from 'react-router-dom';
import { formatTeamName, getMascotName } from '../constants/nicknames';
import { mensTournaments } from '../constants/bracketData';
import BracketSegment from './BracketSegment';
import Matchup from './Matchup';
import { Region, Team } from '../services/bracketService';
import type { CorrectBracket } from '../services/correctBracketService';
import { ReactNode } from 'react';
import '../pages/FullBracket.css'; // Reuse existing styles

interface FullBracketDisplayProps {
    regions: Record<string, Region>;
    bracketName?: string;
    userName?: string;
    contributors?: string[];
    year: string | number;
    onBack?: () => void;
    backLink?: string;
    backLinkText?: string;
    regionOrder?: string[];
    children?: ReactNode;
    // Props for correct answer display
    correctBracket?: CorrectBracket | null;
    showCorrectAnswers?: boolean;
    // Props for contributor leaving
    isContributor?: boolean;
    onLeaveBracket?: () => void;
}

function FullBracketDisplay({
    regions,
    bracketName,
    userName,
    contributors = [],
    year,

    backLink,
    backLinkText,
    regionOrder: providedRegionOrder,
    children,
    correctBracket,
    showCorrectAnswers = false,
    isContributor = false,
    onLeaveBracket
}: FullBracketDisplayProps): React.ReactElement {
    const numericYear = parseInt(String(year), 10);

    // Get region bracket data
    const getRegionBracket = (regionName: string): (Team | null)[][] => {
        return regions[regionName]?.bracket || [];
    };

    // Get Final Four matchups
    const getFinalFourMatchups = (): [(Team | null)[], (Team | null)[], (Team | null)[]] => {
        const finalFour = regions.final_four;
        if (!finalFour || !finalFour.bracket || !finalFour.bracket[0]) {
            return [
                [null, null],
                [null, null],
                [null, null]
            ];
        }

        const bracket = finalFour.bracket;
        const semiFinalLeft: (Team | null)[] = [bracket[0][0], bracket[0][1]];
        const semiFinalRight: (Team | null)[] = [bracket[0][2], bracket[0][3]];
        const final: (Team | null)[] = bracket[1] ? [bracket[1][0], bracket[1][1]] : [null, null];

        return [semiFinalLeft, final, semiFinalRight];
    };

    // Get champion
    const getChampion = (): Team | null => {
        return regions.final_four?.getChampion?.() || null;
    };

    // Get correct answer for Final Four matchups
    // round: 1 for semifinals, 2 for championship
    // matchupIndex: 0 or 1 for semifinals, 0 for championship
    const getFinalFourCorrectAnswer = (round: number, matchupIndex: number) => {
        if (!correctBracket || !showCorrectAnswers) return null;

        const finalFourData = correctBracket.regions.final_four;
        if (!finalFourData) return null;

        const roundKey = `round_${round}`;
        if (!finalFourData[roundKey]) return null;

        const game = finalFourData[roundKey][matchupIndex];
        return game || null;
    };

    // Get the user's picked winner for Final Four matchups
    // For semifinals: winner goes to championship round (bracket[1])
    // For championship: winner goes to champion slot (bracket[2])
    const getFinalFourUserPickedWinner = (round: number, matchupIndex: number): Team | null => {
        const finalFour = regions.final_four;
        if (!finalFour || !finalFour.bracket) return null;

        if (round === 1) {
            // Semifinals: winner is in bracket[1] at matchupIndex position
            return finalFour.bracket[1]?.[matchupIndex] || null;
        } else if (round === 2) {
            // Championship: winner is in bracket[2] at index 0 (the champion)
            return finalFour.bracket[2]?.[0] || null;
        }
        return null;
    };

    // Get left and right regions based on year's order
    // Use provided order if available, otherwise fallback to men's default
    const fallbackConfig = mensTournaments[numericYear] || mensTournaments[2025];
    const order = providedRegionOrder || fallbackConfig?.regionOrder || [];
    const leftRegions = [order[0], order[3]];
    const rightRegions = [order[1], order[2]];

    const champion = getChampion();
    const finalFourMatchups = getFinalFourMatchups();

    // Get correct answers for Final Four
    const semiFinal1Correct = getFinalFourCorrectAnswer(1, 0);
    const semiFinal2Correct = getFinalFourCorrectAnswer(1, 1);
    const championshipCorrect = getFinalFourCorrectAnswer(2, 0);

    return (
        <div className="full-bracket-container">
            {/* Header */}
            <div className="shared-bracket-header">
                <h2>{bracketName ? `${bracketName} - ${year}` : `${year} Bracket`}</h2>
                {userName && (
                    <p className="bracket-owner">
                        by {contributors.length > 0
                            ? `${userName} and ${contributors.join(' and ')}`
                            : userName
                        }
                    </p>
                )}

                {backLink && (
                    <Link to={backLink} className="back-link">
                        ← {backLinkText || 'Back'}
                    </Link>
                )}

                {/* Leave Bracket button for contributors */}
                {isContributor && onLeaveBracket && (
                    <button
                        className="leave-bracket-btn"
                        onClick={onLeaveBracket}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            background: 'var(--danger, #dc3545)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        Leave Bracket
                    </button>
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
                                reverseOrder={false}
                                regionName={regionName}
                                correctAnswers={correctBracket}
                                showCorrectAnswers={showCorrectAnswers}
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
                                    correctWinner={semiFinal1Correct?.winner}
                                    correctLoser={semiFinal1Correct?.loser}
                                    correctTeam1={semiFinal1Correct?.team1}
                                    correctTeam2={semiFinal1Correct?.team2}
                                    topTeamScore={semiFinal1Correct?.winnerScore}
                                    bottomTeamScore={semiFinal1Correct?.loserScore}
                                    showCorrectAnswers={showCorrectAnswers}
                                    userPickedWinner={getFinalFourUserPickedWinner(1, 0)}
                                />
                            </div>
                            <div className="final-four-matchup">
                                <span className="matchup-label">Championship</span>
                                <Matchup
                                    topTeam={finalFourMatchups[1][0]}
                                    bottomTeam={finalFourMatchups[1][1]}
                                    correctWinner={championshipCorrect?.winner}
                                    correctLoser={championshipCorrect?.loser}
                                    correctTeam1={championshipCorrect?.team1}
                                    correctTeam2={championshipCorrect?.team2}
                                    topTeamScore={championshipCorrect?.winnerScore}
                                    bottomTeamScore={championshipCorrect?.loserScore}
                                    showCorrectAnswers={showCorrectAnswers}
                                    userPickedWinner={getFinalFourUserPickedWinner(2, 0)}
                                />
                            </div>
                            <div className="final-four-matchup">
                                <span className="matchup-label">Semifinal</span>
                                <Matchup
                                    topTeam={finalFourMatchups[2][0]}
                                    bottomTeam={finalFourMatchups[2][1]}
                                    correctWinner={semiFinal2Correct?.winner}
                                    correctLoser={semiFinal2Correct?.loser}
                                    correctTeam1={semiFinal2Correct?.team1}
                                    correctTeam2={semiFinal2Correct?.team2}
                                    topTeamScore={semiFinal2Correct?.winnerScore}
                                    bottomTeamScore={semiFinal2Correct?.loserScore}
                                    showCorrectAnswers={showCorrectAnswers}
                                    userPickedWinner={getFinalFourUserPickedWinner(1, 1)}
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
                                reverseOrder={true}
                                regionName={regionName}
                                correctAnswers={correctBracket}
                                showCorrectAnswers={showCorrectAnswers}
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
