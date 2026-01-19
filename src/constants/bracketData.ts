/**
 * Bracket Data and Constants for Mascot Madness
 * Migrated from Angular mascot-2025 project
 * 
 * =============================================================================
 * DATA STRUCTURE OVERVIEW
 * =============================================================================
 * 
 * This file contains bracket data for both Men's and Women's NCAA tournaments.
 * 
 * Each tournament is defined using the TournamentConfig interface which groups:
 * - regions: Teams per region (16 seeds per region)
 * - regionOrder: Display order of regions
 * - firstFourMapping: Play-in game winners
 * - cutoffTime: When saves are locked
 * - selectionSundayTime: When teams are announced
 * 
 * TEAM NAME FORMAT:
 * - All lowercase, underscores for spaces: "north_carolina", "michigan_state"
 * - Must match a .jpg file in public/assets/teams/ directory
 * - Must match an entry in nicknames.json
 * 
 * PLAY-IN GAMES (First Four):
 * - When a seed has a play-in game, format: "{team1}_or_{team2}"
 * - Example: "texas_or_xavier" means Texas vs Xavier played to be that seed
 * 
 * =============================================================================
 */

import type { TournamentConfig, Gender } from '../types/bracket';

export const currentYear: number = new Date().getFullYear();

// =============================================================================
// MEN'S TOURNAMENT CONFIGURATIONS
// =============================================================================

export const mensTournament2022: TournamentConfig = {
    year: 2022,
    gender: 'men',
    regions: {
        west: [
            "gonzaga", "duke", "texas_tech", "arkansas", "uconn", "alabama", "michigan_state", "boise_state",
            "memphis", "davidson", "notre_dame_or_rutgers", "new_mexico_state", "vermont", "montana_state", "csu_fullerton", "georgia_state"
        ],
        east: [
            "baylor", "kentucky", "purdue", "ucla", "saint_marys", "texas", "murray_state", "north_carolina",
            "marquette", "san_francisco", "virginia_tech", "indiana_or_wyoming", "akron", "yale", "saint_peters", "norfolk_state"
        ],
        south: [
            "arizona", "villanova", "tennessee", "illinois", "houston", "colorado_state", "ohio_state", "seton_hall",
            "tcu", "loyola_chicago", "michigan", "uab", "chattanooga", "longwood", "delaware", "wright_state_or_bryant"
        ],
        midwest: [
            "kansas", "auburn", "wisconsin", "providence", "iowa", "lsu", "usc", "san_diego_state",
            "creighton", "miami", "iowa_state", "richmond", "south_dakota_state", "colgate", "jacksonville_state", "texas_southern_or_texas_a&m_cc"
        ]
    },
    regionOrder: ["west", "south", "midwest", "east"],
    firstFourMapping: {
        "notre_dame_or_rutgers": "notre_dame",
        "indiana_or_wyoming": "indiana",
        "wright_state_or_bryant": "wright_state",
        "texas_southern_or_texas_a&m_cc": "texas_southern",
    },
    cutoffTime: new Date(Date.UTC(2022, 2, 17, 16, 15)),
    selectionSundayTime: new Date(Date.UTC(2022, 2, 13, 22, 0)),
};

export const mensTournament2023: TournamentConfig = {
    year: 2023,
    gender: 'men',
    regions: {
        south: [
            "alabama", "arizona", "baylor", "virginia", "san_diego_state", "creighton", "missouri", "maryland",
            "west_virginia", "utah_state", "nc_state", "charleston", "furman", "ucsb", "princeton", "texas_a&m_cc_or_southeast_missouri_state"
        ],
        midwest: [
            "houston", "texas", "xavier", "indiana", "miami", "iowa_state", "texas_a&m", "iowa",
            "auburn", "penn_state", "mississippi_state_or_pittsburgh", "drake", "kent_state", "kennesaw_state", "colgate", "northern_kentucky"
        ],
        west: [
            "kansas", "ucla", "gonzaga", "uconn", "saint_marys", "tcu", "northwestern", "arkansas",
            "illinois", "boise_state", "arizona_state_or_nevada", "vcu", "iona", "grand_canyon", "unc_asheville", "howard"
        ],
        east: [
            "purdue", "marquette", "kansas_state", "tennessee", "duke", "kentucky", "michigan_state", "memphis",
            "florida_atlantic", "usc", "providence", "oral_roberts", "louisiana", "montana_state", "vermont", "texas_southern_or_fdu"
        ],
    },
    regionOrder: ["south", "midwest", "west", "east"],
    firstFourMapping: {
        "texas_a&m_cc_or_southeast_missouri_state": "texas_a&m_cc",
        "texas_southern_or_fdu": "fdu",
        "mississippi_state_or_pittsburgh": "pittsburgh",
        "arizona_state_or_nevada": "arizona_state",
    },
    cutoffTime: new Date(Date.UTC(2023, 2, 16, 16, 15)),
    selectionSundayTime: new Date(Date.UTC(2023, 2, 12, 22, 0)),
};

export const mensTournament2024: TournamentConfig = {
    year: 2024,
    gender: 'men',
    regions: {
        east: [
            "uconn", "iowa_state", "illinois", "auburn", "san_diego_state", "byu", "washington_state", "florida_atlantic",
            "northwestern", "drake", "duquesne", "uab", "yale", "morehead_state", "south_dakota_state", "stetson"
        ],
        west: [
            "north_carolina", "arizona", "baylor", "alabama", "saint_marys", "clemson", "dayton", "mississippi_state",
            "michigan_state", "nevada", "new_mexico", "grand_canyon", "charleston", "colgate", "long_beach_state", "howard"
        ],
        midwest: [
            "purdue", "tennessee", "creighton", "kansas", "gonzaga", "south_carolina", "texas", "utah_state",
            "tcu", "colorado_state", "oregon", "mcneese", "samford", "akron", "saint_peters", "grambling_state"
        ],
        south: [
            "houston", "marquette", "kentucky", "duke", "wisconsin", "texas_tech", "florida", "nebraska",
            "texas_a&m", "colorado", "nc_state", "james_madison", "vermont", "oakland", "western_kentucky", "longwood"
        ]
    },
    regionOrder: ["east", "south", "midwest", "west"],
    firstFourMapping: {},
    cutoffTime: new Date(Date.UTC(2024, 2, 21, 16, 15)),
    selectionSundayTime: new Date(Date.UTC(2024, 2, 17, 22, 0)),
};

export const mensTournament2025: TournamentConfig = {
    year: 2025,
    gender: 'men',
    regions: {
        south: [
            "auburn", "michigan_state", "iowa_state", "texas_a&m", "michigan", "ole_miss", "marquette", "louisville",
            "creighton", "new_mexico", "san_diego_state_or_north_carolina", "uc_san_diego", "yale", "lipscomb", "bryant", "alabama_state_or_saint_francis_u",
        ],
        east: [
            "duke", "alabama", "wisconsin", "arizona", "oregon", "byu", "saint_marys", "mississippi_state",
            "baylor", "vanderbilt", "vcu", "liberty", "akron", "montana", "robert_morris", "american_or_mount_saint_marys",
        ],
        midwest: [
            "houston", "tennessee", "kentucky", "purdue", "clemson", "illinois", "ucla", "gonzaga",
            "georgia", "utah_state", "texas_or_xavier", "mcneese", "high_point", "troy", "wofford", "siu_edwardsville",
        ],
        west: [
            "florida", "saint_johns", "texas_tech", "maryland", "memphis", "missouri", "kansas", "uconn",
            "oklahoma", "arkansas", "drake", "colorado_state", "grand_canyon", "unc_wilmington", "omaha", "norfolk_state",
        ],
    },
    regionOrder: ["south", "east", "midwest", "west"],
    firstFourMapping: {
        "san_diego_state_or_north_carolina": "north_carolina",
        "alabama_state_or_saint_francis_u": "alabama_state",
        "american_or_mount_saint_marys": "mount_saint_marys",
        "texas_or_xavier": "xavier",
    },
    cutoffTime: new Date(Date.UTC(2025, 2, 20, 16, 15)),
    selectionSundayTime: new Date(Date.UTC(2025, 2, 16, 22, 0)),
};

export const mensTournament2026: TournamentConfig = {
    year: 2026,
    gender: 'men',
    regions: null,
    regionOrder: null,
    firstFourMapping: null,
    cutoffTime: new Date(Date.UTC(2026, 2, 20, 16, 15)), // Estimated
    selectionSundayTime: new Date(Date.UTC(2026, 2, 15, 22, 0)), // Estimated
};

// =============================================================================
// WOMEN'S TOURNAMENT CONFIGURATIONS
// =============================================================================

export const womensTournament2025: TournamentConfig = {
    year: 2025,
    gender: 'women',
    regions: {
        regional_1: [
            "ucla", "nc_state", "lsu", "baylor", "ole_miss", "florida_state", "michigan_state", "richmond",
            "georgia_tech", "harvard", "george_mason", "ball_state", "grand_canyon", "san_diego_state", "vermont", "uc_san_diego_or_southern"
        ],
        regional_2: [
            "south_carolina", "duke", "north_carolina", "maryland", "alabama", "west_virginia", "vanderbilt", "utah",
            "indiana", "oregon", "columbia_or_washington", "green_bay", "norfolk_state", "oregon_state", "lehigh", "tennessee_tech"
        ],
        regional_3: [
            "texas", "tcu", "notre_dame", "ohio_state", "tennessee", "michigan", "louisville", "illinois",
            "creighton", "nebraska", "iowa_state_or_princeton", "south_florida", "montana_state", "sf_austin", "fdu", "william_mary_or_high_point"
        ],
        regional_4: [
            "usc", "uconn", "oklahoma", "kentucky", "kansas_state", "iowa", "oklahoma_state", "california",
            "mississippi_state", "south_dakota_state", "murray_state", "fairfield", "liberty", "fgcu", "arkansas_state", "unc_greensboro"
        ],
    },
    regionOrder: ["regional_1", "regional_2", "regional_3", "regional_4"],
    firstFourMapping: {
        "uc_san_diego_or_southern": "southern",
        "columbia_or_washington": "columbia",
        "iowa_state_or_princeton": "iowa_state",
        "william_mary_or_high_point": "william_mary",
    },
    cutoffTime: new Date(Date.UTC(2025, 2, 21, 18, 0)),
    selectionSundayTime: new Date(Date.UTC(2025, 2, 17, 0, 0)),
};

export const womensTournament2026: TournamentConfig = {
    year: 2026,
    gender: 'women',
    regions: null,
    regionOrder: null,
    firstFourMapping: null,
    cutoffTime: new Date(Date.UTC(2026, 2, 20, 18, 0)), // Estimated
    selectionSundayTime: new Date(Date.UTC(2026, 2, 16, 0, 0)), // Estimated
};

// =============================================================================
// TOURNAMENT LOOKUP MAPS
// =============================================================================

export const mensTournaments: Record<number, TournamentConfig> = {
    2022: mensTournament2022,
    2023: mensTournament2023,
    2024: mensTournament2024,
    2025: mensTournament2025,
    2026: mensTournament2026,
};

export const womensTournaments: Record<number, TournamentConfig> = {
    2025: womensTournament2025,
    2026: womensTournament2026,
};

export const tournaments: Record<Gender, Record<number, TournamentConfig>> = {
    men: mensTournaments,
    women: womensTournaments,
};

// =============================================================================
// BACKWARDS COMPATIBILITY EXPORTS
// These computed objects maintain the old API for existing consumers
// =============================================================================

// Old-style bracket data exports
export const bracketData22 = mensTournament2022.regions;
export const bracketData23 = mensTournament2023.regions;
export const bracketData24 = mensTournament2024.regions;
export const bracketData25 = mensTournament2025.regions;
export const bracketData26 = mensTournament2026.regions;

export const bracketData: Record<number, Record<string, string[]> | null> = {
    2022: bracketData22,
    2023: bracketData23,
    2024: bracketData24,
    2025: bracketData25,
    2026: bracketData26,
};

export const womensBracketData25 = womensTournament2025.regions;
export const womensBracketData26 = womensTournament2026.regions;

export const womensBracketData: Record<number, Record<string, string[]> | null> = {
    2025: womensBracketData25,
    2026: womensBracketData26,
};

// Region order exports
export const regionOrder: Record<number, string[] | null> = {
    2022: mensTournament2022.regionOrder,
    2023: mensTournament2023.regionOrder,
    2024: mensTournament2024.regionOrder,
    2025: mensTournament2025.regionOrder,
    2026: mensTournament2026.regionOrder,
};

export const womensRegionOrder: Record<number, string[] | null> = {
    2025: womensTournament2025.regionOrder,
    2026: womensTournament2026.regionOrder,
};

// First Four mapping exports
export const firstFourMapping: Record<number, Record<string, string> | null> = {
    2022: mensTournament2022.firstFourMapping,
    2023: mensTournament2023.firstFourMapping,
    2024: mensTournament2024.firstFourMapping,
    2025: mensTournament2025.firstFourMapping,
    2026: mensTournament2026.firstFourMapping,
};

export const womensFirstFourMapping: Record<number, Record<string, string> | null> = {
    2025: womensTournament2025.firstFourMapping,
    2026: womensTournament2026.firstFourMapping,
};

// Cutoff time exports
export const cutOffTimes: Record<number, Date> = {
    2022: mensTournament2022.cutoffTime,
    2023: mensTournament2023.cutoffTime,
    2024: mensTournament2024.cutoffTime,
    2025: mensTournament2025.cutoffTime,
    2026: mensTournament2026.cutoffTime,
};

export const womensCutOffTimes: Record<number, Date> = {
    2025: womensTournament2025.cutoffTime,
    2026: womensTournament2026.cutoffTime,
};

// Selection Sunday time exports
export const selectionSundayTimes: Record<number, Date> = {
    2022: mensTournament2022.selectionSundayTime,
    2023: mensTournament2023.selectionSundayTime,
    2024: mensTournament2024.selectionSundayTime,
    2025: mensTournament2025.selectionSundayTime,
    2026: mensTournament2026.selectionSundayTime,
};

export const womensSelectionSundayTimes: Record<number, Date> = {
    2025: womensTournament2025.selectionSundayTime,
    2026: womensTournament2026.selectionSundayTime,
};
