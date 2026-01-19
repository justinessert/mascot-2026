/**
 * Bracket Data and Constants for Mascot Madness
 * 
 * Loads tournament configurations from shared-data/tournaments.json
 * and converts date strings to Date objects.
 */

import type { TournamentConfig, Gender } from '../types/bracket';
import tournamentsJson from '../../shared-data/tournaments.json';

// Type for the raw JSON data (dates are strings)
interface RawTournamentConfig {
    year: number;
    gender: string;
    regions: Record<string, string[]> | null;
    regionOrder: string[] | null;
    firstFourMapping: Record<string, string> | null;
    cutoffTime: string;
    selectionSundayTime: string;
}

interface RawTournamentsData {
    men: Record<string, RawTournamentConfig>;
    women: Record<string, RawTournamentConfig>;
}

// Convert raw JSON config to properly typed TournamentConfig with Date objects
function convertTournamentConfig(raw: RawTournamentConfig): TournamentConfig {
    return {
        year: raw.year,
        gender: raw.gender as Gender,
        regions: raw.regions,
        regionOrder: raw.regionOrder,
        firstFourMapping: raw.firstFourMapping,
        cutoffTime: new Date(raw.cutoffTime),
        selectionSundayTime: new Date(raw.selectionSundayTime),
    };
}

// Convert the raw JSON data to typed tournament maps
function loadTournaments(rawData: RawTournamentsData): {
    men: Record<number, TournamentConfig>;
    women: Record<number, TournamentConfig>;
} {
    const men: Record<number, TournamentConfig> = {};
    const women: Record<number, TournamentConfig> = {};

    for (const [yearStr, config] of Object.entries(rawData.men)) {
        men[parseInt(yearStr, 10)] = convertTournamentConfig(config);
    }

    for (const [yearStr, config] of Object.entries(rawData.women)) {
        women[parseInt(yearStr, 10)] = convertTournamentConfig(config);
    }

    return { men, women };
}

// Load and convert tournament data
const { men: mensTournaments, women: womensTournaments } = loadTournaments(tournamentsJson as RawTournamentsData);

// =============================================================================
// EXPORTS
// =============================================================================

export { mensTournaments, womensTournaments };

export const currentYear: number = new Date().getFullYear();

export const tournaments: Record<Gender, Record<number, TournamentConfig>> = {
    men: mensTournaments,
    women: womensTournaments,
};
