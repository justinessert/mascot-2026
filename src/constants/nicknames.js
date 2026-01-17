/**
 * Team nicknames/mascots mapping
 * Migrated from Angular mascot-2025 project
 */

export const nicknames = {
    "akron": "zips",
    "alabama": "crimson tide",
    "alabama_state": "hornets",
    "american": "eagles",
    "appalachian_state": "mountaineers",
    "arizona_state": "sun devils",
    "arizona": "wildcats",
    "arkansas": "razorbacks",
    "auburn": "tigers",
    "baylor": "bears",
    "boise_state": "broncos",
    "bryant": "bulldogs",
    "butler": "bulldogs",
    "byu": "cougars",
    "central_connecticut_state": "blue devils",
    "charleston": "cougars",
    "chattanooga": "mocs",
    "cincinnati": "bearcats",
    "clemson": "tigers",
    "cleveland_state": "vikings",
    "colgate": "raiders",
    "colorado": "buffaloes",
    "colorado_state": "rams",
    "cornell": "big red",
    "creighton": "bluejays",
    "csu_fullerton": "titans",
    "davidson": "wildcats",
    "dayton": "flyers",
    "delaware": "blue hens",
    "drake": "bulldogs",
    "duke": "blue devils",
    "duquesne": "dukes",
    "eastern_kentucky": "colonels",
    "east_washington": "eagles",
    "fdu": "knights",
    "florida": "gators",
    "florida_atlantic": "owls",
    "furman": "paladins",
    "georgia": "bulldogs",
    "georgia_state": "panthers",
    "gonzaga": "bulldogs",
    "grambling_state": "tigers",
    "grand_canyon": "antelopes",
    "green_bay": "phoenix",
    "high_point": "purple panthers",
    "houston": "cougars",
    "howard": "bison",
    "illinois": "fighting illini",
    "indiana": "hoosiers",
    "indiana_state": "sycamores",
    "iona": "gaels",
    "iowa_state": "cardinals",
    "iowa": "hawks",
    "jacksonville_state": "gamecocks",
    "james_madison": "dukes",
    "kansas_state": "wildcats",
    "kansas": "jayhawks",
    "kennesaw_state": "owls",
    "kent_state": "golden flashes",
    "kentucky": "wildcats",
    "liberty": "flames",
    "lipscomb": "bisons",
    "little_rock": "trojans",
    "long_beach_state": "the beach",
    "longwood": "lancers",
    "louisiana": "ragin cajuns",
    "louisiana_tech": "bulldogs",
    "louisville": "cardinals",
    "loyola_chicago": "ramblers",
    "lsu": "tigers",
    "marquette": "golden eagles",
    "maryland": "terrapins",
    "mcneese": "cowboys",
    "memphis": "tigers",
    "merrimack": "warriors",
    "miami": "hurricanes",
    "michigan_state": "spartans",
    "michigan": "wolverines",
    "mississippi_state": "bulldogs",
    "missouri": "mizzou",
    "montana": "grizzlies",
    "montana_state": "fighting bobcats",
    "mount_saint_marys": "mountaineers",
    "morehead_state": "eagles",
    "murray_state": "racers",
    "nc_central": "eagles",
    "nc_state": "wolfpack",
    "nebraska": "cornhuskers",
    "new_mexico": "lobos",
    "new_mexico_state": "aggies",
    "new_orleans": "privateers",
    "norfolk_state": "spartans",
    "north_carolina": "tar heels",
    "north_dakota": "fighting hawks",
    "north_texas": "mean green",
    "northern_iowa": "panthers",
    "northern_kentucky": "norse",
    "northwestern": "wildcats",
    "notre_dame": "fighting irish",
    "oakland": "golden grizzlies",
    "ohio_state": "buckeyes",
    "oklahoma": "sooners",
    "ole_miss": "rebels",
    "omaha": "mavericks",
    "oral_roberts": "golden eagles",
    "oregon": "ducks",
    "penn_state": "nittany lions",
    "pittsburgh": "panthers",
    "providence": "friars",
    "purdue": "boilmakers",
    "quinnipiac": "bobcats",
    "richmond": "spiders",
    "robert_morris": "colonials",
    "rutgers": "scarlet knights",
    "saint_francis_u": "red flash",
    "saint_johns": "red storm",
    "saint_marys": "gaels",
    "saint_peters": "peacocks",
    "sam_houston": "bearkats",
    "samford": "bulldogs",
    "san_diego_state": "aztecs",
    "san_francisco": "dons",
    "seton_hall": "pirates",
    "siu_edwardsville": "cougars",
    "south_carolina": "gamecocks",
    "south_dakota_state": "jackrabbits",
    "south_florida": "bulls",
    "southeast_missouri_state": "redhawks",
    "stetson": "hatters",
    "tcu": "horned frogs",
    "tennessee": "volunteers",
    "texas_a&m_cc": "islanders",
    "texas_a&m": "aggies",
    "texas_southern": "tigers",
    "texas_state": "bobcats",
    "texas_tech": "red raiders",
    "texas": "longhorns",
    "toledo": "rockets",
    "troy": "trojans",
    "uab": "blazers",
    "ucla": "bruins",
    "uconn": "huskies",
    "ucsb": "bison",
    "uc_irvine": "anteaters",
    "uc_san_diego": "tritons",
    "unc_asheville": "bulldogs",
    "unc_wilmington": "seahawks",
    "usc": "trojans",
    "utah": "utes",
    "utah_state": "aggies",
    "vanderbilt": "commodores",
    "vcu": "rams",
    "vermont": "catamounts",
    "villanova": "wildcats",
    "virginia_tech": "hokies",
    "virginia": "cavaliers",
    "wagner": "seahawks",
    "wake_forest": "demon deacons",
    "washington_state": "cougars",
    "west_virginia": "mountaineers",
    "western_kentucky": "hilltoppers",
    "wisconsin": "badgers",
    "wofford": "terriers",
    "wright_state": "raiders",
    "wyoming": "cowboys",
    "xavier": "musketeers",
    "yale": "bulldogs",
    "nevada": "wolf pack",
    "princeton": "tigers"
};

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
