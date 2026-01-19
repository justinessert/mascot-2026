export interface TournamentConfig {
    year: number;
    gender: 'men' | 'women';
    regions: Record<string, string[]> | null;
    regionOrder: string[] | null;
    firstFourMapping: Record<string, string> | null;
    cutoffTime: string;
    selectionSundayTime: string;
}

export interface TournamentsData {
    men: Record<string, TournamentConfig>;
    women: Record<string, TournamentConfig>;
}

export type NicknamesData = Record<string, string>;
export type SpecialNcaaNamesData = Record<string, string>;

export interface School {
    slug: string;
    name: string;
    long: string;
}

export type SchoolsData = School[];

export interface TeamAuditData {
    teamKey: string;
    mappedNcaaName: string;
    hasNickname: boolean;
    hasImage: boolean;
    isValidNcaaName: boolean;
    isComplete: boolean;
    years: string[];
    genders: string[];
}
