/**
 * Bracket data and constants for Mascot Madness
 * Migrated from Angular mascot-2025 project
 */

export const currentYear = new Date().getFullYear();

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

// Placeholder for 2026 bracket data - to be filled when tournament is announced
export const bracketData26 = {
  south: [],
  east: [],
  midwest: [],
  west: [],
};

export const bracketData = {
  2024: bracketData24,
  2025: bracketData25,
  2026: bracketData26,
};

export const regionOrder = {
  2024: ["east", "south", "midwest", "west"],
  2025: ["south", "east", "midwest", "west"],
  2026: ["south", "east", "midwest", "west"], // Update when bracket is announced
};

export const firstFourMapping = {
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
  2024: new Date(Date.UTC(2024, 2, 21, 16, 15)),
  2025: new Date(Date.UTC(2025, 2, 20, 16, 15)),
  2026: new Date(Date.UTC(2026, 2, 19, 16, 15)), // Placeholder - update when schedule announced
};
