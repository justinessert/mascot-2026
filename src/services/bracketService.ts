/**
 * Bracket Service
 * Handles loading, saving, and publishing brackets to Firebase
 * 
 * Ported from Angular mascot-2025 bracket.service.ts
 */

import {
    doc,
    setDoc,
    getDoc,
    DocumentReference,
    DocumentData,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import {
    bracketData,
    currentYear,
    firstFourMapping,
    regionOrder
} from '../constants';
import { nicknames } from '../constants/nicknames';
import type { TeamData, RegionData, Gender } from '../types/bracket';

// In-memory storage for bracket state (cleared on refresh, persisted on navigation)
// Key format: `${gender}_${year}`
const tempBracketStorage: Record<string, unknown> = {};

interface TemporaryBracketData {
    regions: Record<string, RegionData>;
    bracketName: string;
    currentRegionName: string;
    currentMatchup: TeamData[];
}

export function saveTemporaryBracket(year: number, data: TemporaryBracketData | null, gender: Gender = 'men'): void {
    const key = `${gender}_${year}`;
    tempBracketStorage[key] = data;
}

export function loadTemporaryBracket(year: number, gender: Gender = 'men'): TemporaryBracketData | null {
    const key = `${gender}_${year}`;
    return (tempBracketStorage[key] as TemporaryBracketData) || null;
}

/**
 * Map team name through First Four if applicable
 */
function mapName(teamName: string, year: number, mapping?: Record<string, string> | null): string {
    if (mapping) {
        return mapping[teamName] || teamName;
    }
    return firstFourMapping[year]?.[teamName] || teamName;
}

/**
 * Team class representing a single team
 */
export class Team {
    name: string;
    seed: number;
    image: string;
    nickname: string;
    displayName: string;
    shortDisplayName: string;

    constructor(name: string, seed: number) {
        this.name = name;
        this.seed = seed;
        this.image = `/assets/teams/${name}.jpg`;
        this.nickname = nicknames[name] || '';
        this.displayName = `${this.name} ${this.nickname}`;
        this.shortDisplayName = this.name;
    }

    static fromDict(data: TeamData | null, year: number): Team | null {
        if (!data) return null;
        return new Team(mapName(data.name, year), data.seed);
    }

    toDict(): TeamData {
        return {
            name: this.name,
            seed: this.seed,
        };
    }
}

/**
 * Region class representing a tournament region bracket
 */
export class Region {
    name: string;
    bracket: (Team | null)[][];
    currentMatchupIndex: number;
    roundIndex: number;
    champion: Team | null;
    nPicks: number;
    totalPicks: number;

    constructor(name: string) {
        this.name = name;
        this.bracket = [];
        this.currentMatchupIndex = 0;
        this.roundIndex = 0;
        this.champion = null;
        this.nPicks = 0;
        this.totalPicks = name === 'final_four' ? 3 : 15;
    }

    static fromDict(data: RegionData, year: number): Region {
        const region = new Region(data.name);

        Object.keys(data.bracket).forEach(round => {
            region.bracket[+round] = data.bracket[+round].map(
                (team: TeamData | null) => team ? Team.fromDict(team, year) : null
            );
        });

        region.currentMatchupIndex = data.currentMatchupIndex;
        region.roundIndex = data.roundIndex;
        region.champion = data.champion ? Team.fromDict(data.champion, year) : null;
        region.nPicks = data.nPicks;
        region.totalPicks = data.totalPicks;
        return region;
    }

    toDict(): RegionData {
        const bracketDict: Record<number, (TeamData | null)[]> = {};
        Object.keys(this.bracket).forEach(round => {
            bracketDict[+round] = this.bracket[+round].map(team => team ? team.toDict() : null);
        });

        return {
            name: this.name,
            bracket: bracketDict,
            currentMatchupIndex: this.currentMatchupIndex,
            roundIndex: this.roundIndex,
            champion: this.champion ? this.champion.toDict() : null,
            nPicks: this.nPicks,
            totalPicks: this.totalPicks,
        };
    }

    initializeBracket(teams: (Team | null)[]): void {
        // Correct first-round matchup ordering
        const matchupOrder = teams.length === 16
            ? [0, 7, 3, 4, 2, 5, 1, 6]  // Standard Regions
            : [0, 1];                    // Final Four

        this.bracket[0] = [];
        for (const i of matchupOrder) {
            this.bracket[0].push(teams[i]);
            this.bracket[0].push(teams[teams.length - 1 - i]);
        }

        for (let i = 1; i <= Math.log2(teams.length); i++) {
            this.bracket[i] = new Array(teams.length / Math.pow(2, i)).fill(null);
        }
    }

    startNewRound(): void {
        this.currentMatchupIndex = 0;
    }

    advanceRound(): void {
        this.roundIndex++;
        if (this.roundIndex < this.bracket.length - 1) {
            this.startNewRound();
        } else {
            this.champion = this.bracket[this.roundIndex][0];
        }
    }

    handleWinnerSelection(winner: Team): void {
        this.nPicks++;
        const nextRoundIndex = this.roundIndex + 1;
        const position = Math.floor(this.currentMatchupIndex / 2);
        this.bracket[nextRoundIndex][position] = winner;

        if (this.currentMatchupIndex + 2 < this.bracket[this.roundIndex].length) {
            this.currentMatchupIndex += 2;
        } else {
            this.advanceRound();
        }
    }

    /**
     * Get the current matchup (two teams to choose between)
     */
    getCurrentMatchup(): [Team, Team] | null {
        if (this.champion) return null;
        if (!this.bracket[this.roundIndex]) return null;

        const team1 = this.bracket[this.roundIndex][this.currentMatchupIndex];
        const team2 = this.bracket[this.roundIndex][this.currentMatchupIndex + 1];

        if (!team1 || !team2) return null;
        return [team1, team2];
    }

    /**
     * Get the region champion (null if not yet determined)
     */
    getChampion(): Team | null {
        return this.champion;
    }

    /**
     * Get progress as [completed, total]
     */
    getProgress(): [number, number] {
        return [this.nPicks, this.totalPicks];
    }

    /**
     * Alias for handleWinnerSelection
     */
    selectWinner(winner: Team): void {
        this.handleWinnerSelection(winner);
    }

    addTeam(team: Team, idx: number): void {
        // Convert seed to bracket position (only used for final four)
        const mapping: Record<number, number> = {
            0: 0,
            1: 2,
            2: 3,
            3: 1
        };
        const position = mapping[idx];
        if (position !== undefined && this.bracket[0]) {
            this.bracket[0][position] = team;
        }
    }

    /**
     * Clear a specific team from the first round (used for final four)
     */
    clearSlot(idx: number): void {
        const mapping: Record<number, number> = {
            0: 0,
            1: 2,
            2: 3,
            3: 1
        };
        const position = mapping[idx];
        if (position !== undefined && this.bracket[0]) {
            this.bracket[0][position] = null;
            // When we clear a slot, we need to reset the progress too
            this.reset();
        }
    }

    /**
     * Reset the region to its initial state
     */
    reset(): void {
        // Keep the first round (bracket[0]), but clear all subsequent rounds
        for (let i = 1; i < this.bracket.length; i++) {
            this.bracket[i].fill(null);
        }
        this.currentMatchupIndex = 0;
        this.roundIndex = 0;
        this.champion = null;
        this.nPicks = 0;
    }
}

/**
 * Load regions from dictionary format
 */
export function loadRegions(bracketDataObj: Record<string, RegionData>, year: number): Record<string, Region> {
    return Object.fromEntries(
        Object.entries(bracketDataObj).map(
            ([key, region]) => [key, Region.fromDict(region, year)]
        )
    );
}

/**
 * Initialize a fresh bracket for a given year
 */
export function initializeBracket(
    year: number,
    bracketDataForYear: Record<string, string[]> | null,
    regionOrderForYear: string[] | null,
    firstFourMappingForYear: Record<string, string> | null
): Record<string, Region> {
    const regions: Record<string, Region> = {};

    // Use provided data or fallback to men's default
    const dataToUse = bracketDataForYear || bracketData[year];
    const orderToUse = regionOrderForYear || regionOrder[year];

    if (!dataToUse || !orderToUse) {
        // Return empty if no data available
        return regions;
    }

    for (const regionName of orderToUse) {
        regions[regionName] = new Region(regionName);
        regions[regionName].initializeBracket(
            dataToUse[regionName].map(
                (name, index) => new Team(mapName(name, year, firstFourMappingForYear), index + 1)
            )
        );
    }

    regions.final_four = new Region('final_four');
    regions.final_four.initializeBracket([null, null, null, null]);

    return regions;
}

/**
 * Save bracket to Firebase
 */
export async function saveBracket(
    user: User,
    year: number,
    regions: Record<string, Region>,
    name: string,
    published: boolean = false,
    gender: Gender = 'men'
): Promise<void> {
    if (!user) {
        throw new Error('User not authenticated');
    }

    const userBracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${user.uid}`);

    const regionsDict: Record<string, RegionData | null> = Object.fromEntries(
        Object.entries(regions).map(([key, region]) => [key, region ? region.toDict() : null])
    );

    await setDoc(userBracketRef, {
        bracket: regionsDict,
        timestamp: new Date(),
        name: name,
        user: user.displayName,
        published: published,
    });
}

interface LoadedBracket {
    regions: Record<string, Region>;
    name: string;
    published: boolean;
}

/**
 * Load bracket from Firebase
 */
export async function loadBracket(user: User | null, year: number, gender: Gender = 'men'): Promise<LoadedBracket | null> {
    if (!user) {
        return null;
    }

    const userBracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${user.uid}`);
    const snapshot = await getDoc(userBracketRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        return {
            regions: loadRegions(data.bracket, year),
            name: data.name,
            published: data.published,
        };
    }

    return null;
}

interface LoadedBracketByUserId {
    regions: Record<string, Region>;
    name: string;
    userName: string;
}

/**
 * Load bracket by user ID (for viewing shared brackets)
 */
export async function loadBracketByUserId(userId: string, year: number, gender: Gender = 'men'): Promise<LoadedBracketByUserId | null> {
    const bracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${userId}`);
    const snapshot = await getDoc(bracketRef);

    if (snapshot.exists()) {
        const data = snapshot.data();
        return {
            regions: loadRegions(data.bracket, year),
            name: data.name,
            userName: data.user,
        };
    }

    return null;
}

/**
 * Publish bracket to leaderboard
 * Uses user.uid as document ID to enforce one entry per user per year
 */
export async function publishBracket(
    user: User,
    year: number,
    regions: Record<string, Region>,
    name: string,
    champion: Team | null,
    gender: Gender = 'men',
    isUpdate: boolean = false
): Promise<void> {
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Use doc() with user.uid as the document ID (enforces one entry per user per year)
    const leaderboardEntryRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${user.uid}`);

    const data: DocumentData = {
        bracketId: user.uid,
        bracketName: name,
        userName: user.displayName || 'Anonymous',
        timestamp: new Date(),
        champion: champion ? champion.toDict() : null,
    };

    if (isUpdate) {
        // Update existing entry without touching the score
        await setDoc(leaderboardEntryRef, data, { merge: true });
    } else {
        // Create new entry with initial score
        data.score = 0;
        await setDoc(leaderboardEntryRef, data);
    }

    // Mark as published in saved bracket (the saveBracket service handles the 'published' flag)
    await saveBracket(user, year, regions, name, true, gender);
}

export interface BracketHistoryEntry {
    year: number;
    bracketId: string;
    bracketName: string;
    published: boolean;
    score: number | '-';
    champion: Team | null;
    timestamp?: Date;
}

/**
 * Get user's bracket history across all years
 */
export async function getUserBracketHistory(user: User | null, gender: Gender = 'men'): Promise<BracketHistoryEntry[]> {
    if (!user) return [];

    const years = Object.keys(bracketData).sort((a, b) => +b - +a); // Descending years
    const history: BracketHistoryEntry[] = [];

    for (const year of years) {
        // 1. Try to load saved bracket
        const savedBracket = await loadBracket(user, +year, gender);

        if (savedBracket) {
            let score: number = 0;

            // 2. If published, try to get score from leaderboard (direct fetch by userId)
            if (savedBracket.published) {
                try {
                    // Doc ID is userId, so we can fetch directly
                    const leaderboardEntryRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${user.uid}`);
                    const entryDoc = await getDoc(leaderboardEntryRef);

                    if (entryDoc.exists()) {
                        const data = entryDoc.data();
                        score = data.score || 0;
                    }
                } catch (err) {
                    console.error(`Error fetching leaderboard for ${year}:`, err);
                }
            }

            // Determine if valid bracket (has regions)
            const champion = savedBracket.regions.final_four?.getChampion();

            history.push({
                year: parseInt(year),
                bracketId: user.uid, // User's bracket ID is their UID
                bracketName: savedBracket.name || 'Untitled Bracket',
                published: savedBracket.published,
                score: savedBracket.published ? score : '-',
                champion: champion,
                timestamp: undefined // Could add if we stored it
            });
        }
    }

    return history;
}
