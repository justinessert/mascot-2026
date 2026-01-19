/**
 * TeamCard Component
 * 
 * Displays a single team card with mascot image and previous pick indicator.
 */

import { formatMascotName, formatTeamName } from '../constants/nicknames';
import { RenderImageWithMagnifier } from './ImageModal';
import { Team } from '../services/bracketService';

interface TeamCardProps {
    team: Team;
    onSelect: (team: Team) => void;
    onExpandImage: (src: string) => void;
    isPreviousPick: boolean;
}

function TeamCard({ team, onSelect, onExpandImage, isPreviousPick }: TeamCardProps): React.ReactElement {
    return (
        <div
            className="team-card"
            onClick={() => onSelect(team)}
        >
            {team.image && (
                <RenderImageWithMagnifier
                    src={team.image}
                    alt={team.name}
                    onExpand={onExpandImage}
                />
            )}
            <p className="mascot-name">
                {formatMascotName(team.name)}
                {isPreviousPick && <span className="previous-pick-star">*</span>}
            </p>
            <p className="team-name">{formatTeamName(team.name)}</p>
        </div>
    );
}

export default TeamCard;
