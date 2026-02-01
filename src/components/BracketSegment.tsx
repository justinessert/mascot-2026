/**
 * BracketSegment Component
 * 
 * Displays a single region's bracket (all rounds).
 * Uses flex layout where each matchup container evenly fills the bracket height.
 * 
 * Supports displaying correct answer indicators when correctAnswers is provided.
 */

import Matchup from './Matchup';
import { Team } from '../services/bracketService';
import type { CorrectBracket } from '../services/correctBracketService';
import './BracketSegment.css';

/**
 * The backend (buildCorrectBracket in scoring.ts) now stores games in the same order
 * as the user bracket display, so no index mapping is needed on the frontend.
 * The roundOrders mapping is applied during backend processing.
 */

interface BracketSegmentProps {
    bracket: (Team | null)[][];
    reverseOrder?: boolean;
    showRoundHeaders?: boolean;
    // Props for correct answer display
    regionName?: string;
    correctAnswers?: CorrectBracket | null;
    showCorrectAnswers?: boolean;
}

function BracketSegment({
    bracket,
    reverseOrder = false,
    showRoundHeaders = false,
    regionName,
    correctAnswers,
    showCorrectAnswers = false
}: BracketSegmentProps): React.ReactElement {
    if (!bracket || bracket.length === 0) {
        return <div className="bracket-segment">No bracket data</div>;
    }

    // Get all rounds except the last (which is the champion)
    const getBracketRounds = (): (Team | null)[][] => {
        return bracket.slice(0, bracket.length - 1);
    };

    // Convert a round array to pairs of matchups
    const getMatchupPairs = (round: (Team | null)[]): [Team | null, Team | null][] => {
        const pairs: [Team | null, Team | null][] = [];
        for (let i = 0; i < round.length; i += 2) {
            pairs.push([round[i], round[i + 1]]);
        }
        return pairs;
    };

    // Get correct answer data for a specific matchup
    const getCorrectAnswer = (roundIndex: number, matchupIndex: number) => {
        if (!correctAnswers || !regionName) return null;

        const actualRoundNumber = roundIndex + 1; // Rounds are 1-indexed in correctBracket
        const roundKey = `round_${actualRoundNumber}`;
        const regionData = correctAnswers.regions[regionName];

        if (!regionData || !regionData[roundKey]) return null;

        // Backend now stores games in display order, so use direct matchup index
        const game = regionData[roundKey][matchupIndex];
        return game || null;
    };

    const rounds = getBracketRounds();
    const roundNames = rounds.map((_, i) => `Round ${reverseOrder ? rounds.length - i : i + 1}`);

    return (
        <div className={`bracket-segment ${reverseOrder ? 'reversed' : ''}`}>
            {rounds.map((round, roundIndex) => (
                <div key={roundIndex} className="round">
                    {showRoundHeaders && (
                        <h4 className="round-header">{roundNames[roundIndex]}</h4>
                    )}
                    <div className="matchups-column">
                        {getMatchupPairs(round).map((matchup, matchupIndex) => {
                            const correctData = showCorrectAnswers
                                ? getCorrectAnswer(roundIndex, matchupIndex)
                                : null;

                            // The winner of this matchup is stored in the next round at the same matchup index
                            const userPickedWinner = bracket[roundIndex + 1]?.[matchupIndex];

                            return (
                                <div key={matchupIndex} className="matchup-wrapper">
                                    <Matchup
                                        topTeam={matchup[0]}
                                        bottomTeam={matchup[1]}
                                        correctWinner={correctData?.winner}
                                        correctLoser={correctData?.loser}
                                        correctTeam1={correctData?.team1}
                                        correctTeam2={correctData?.team2}
                                        topTeamScore={correctData?.winnerScore}
                                        bottomTeamScore={correctData?.loserScore}
                                        showCorrectAnswers={showCorrectAnswers}
                                        userPickedWinner={userPickedWinner || null}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BracketSegment;
