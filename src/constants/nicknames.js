/**
 * Team nicknames/mascots mapping
 * Migrated from Angular mascot-2025 project
 * Data stored in shared-data/nicknames.json for reuse across frontend and functions
 */

import nicknames from '../../shared-data/nicknames.json';
export { nicknames };

/**
 * Helper function to get a team's mascot nickname
 * @param {string} teamKey - The team key (e.g., "duke", "north_carolina")
 * @returns {string} The mascot nickname or the original key if not found
 */
export function getMascotName(teamKey) {
    const rawName = nicknames[teamKey] || teamKey.replace(/_/g, ' ');
    return rawName
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Capitalize mascot name (title case)
 * e.g., "crimson tide" -> "Crimson Tide"
 * @param {string} teamKey - The team key
 * @returns {string} The formatted mascot name
 */
export function formatMascotName(teamKey) {
    const mascot = getMascotName(teamKey);
    return mascot
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

/**
 * Helper function to format team name from key
 * @param {string} teamKey - The team key (e.g., "north_carolina", "texas_a&m")
 * @returns {string} Formatted team name (e.g., "North Carolina", "Texas A&M")
 */
export function formatTeamName(teamKey) {
    if (!teamKey) return '';

    // Special cases for abbreviations that should be all caps
    const abbreviations = {
        'a&m': 'A&M',
        'cc': 'CC',      // Corpus Christi
        'uc': 'UC',      // UC Irvine, UC San Diego
        'nc': 'NC',      // NC State, NC Central
        'unc': 'UNC',    // UNC Wilmington, UNC Asheville
        'tcu': 'TCU',
        'byu': 'BYU',
        'lsu': 'LSU',
        'usc': 'USC',
        'uab': 'UAB',
        'ucla': 'UCLA',
        'uconn': 'UConn',
        'ucsb': 'UCSB',
        'vcu': 'VCU',
        'fdu': 'FDU',
        'siu': 'SIU',
    };

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
