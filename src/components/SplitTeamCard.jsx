/**
 * SplitTeamCard Component
 * 
 * Displays a split card for play-in games (where team is TBD).
 * Shows two sub-teams.
 */

import { formatTeamName, getMascotName } from '../constants/nicknames';
import { RenderImageWithMagnifier } from './ImageModal';

function SplitTeamCard({ team, onSelect, onExpandImage, checkPreviousPick }) {
    const subTeamNames = team.name.split('_or_');
    const subTeams = subTeamNames.map(name => ({
        name,
        displayName: formatTeamName(name),
        mascot: getMascotName(name),
        image: `/assets/teams/${name}.jpg`
    }));

    return (
        <div
            className="team-card split-team-card"
            onClick={() => onSelect(team)}
        >
            <div className="sub-team top">
                <div className="sub-team-info">
                    <p className="team-name">{subTeams[0].displayName}</p>
                    <p className="mascot-name">
                        {subTeams[0].mascot}
                        {checkPreviousPick(subTeams[0].name) && <span className="previous-pick-star">*</span>}
                    </p>
                </div>
                <RenderImageWithMagnifier
                    src={subTeams[0].image}
                    alt={subTeams[0].name}
                    onExpand={onExpandImage}
                />
            </div>
            <div className="split-divider"></div>
            <div className="sub-team bottom">
                <div className="sub-team-info">
                    <p className="team-name">{subTeams[1].displayName}</p>
                    <p className="mascot-name">
                        {subTeams[1].mascot}
                        {checkPreviousPick(subTeams[1].name) && <span className="previous-pick-star">*</span>}
                    </p>
                </div>
                <RenderImageWithMagnifier
                    src={subTeams[1].image}
                    alt={subTeams[1].name}
                    onExpand={onExpandImage}
                />
            </div>
        </div>
    );
}

export default SplitTeamCard;
