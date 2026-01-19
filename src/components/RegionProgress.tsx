/**
 * RegionProgress Component
 * 
 * Displays clickable progress boxes for each region in the bracket.
 * Shows completion status and allows switching between regions.
 */

import { formatTeamName } from '../constants/nicknames';
import { Region } from '../services/bracketService';

interface RegionProgressProps {
    regionNames: string[];
    regions: Record<string, Region>;
    currentRegionName: string;
    getRegionProgress: (regionName: string) => [number, number];
    onSwitchRegion: (regionName: string) => void;
}

function RegionProgress({
    regionNames,
    regions,
    currentRegionName,
    getRegionProgress,
    onSwitchRegion
}: RegionProgressProps): React.ReactElement {
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
