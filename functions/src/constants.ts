export const GENDERS = ['men', 'women'] as const;
export type Gender = typeof GENDERS[number];

import specialNcaaNamesRaw from '../data/specialNcaaNames.json';
export const specialNcaaNames: Record<string, string> = specialNcaaNamesRaw;

export const firstFourMapping: Record<string, Record<string, Record<string, string>>> = {
  "2024": {
    "men": {},
    "women": {}
  },
  "2025": {
    "men": {
      "san_diego_state_or_north_carolina": "north_carolina",
      "alabama_state_or_saint_francis_u": "alabama_state",
      "american_or_mount_saint_marys": "mount_saint_marys",
      "texas_or_xavier": "xavier",
    },
    "women": {
      "uc_san_diego_or_southern": "southern",
      "columbia_or_washington": "columbia",
      "iowa_state_or_princeton": "iowa_state",
      "william_mary_or_high_point": "william_mary"
    }
  },
  "2026": {
    "men": {
      "lehigh_or_prairie_view": "prairie_view",
      "smu_or_miami_oh": "miami_oh",
      "howard_or_umbc": "howard",
      "nc_state_or_texas": "texas"
    },
    "women": {
      "richmond_or_nebraska": "nebraska",
      "missouri_state_or_sf_austin": "missouri_state"
    }
  }
}


export const roundOrders: Record<number, number[]> = {
  1: [0, 6, 4, 2, 3, 5, 7, 1],
  2: [0, 3, 2, 1],
  3: [0, 1],
  4: [0],
}