/**
 * RegionProgress Component
 * 
 * Displays clickable progress boxes for each region in the bracket.
 * Shows completion status and allows switching between regions.
 */

import { formatTeamName } from '../constants/nicknames';

function RegionProgress({ regionNames, regions, currentRegionName, getRegionProgress, onSwitchRegion }) {
    return (
        <div className="progress-container">
            {regionNames.map(regionName => {
                const progress = getRegionProgress(regionName);
                const region = regions[regionName];
                const isComplete = region?.getChampion();
                return (
                    <div
                        key={regionName}
                        className={`progress-box ${regionName === currentRegionName ? 'active' : ''} ${isComplete ? 'complete' : ''}`}
                        onClick={() => onSwitchRegion(regionName)}
                    >
                        <span className="region-title">{formatTeamName(regionName)}</span>
                        <span className="progress-text">
                            {isComplete ? '✓' : `${progress[0]} / ${progress[1]}`}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

export default RegionProgress;
