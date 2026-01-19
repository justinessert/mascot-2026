/**
 * Team nicknames/mascots mapping
 * Migrated from Angular mascot-2025 project
 * Data stored in shared-data/nicknames.json for reuse across frontend and functions
 */

import type { NicknamesDictionary } from '../types/bracket';
import nicknamesData from '../../shared-data/nicknames.json';
import abbreviationsData from '../../shared-data/abbreviations.json';

export const nicknames: NicknamesDictionary = nicknamesData;

/**
 * Helper function to get a team's mascot nickname
 * @param teamKey - The team key (e.g., "duke", "north_carolina")
 * @returns The mascot nickname or the original key if not found
 */
export function getMascotName(teamKey: string): string {
    const rawName = nicknames[teamKey] || teamKey.replace(/_/g, ' ');
    return rawName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Capitalize mascot name (title case)
 * e.g., "crimson tide" -> "Crimson Tide"
 * @param teamKey - The team key
 * @returns The formatted mascot name
 */
export function formatMascotName(teamKey: string): string {
    const mascot = getMascotName(teamKey);
    return mascot
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Helper function to format team name from key
 * @param teamKey - The team key (e.g., "north_carolina", "texas_a&m")
 * @returns Formatted team name (e.g., "North Carolina", "Texas A&M")
 */
export function formatTeamName(teamKey: string): string {
    if (!teamKey) return '';

    // Special cases for abbreviations that should be all caps
    const abbreviations: Record<string, string> = abbreviationsData;

    return teamKey
        .split('_')
        .map(word => {
            const lower = word.toLowerCase();
            // Check if it's a known abbreviation
            if (abbreviations[lower]) {
                return abbreviations[lower];
            }
            // Otherwise, capitalize first letter
            return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ');
}
