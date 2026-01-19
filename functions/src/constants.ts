export const GENDERS = ['men', 'women'] as const;
export type Gender = typeof GENDERS[number];

export const specialNcaaNames: Record<string, string> = {
  "central_connecticut_state": "central-conn-st",
  "charleston": "col-of-charleston",
  "csu_fullerton": "cal-st-fullerton",
  "eastern_kentucky": "eastern-ky",
  "east_washington": "eastern-wash",
  "florida_atlantic": "fla-atlantic",
  "grambling_state": "grambling",
  "little_rock": "ualr",
  "louisiana": "la-lafayette",
  "mcneese": "mcneese-st",
  "miami": "miami-fl",
  "mount_saint_marys": "mt-st-mary-ny",
  "nc_state": "north-carolina-st",
  "northern_iowa": "uni",
  "northern_kentucky": "northern-ky",
  "omaha": "neb-omaha",
  "saint_francis_u": "st-francis-pa",
  "saint_johns": "st-johns-ny",
  "saint_marys": "st-marys-ca",
  "saint_peters": "st-peters",
  "sam_houston": "sam-houston-st",
  "south_florida": "south-fla",
  "southeast_missouri_state": "southeast-mo-st",
  "texas_a&m_cc": "am-corpus-chris",
  "texas_a&m": "texas-am",
  "ucsb": "uc-santa-barbara",
  "usc": "southern-california",
  "western_kentucky": "western-ky",
};

export const firstFourMapping: Record<string, Record<string, string>> = {
  "2024": {},
  "2025": {
    "san_diego_state_or_north_carolina": "north_carolina",
    "alabama_state_or_saint_francis_u": "alabama_state",
    "american_or_mount_saint_marys": "mount_saint_marys",
    "texas_or_xavier": "xavier",
  }
}


export const roundOrders: Record<number, number[]> = {
  1: [0, 6, 4, 2, 3, 5, 7, 1],
  2: [0, 3, 2, 1],
  3: [0, 1],
  4: [0],
}