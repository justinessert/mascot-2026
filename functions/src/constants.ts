export const GENDERS = ['men', 'women'] as const;
export type Gender = typeof GENDERS[number];

import specialNcaaNamesRaw from '../data/specialNcaaNames.json';
export const specialNcaaNames: Record<string, string> = specialNcaaNamesRaw;

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