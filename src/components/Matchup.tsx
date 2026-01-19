/**
 * Matchup Component
 * 
 * Displays a single matchup pair (two teams) in a bracket.
 * Used by BracketSegment to display tournament matchups.
 */

import { formatTeamName } from '../constants/nicknames';
import { Team } from '../services/bracketService';
import './Matchup.css';

interface MatchupProps {
    topTeam: Team | null;
    bottomTeam: Team | null;
}

function Matchup({ topTeam, bottomTeam }: MatchupProps): React.ReactElement {
    return (
        <div className="matchup-pair">
            <div className="matchup-box">
                <div className="team top-team">
                    {topTeam ? formatTeamName(topTeam.name) : '—'}
                </div>
                <div className="team bottom-team">
                    {bottomTeam ? formatTeamName(bottomTeam.name) : '—'}
                </div>
            </div>
        </div>
    );
}

export default Matchup;
