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
 * MEN'S TOURNAMENT (bracketData22, bracketData23, etc.):
 * - Each data structure contains a key for each region (south, east, midwest, west)
 * - Each region has an array of 16 strings representing the 16 seeds (1-16)
 * - The string is the team name matching a file in public/assets/teams/{name}.jpg
 * 
 * WOMEN'S TOURNAMENT (womensBracketData25, womensBracketData26, etc.):
 * - Regions are named regional_1, regional_2, regional_3, regional_4
 * - Same structure: 16 strings per region representing seeds 1-16
 * - UI should parse "regional_1" to display as "Regional 1"
 * 
 * PLAY-IN GAMES (First Four):
 * - When a seed has a play-in game, format: "{team1}_or_{team2}"
 * - Example: "texas_or_xavier" means Texas vs Xavier played to be that seed
 * - The firstFourMapping/womensFirstFourMapping stores the actual winner
 * 
 * TEAM NAME FORMAT:
 * - All lowercase, underscores for spaces: "north_carolina", "michigan_state"
 * - Must match a .jpg file in public/assets/teams/ directory
 * - Must match an entry in nicknames.js
 * 
 * REGION ORDERING
 * - The ordering of the regions can change from year to year
 * - The ordering of the regions should reflect a similar strucutre to the bracket where:
 *     - The first region's winner will play the fourth region's winner
 *     - The second region's winner will play the third region's winner
 * - The regions are typically displayed with:
 *     - The first region in the top left corner of the bracket
 *     - The second region in the top right corner of the bracket
 *     - The third region in the bottom right corner of the bracket
 *     - The fourth region in the bottom left corner of the bracket
 * 
 * REFERENCES:
 * - Men's Tournament: https://www.espn.com/mens-college-basketball/bracket
 * - Women's Tournament: https://www.espn.com/womens-college-basketball/bracket
 * 
 * =============================================================================
 */

export const currentYear = new Date().getFullYear();

export const bracketData22 = {
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
};

export const bracketData23 = {
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
};

export const bracketData24 = {
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
};

export const bracketData25 = {
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
};

// Women's Tournament Bracket Data (2025+)
export const womensBracketData25 = {
    // Regional 1 (#1 UCLA)
    regional_1: [
        "ucla", "nc_state", "lsu", "baylor", "ole_miss", "florida_state", "michigan_state", "richmond",
        "georgia_tech", "harvard", "george_mason", "ball_state", "grand_canyon", "san_diego_state", "vermont", "uc_san_diego_or_southern"
    ],
    // Regional 2 (#1 South Carolina)
    regional_2: [
        "south_carolina", "duke", "north_carolina", "maryland", "alabama", "west_virginia", "vanderbilt", "utah",
        "indiana", "oregon", "columbia_or_washington", "green_bay", "norfolk_state", "oregon_state", "lehigh", "tennessee_tech"
    ],
    // Regional 3 (#1 Texas)
    regional_3: [
        "texas", "tcu", "notre_dame", "ohio_state", "tennessee", "michigan", "louisville", "illinois",
        "creighton", "nebraska", "iowa_state_or_princeton", "south_florida", "montana_state", "sf_austin", "fdu", "william_mary_or_high_point"
    ],
    // Regional 4 (#1 USC)
    regional_4: [
        "usc", "uconn", "oklahoma", "kentucky", "kansas_state", "iowa", "oklahoma_state", "california",
        "mississippi_state", "south_dakota_state", "murray_state", "fairfield", "liberty", "fgcu", "arkansas_state", "unc_greensboro"
    ],
};

// Placeholder for 2026 Women's bracket data
export const womensBracketData26 = {
    regional_1: [],
    regional_2: [],
    regional_3: [],
    regional_4: [],
};

// Placeholder for 2026 bracket data - to be filled when tournament is announced
export const bracketData26 = {
    south: [],
    east: [],
    midwest: [],
    west: [],
};

export const bracketData = {
    2022: bracketData22,
    2023: bracketData23,
    2024: bracketData24,
    2025: bracketData25,
    2026: bracketData26,
};

// Women's bracket data (starting from 2025)
export const womensBracketData = {
    2025: womensBracketData25,
    2026: womensBracketData26,
};

export const regionOrder = {
    2022: ["west", "south", "midwest", "east"],
    2023: ["south", "midwest", "west", "east"],
    2024: ["east", "south", "midwest", "west"],
    2025: ["south", "east", "midwest", "west"],
    2026: ["south", "east", "midwest", "west"], // Update when bracket is announced
};

// Women's region order (uses numbered regions)
export const womensRegionOrder = {
    2025: ["regional_1", "regional_2", "regional_3", "regional_4"],
    2026: ["regional_1", "regional_2", "regional_3", "regional_4"], // Update when bracket is announced
};

export const firstFourMapping = {
    2022: {
        "notre_dame_or_rutgers": "notre_dame",
        "indiana_or_wyoming": "indiana",
        "wright_state_or_bryant": "wright_state",
        "texas_southern_or_texas_a&m_cc": "texas_southern",
    },
    2023: {
        "texas_a&m_cc_or_southeast_missouri_state": "texas_a&m_cc",
        "texas_southern_or_fdu": "fdu",
        "mississippi_state_or_pittsburgh": "pittsburgh",
        "arizona_state_or_nevada": "arizona_state",
    },
    2024: {},
    2025: {
        "san_diego_state_or_north_carolina": "north_carolina",
        "alabama_state_or_saint_francis_u": "alabama_state",
        "american_or_mount_saint_marys": "mount_saint_marys",
        "texas_or_xavier": "xavier",
    },
    2026: {},
};

export const cutOffTimes = {
    2022: new Date(Date.UTC(2022, 2, 17, 16, 15)),
    2023: new Date(Date.UTC(2023, 2, 16, 16, 15)),
    2024: new Date(Date.UTC(2024, 2, 21, 16, 15)),
    2025: new Date(Date.UTC(2025, 2, 20, 16, 15)),
    2026: new Date(Date.UTC(2026, 2, 20, 16, 15)), // To Do - Check game time when announced
};

// Women's First Four Mapping (play-in game winners)
export const womensFirstFourMapping = {
    2025: {
        "uc_san_diego_or_southern": "southern",
        "columbia_or_washington": "columbia",
        "iowa_state_or_princeton": "iowa_state",
        "william_mary_or_high_point": "william_mary",
    },
    2026: {},
};

// Women's tournament cutoff times
export const womensCutOffTimes = {
    2025: new Date(Date.UTC(2025, 2, 21, 18, 0)), // Women's First Four starts March 19
    2026: new Date(Date.UTC(2026, 2, 20, 18, 0)), // To Do - Check game time when announced
};
