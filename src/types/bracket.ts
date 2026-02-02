/**
 * Bracket and Tournament Type Definitions
 */

// Gender type for tournament selection
export type Gender = 'men' | 'women';
export type GenderCode = 'M' | 'W';

/**
 * Tournament Configuration - all data for a single tournament
 * This is the new unified structure for bracket data
 */
export interface TournamentConfig {
    year: number;
    gender: Gender;
    /** Regions with teams (null if tournament data not yet available) */
    regions: Record<string, string[]> | null;
    /** Order of regions for bracket display (null if not yet set) */
    regionOrder: string[] | null;
    /** First Four play-in game winners (null if not applicable) */
    firstFourMapping: Record<string, string> | null;
    /** Tournament start time (when saves are locked) */
    cutoffTime: Date;
    /** Selection Sunday announcement time */
    selectionSundayTime: Date;
}

/**
 * Team data as stored/serialized
 */
export interface TeamData {
    name: string;
    seed: number;
}

/**
 * Region data as stored/serialized
 */
export interface RegionData {
    name: string;
    bracket: Record<number, (TeamData | null)[]>;
    currentMatchupIndex: number;
    roundIndex: number;
    champion: TeamData | null;
    nPicks: number;
    totalPicks: number;
}

/**
 * Saved bracket structure from Firebase
 */
export interface SavedBracket {
    bracket: Record<string, RegionData>;
    timestamp: Date;
    name: string;
    user: string;
    published: boolean;
    /** UID of the primary owner */
    ownerUid?: string;
    /** Display names of additional contributors */
    contributors?: string[];
    /** UIDs of additional contributors (for permission checking) */
    contributorUids?: string[];
}

/**
 * Loaded bracket with hydrated Region objects
 */
export interface LoadedBracket {
    regions: Record<string, import('../services/bracketService').Region>;
    name: string;
    published: boolean;
}

/**
 * Leaderboard entry
 */
export interface LeaderboardEntry {
    id: string;
    bracketId: string;
    bracketName: string;
    userName: string;
    score: number;
    maxScore: number | null;
    champion: import('../services/bracketService').Team | null;
    rank?: number;
}

/**
 * User bracket history entry
 */
export interface BracketHistoryEntry {
    year: number;
    bracketId: string;
    bracketName: string;
    published: boolean;
    score: number | '-';
    champion: import('../services/bracketService').Team | null;
    timestamp?: Date;
}

/**
 * Tournament context value type
 */
export interface TournamentContextValue {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedGender: GenderCode;
    setSelectedGender: (gender: GenderCode) => void;
    availableYears: number[];
    getDisplayLabel: () => string;
    getBracketData: () => Record<string, string[]> | null;
    getRegionOrder: () => string[] | null;
    getFirstFourMapping: () => Record<string, string> | null;
    getCutoffTime: () => Date | undefined;
    hasBracketData: () => boolean;
    getSelectionSundayTime: () => Date | undefined;
}

/**
 * Nicknames dictionary type
 */
export type NicknamesDictionary = Record<string, string>;
