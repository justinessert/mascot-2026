import { useState, useEffect } from 'react';
import type {
    TournamentsData,
    NicknamesData,
    SpecialNcaaNamesData,
    SchoolsData,
    TeamAuditData
} from '../types/data';

// Import JSON data directly using configured aliases
import tournamentsDataRaw from '@shared/tournaments.json';
import nicknamesDataRaw from '@shared/nicknames.json';
import specialNcaaNamesRaw from '@shared/specialNcaaNames.json';
import schoolsDataRaw from '@shared/schools.json';

const tournaments = tournamentsDataRaw as TournamentsData;
const nicknames = nicknamesDataRaw as NicknamesData;
const specialNcaaNames = specialNcaaNamesRaw as SpecialNcaaNamesData;
const schools = schoolsDataRaw as SchoolsData;

// Get list of existing team images in the sibling project
// This relies on Vite's import.meta.glob feature and the @assets alias
const teamImagesGlob = import.meta.glob('@assets/teams/*.jpg', { query: '?url', import: 'default' });

// Extract filenames from glob keys
// Keys will look like: "/Users/.../mascot-2026/public/assets/teams/duke.jpg" or relative paths
const existingImages = new Set<string>();

Object.keys(teamImagesGlob).forEach(key => {
    const filename = key.split('/').pop();
    if (filename) {
        existingImages.add(filename);
    }
});

export function useDataAudit() {
    const [data, setData] = useState<TeamAuditData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const processData = () => {
            // Use map to collect unique year strings per team (e.g., "2025M", "2025W")
            const teamMap = new Map<string, { years: Set<string>, genders: Set<string> }>();

            // 1. Collect all unique teams from tournaments
            ['men', 'women'].forEach(genderKey => {
                const gender = genderKey as 'men' | 'women';
                const genderTournaments = tournaments[gender];

                Object.values(genderTournaments).forEach(tournament => {
                    if (!tournament.regions) return;

                    Object.values(tournament.regions).forEach(regionTeams => {
                        regionTeams.forEach(teamKey => {
                            // Handle play-in teams (e.g., "teamA_or_teamB")
                            const keysToCheck = teamKey.includes('_or_')
                                ? teamKey.split('_or_')
                                : [teamKey];

                            keysToCheck.forEach(key => {
                                if (!teamMap.has(key)) {
                                    teamMap.set(key, { years: new Set(), genders: new Set() });
                                }
                                const entry = teamMap.get(key)!;
                                // Add gendered year suffix (M/W)
                                const yearSuffix = gender === 'men' ? 'M' : 'W';
                                entry.years.add(`${tournament.year}${yearSuffix}`);
                                entry.genders.add(gender);
                            });
                        });
                    });
                });
            });

            // 2. Audit each team
            const auditResults: TeamAuditData[] = [];
            const schoolsSlugSet = new Set(schools.map(s => s.slug));

            // Check for Staged Data in LocalStorage
            const stagedDataStr = localStorage.getItem('mascot_admin_staged_changes');
            const stagedData = stagedDataStr ? JSON.parse(stagedDataStr) : {};

            teamMap.forEach((meta, teamKey) => {
                const teamStage = stagedData[teamKey] || {};

                const nickname = teamStage.nickname || nicknames[teamKey] || '';
                const hasNickname = !!nickname;

                // Image check: if we staged an image upload, we consider it "hasImage" for the UI (even if file isn't moved yet)
                const hasImage = teamStage.hasImage || existingImages.has(`${teamKey}.jpg`);

                // Mapped Name Logic:
                const explicitMapping = teamStage.mappedNcaaName !== undefined ? teamStage.mappedNcaaName : specialNcaaNames[teamKey];
                // Inferred logic: replace underscores with hyphens, and "state" (case-insensitive) with "st"
                const inferredName = teamKey.replace(/_/g, '-').replace(/state/gi, 'st');
                const validationName = explicitMapping || inferredName;

                // Check if validated name exists in schools
                const isValidNcaaName = schoolsSlugSet.has(validationName);

                const isComplete = hasNickname && hasImage && isValidNcaaName;

                auditResults.push({
                    teamKey,
                    // Only return the mapped name if it's an EXPLICIT mapping
                    mappedNcaaName: explicitMapping || '',
                    newMappedNcaaName: '',
                    ncaaName: validationName,
                    nickname: nickname,
                    newNickname: '',
                    hasNickname,
                    hasImage,
                    isValidNcaaName,
                    isComplete,
                    // Convert Set back to Array and sort descending
                    years: Array.from(meta.years).sort().reverse(),
                    genders: Array.from(meta.genders)
                });
            });
            // Sort by team key alphabetically
            auditResults.sort((a, b) => a.teamKey.localeCompare(b.teamKey));

            setData(auditResults);
            setLoading(false);
        };

        processData();
    }, []);

    return { data, loading };
}
