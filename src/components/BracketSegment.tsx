/**
 * BracketSegment Component
 * 
 * Displays a single region's bracket (all rounds).
 * Uses flex layout where each matchup container evenly fills the bracket height.
 */

import Matchup from './Matchup';
import { Team } from '../services/bracketService';
import './BracketSegment.css';

interface BracketSegmentProps {
    bracket: (Team | null)[][];
    reverseOrder?: boolean;
    showRoundHeaders?: boolean;
}

function BracketSegment({ bracket, reverseOrder = false, showRoundHeaders = false }: BracketSegmentProps): React.ReactElement {
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
                        {getMatchupPairs(round).map((matchup, matchupIndex) => (
                            <div key={matchupIndex} className="matchup-wrapper">
                                <Matchup
                                    topTeam={matchup[0]}
                                    bottomTeam={matchup[1]}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default BracketSegment;
