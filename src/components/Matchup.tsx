/**
 * Matchup Component
 * 
 * Displays a single matchup pair (two teams) in a bracket.
 * Used by BracketSegment to display tournament matchups.
 * 
 * Supports displaying correct/incorrect indicators when showCorrectAnswers is enabled:
 * - Green checkmark ✓ + bold for correct picks that won
 * - Red X + strikethrough for incorrect picks
 * - Wrong opponent: strikethrough user's pick + show actual team below
 * - Winner is always bolded
 */

import { formatTeamName } from '../constants/nicknames';
import { transformTeamName } from '../utils/teamNameTransform';
import { Team } from '../services/bracketService';
import './Matchup.css';

interface MatchupProps {
    topTeam: Team | null;
    bottomTeam: Team | null;
    // Props for correct answer display
    correctWinner?: string;        // NCAA SEO name of correct winner
    correctLoser?: string;         // NCAA SEO name of correct loser
    correctTeam1?: string;         // Actual team in top slot
    correctTeam2?: string;         // Actual team in bottom slot
    topTeamScore?: number | null;  // Score for winner
    bottomTeamScore?: number | null; // Score for loser
    showCorrectAnswers?: boolean;  // Toggle correct answer display
    userPickedWinner?: Team | null; // The team the user picked to win this matchup
}

/**
 * Determines how to display a team slot:
 * - 'correct': User picked correctly and team won (green check, bold)
 * - 'incorrect-loser': User picked correctly but team lost (shows as loser, not bold)
 * - 'wrong-team': User picked wrong team entirely (strikethrough + show actual)
 * - 'pending': Game not played yet
 * - null: No scoring display
 */
type TeamDisplayState = 'correct-winner' | 'correct-loser' | 'wrong-team' | 'pending' | null;

interface TeamDisplayInfo {
    state: TeamDisplayState;
    userPick: string | null;     // What the user picked
    actualTeam: string | null;   // What team is actually in this slot
    isWinner: boolean;           // Is this the winning team?
    score: number | null;        // Score if applicable
}

function Matchup({
    topTeam,
    bottomTeam,
    correctWinner,
    correctLoser,
    correctTeam1,
    correctTeam2,
    topTeamScore,
    bottomTeamScore,
    showCorrectAnswers = false,
    userPickedWinner
}: MatchupProps): React.ReactElement {

    /**
     * Determine display info for a team slot
     * @param userTeam - The team the user picked for this slot
     * @param correctTeam - The actual team that should be in this slot
     * @param slotPosition - 'top' or 'bottom' for score assignment
     */
    const getTeamDisplayInfo = (
        userTeam: Team | null,
        correctTeam: string | undefined,
        slotPosition: 'top' | 'bottom'
    ): TeamDisplayInfo => {
        const userPick = userTeam?.name || null;
        const actualTeam = correctTeam || null;

        // Determine score based on slot position
        const score = slotPosition === 'top' ? (topTeamScore ?? null) : (bottomTeamScore ?? null);

        // Not showing correct answers - no special state
        if (!showCorrectAnswers || !correctWinner) {
            return { state: null, userPick, actualTeam: null, isWinner: false, score: null };
        }

        // Game not yet played (winner is empty string)
        if (correctWinner === '') {
            return { state: 'pending', userPick, actualTeam, isWinner: false, score: null };
        }

        // Determine if the actual team in this slot is the winner
        // Use transformed names for comparison
        const isWinner = actualTeam?.toLowerCase() === correctWinner.toLowerCase();

        // Check if user picked correctly for this slot
        const userPickedCorrectly = userPick && actualTeam &&
            transformTeamName(userPick) === transformTeamName(actualTeam);

        if (userPickedCorrectly) {
            // User picked the right team for this slot

            // Logic Update: Only show Red X (correct-loser) if user actively picked this team to win.
            // Only show Green Check (correct-winner) if user actively picked this team to win.

            let doesUserPickMatchThisTeam = false;
            // Transformation required because userPickedWinner comes from bracket data (Friendly Name)
            // and actualTeam comes from correct data (NCAA Key)
            if (userPickedWinner && actualTeam) {
                doesUserPickMatchThisTeam = transformTeamName(userPickedWinner.name) === transformTeamName(actualTeam);
            }

            if (isWinner) {
                // This team WON.
                if (doesUserPickMatchThisTeam) {
                    // User picked them to win -> Green Check
                    return { state: 'correct-winner', userPick, actualTeam, isWinner: true, score };
                } else {
                    // User did NOT pick them (picked the other team).
                    // This team won, but user was wrong.
                    // Should be BOLD (because winner) but NO Green Check.
                    // Returning null state removes any icon but keeps winner bolding (via isWinner)
                    return { state: null, userPick, actualTeam, isWinner: true, score };
                }
            } else {
                // This team LOST.
                if (doesUserPickMatchThisTeam) {
                    // User picked them to win -> Red X
                    return { state: 'correct-loser', userPick, actualTeam, isWinner: false, score };
                } else {
                    // User did NOT pick them (picked the other team, who won).
                    // User was correct about this team losing.
                    // No Red X. Normal display.
                    return { state: null, userPick, actualTeam, isWinner: false, score };
                }
            }
        } else {
            // User picked wrong team - show strikethrough with actual team
            return { state: 'wrong-team', userPick, actualTeam, isWinner, score };
        }
    };

    const topInfo = getTeamDisplayInfo(topTeam, correctTeam1, 'top');
    const bottomInfo = getTeamDisplayInfo(bottomTeam, correctTeam2, 'bottom');

    const renderTeam = (info: TeamDisplayInfo, position: 'top' | 'bottom') => {
        const positionClass = `${position}-team`;

        // Build class list based on state
        let stateClass = '';
        if (info.state === 'correct-winner') stateClass = 'correct';
        else if (info.state === 'correct-loser') stateClass = 'loser';
        else if (info.state === 'wrong-team') stateClass = 'wrong-team';
        else if (info.state === 'pending') stateClass = 'pending';

        // Add winner class for bold styling
        const winnerClass = info.isWinner ? 'winner' : '';

        return (
            <div className={`team ${positionClass} ${stateClass} ${winnerClass}`.trim()}>
                {info.state === 'wrong-team' ? (
                    // Wrong team scenario: show strikethrough + actual team
                    <div className="wrong-team-display">
                        {info.userPick && (
                            <span className="strikethrough-pick">
                                {formatTeamName(info.userPick)}
                                <span className="wrong-icon" aria-label="Wrong pick">✗</span>
                            </span>
                        )}
                        {info.actualTeam && (
                            <span className={`actual-team ${info.isWinner ? 'winner' : ''}`}>
                                {formatTeamName(info.actualTeam)}
                            </span>
                        )}
                        {showCorrectAnswers && info.score != null && (
                            <span className="team-score">{info.score}</span>
                        )}
                    </div>
                ) : (
                    // Normal display: team name with optional indicators
                    <>
                        <span className="team-name">
                            {info.userPick ? formatTeamName(info.userPick) : '—'}
                        </span>
                        {showCorrectAnswers && info.score != null && (
                            <span className="team-score">{info.score}</span>
                        )}
                        {info.state === 'correct-winner' && (
                            <span className="status-icon correct-icon" aria-label="Correct pick">✓</span>
                        )}
                        {info.state === 'correct-loser' && (
                            <span className="status-icon loser-icon" aria-label="Lost">✗</span>
                        )}
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="matchup-pair">
            <div className="matchup-box">
                {renderTeam(topInfo, 'top')}
                {renderTeam(bottomInfo, 'bottom')}
            </div>
        </div>
    );
}

export default Matchup;
