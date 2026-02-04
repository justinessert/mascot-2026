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
    getDocs,
    deleteDoc,
    collection,
    query,
    where,
    updateDoc,
    arrayUnion,
    arrayRemove,
    DocumentReference,
    DocumentData,
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from './firebase';
import { mensTournaments, womensTournaments } from '../constants/bracketData';
import { nicknames } from '../constants/nicknames';
import type { TeamData, RegionData, Gender, TournamentConfig } from '../types/bracket';

// Helper to get tournament config
function getTournamentConfig(year: number, gender: Gender): TournamentConfig | undefined {
    const tournaments = gender === 'men' ? mensTournaments : womensTournaments;
    return tournaments[year];
}

// In-memory storage for bracket state (cleared on refresh, persisted on navigation)
// Key format: `${gender}_${year}`
const tempBracketStorage: Record<string, unknown> = {};

export interface TemporaryBracketData {
    regions: Record<string, RegionData | null>;
    bracketName: string;
    currentRegionName: string;
    currentMatchup: (TeamData | null)[];
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
function mapName(teamName: string, year: number, mapping?: Record<string, string> | null, gender: Gender = 'men'): string {
    if (mapping) {
        return mapping[teamName] || teamName;
    }
    // Fallback to tournament config if no mapping provided
    const config = getTournamentConfig(year, gender);
    return config?.firstFourMapping?.[teamName] || teamName;
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
    firstFourMappingForYear: Record<string, string> | null,
    gender: Gender = 'men'
): Record<string, Region> {
    const regions: Record<string, Region> = {};

    // Use provided data or fallback from tournament config
    const fallbackConfig = getTournamentConfig(year, gender);
    const dataToUse = bracketDataForYear || fallbackConfig?.regions;
    const orderToUse = regionOrderForYear || fallbackConfig?.regionOrder;

    if (!dataToUse || !orderToUse) {
        // Return empty if no data available
        return regions;
    }

    for (const regionName of orderToUse) {
        regions[regionName] = new Region(regionName);
        regions[regionName].initializeBracket(
            dataToUse[regionName].map(
                (name: string, index: number) => new Team(mapName(name, year, firstFourMappingForYear, gender), index + 1)
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
        ownerUid: user.uid,
    });
}

interface LoadedBracket {
    regions: Record<string, Region>;
    name: string;
    published: boolean;
    contributors?: string[];
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
            contributors: data.contributors || [],
        };
    }

    return null;
}

interface LoadedBracketByUserId {
    regions: Record<string, Region>;
    name: string;
    userName: string;
    contributors?: string[];
    contributorUids?: string[];
    ownerUid?: string;
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
            contributors: data.contributors || [],
            contributorUids: data.contributorUids || [],
            ownerUid: data.ownerUid || userId,
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
        ownerUid: user.uid,
        contributors: [],
        contributorUids: [],
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
 * Includes own brackets and shared brackets where user is a contributor
 */
export async function getUserBracketHistory(user: User | null, gender: Gender = 'men'): Promise<BracketHistoryEntry[]> {
    if (!user) return [];

    const tournaments = gender === 'men' ? mensTournaments : womensTournaments;
    const years = Object.keys(tournaments).sort((a, b) => +b - +a); // Descending years
    const history: BracketHistoryEntry[] = [];

    for (const year of years) {
        // 1. Try to load user's own saved bracket
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

        // 3. Also load shared brackets where user is a contributor
        const sharedBrackets = await getSharedBrackets(user, +year, gender);

        for (const shared of sharedBrackets) {
            // Fetch score from the shared bracket's leaderboard entry
            let sharedScore: number = 0;
            try {
                const leaderboardRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${shared.ownerUid}`);
                const entryDoc = await getDoc(leaderboardRef);
                if (entryDoc.exists()) {
                    sharedScore = entryDoc.data().score || 0;
                }
            } catch (err) {
                console.error(`Error fetching shared bracket score for ${year}:`, err);
            }

            history.push({
                year: parseInt(year),
                bracketId: shared.ownerUid, // Use owner's UID for navigation
                bracketName: `${shared.bracketName} (shared with ${shared.ownerName})`,
                published: true, // Shared brackets are always published
                score: sharedScore,
                champion: null, // Could load if needed
                timestamp: undefined
            });
        }
    }

    return history;
}

/**
 * User lookup result
 */
export interface UserLookupResult {
    uid: string;
    displayName: string;
}

/**
 * Look up a user by their display name in the users collection
 * Returns null if user not found
 */
/**
 * Look up a user by their display name in the users collection
 * Returns null if user not found
 * 
 * Strategy:
 * 1. Try normalized search (ignores case, spaces, symbols) - works for updated users
 * 2. Try exact/lowercase match - legacy fallbacks
 * 3. Try permutation search - finding legacy users with separators in names
 */
export async function lookupUserByDisplayName(displayName: string): Promise<UserLookupResult | null> {
    const usersRef = collection(db, 'users');
    const normalizedInput = displayName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // 1. Primary Method: Normalized Match (fastest & most accurate for updated users)
    // Matches "John-Doe", "john doe", "John_Doe" -> "johndoe"
    const qNorm = query(usersRef, where('normalizedDisplayName', '==', normalizedInput));
    const snapNorm = await getDocs(qNorm);

    if (!snapNorm.empty) {
        const userDoc = snapNorm.docs[0];
        return {
            uid: userDoc.id,
            displayName: userDoc.data().displayName
        };
    }

    // 2. Legacy Method: Normalized Input vs Legacy Lowercase Field
    // If input is "jol-ly", normalized is "jolly".
    // Try to find a legacy user with displayNameLower == "jolly" (e.g. "Jolly" or "jolly")
    // This allows finding simple names even if the user types separators.
    if (normalizedInput.length > 0) {
        const qLegacyNorm = query(usersRef, where('displayNameLower', '==', normalizedInput));
        const snapLegacyNorm = await getDocs(qLegacyNorm);

        if (!snapLegacyNorm.empty) {
            return { uid: snapLegacyNorm.docs[0].id, displayName: snapLegacyNorm.docs[0].data().displayName };
        }
    }

    // 3. Secondary Method: Lowercase Match (for users who have logged in but maybe normalization is weird)
    const qLower = query(usersRef, where('displayNameLower', '==', displayName.toLowerCase()));
    const snapLower = await getDocs(qLower);

    if (!snapLower.empty) {
        const userDoc = snapLower.docs[0];
        return {
            uid: userDoc.id,
            displayName: userDoc.data().displayName
        };
    }

    // 4. Legacy Method: Exact Match
    const qExact = query(usersRef, where('displayName', '==', displayName));
    const snapExact = await getDocs(qExact);
    if (!snapExact.empty) {
        return { uid: snapExact.docs[0].id, displayName: snapExact.docs[0].data().displayName };
    }

    // 5. Deep Legacy Search: Permutations
    // If we couldn't find them by normalized name, they haven't logged in recently.
    // We try to reconstruct their potential legacy display name by swapping separators.

    // Split by any common separator (space, dash, underscore)
    // Note: split() can return empty strings if separators are adjacent, filter them out
    const parts = displayName.split(/[\s\-_]+/).filter(p => p.length > 0);

    if (parts.length > 1) {
        // Generate variations
        const separators = ['', ' ', '-', '_']; // Added '' to join without separators (e.g. "jol-ly" -> "jolly")
        const variations = new Set<string>();

        // 5a. Lowercase variations (Target: displayNameLower)
        // e.g. "Mary-Jane" -> "maryjane", "mary jane", "mary-jane", "mary_jane"
        separators.forEach(sep => variations.add(parts.join(sep).toLowerCase()));

        // Execute queries for lowercase variations (most likely to succeed for legacy users)
        const variationList = Array.from(variations).slice(0, 10);
        const queries = variationList.map(variant => getDocs(query(usersRef, where('displayNameLower', '==', variant))));

        const results = await Promise.all(queries);
        const match = results.find(snap => !snap.empty);

        if (match) {
            return { uid: match.docs[0].id, displayName: match.docs[0].data().displayName };
        }

        // 5b. Title/Original Case variations (Target: displayName) - Deepest Fallback
        // Only needed if they have NO displayNameLower field (very old records)
        const titleVariations = new Set<string>();

        // Title Case parts: "Mary", "Jane"
        const titleParts = parts.map(p => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase());

        separators.forEach(sep => {
            titleVariations.add(titleParts.join(sep)); // "MaryJane", "Mary Jane"...
            titleVariations.add(parts.join(sep));      // Original casing re-joined
        });

        const deepQueries = Array.from(titleVariations).slice(0, 10).map(variant => {
            return getDocs(query(usersRef, where('displayName', '==', variant)));
        });

        const deepResults = await Promise.all(deepQueries);
        const deepMatch = deepResults.find(snap => !snap.empty);

        if (deepMatch) {
            return { uid: deepMatch.docs[0].id, displayName: deepMatch.docs[0].data().displayName };
        }

    } else {
        // Single word name fallback - try Title Case
        // e.g. input "john" -> try "John"
        if (displayName.toLowerCase() !== displayName) {
            // Input has caps, but exact match failed. Try all lowercase?
            const qLc = query(usersRef, where('displayName', '==', displayName.toLowerCase()));
            const snapLc = await getDocs(qLc);
            if (!snapLc.empty) return { uid: snapLc.docs[0].id, displayName: snapLc.docs[0].data().displayName };
        }

        // Input is lowercase, try Title Case
        const titleCase = displayName.charAt(0).toUpperCase() + displayName.slice(1).toLowerCase();
        const qTitle = query(usersRef, where('displayName', '==', titleCase));
        const snapTitle = await getDocs(qTitle);
        if (!snapTitle.empty) return { uid: snapTitle.docs[0].id, displayName: snapTitle.docs[0].data().displayName };
    }

    return null;
}

/**
 * Add contributor result
 */
export interface AddContributorResult {
    success: boolean;
    error?: string;
    addedDisplayName?: string;
}

/**
 * Add a contributor to a published bracket
 * Validates:
 * - Contributor exists
 * - Contributor is not already an owner/contributor
 * - Contributor hasn't published their own bracket for this tournament
 */
export async function addContributor(
    ownerUser: User,
    contributorDisplayName: string,
    year: number,
    gender: Gender = 'men'
): Promise<AddContributorResult> {
    // 1. Look up the contributor by display name
    const contributor = await lookupUserByDisplayName(contributorDisplayName);
    if (!contributor) {
        return { success: false, error: 'User not found. Please check the username and try again.' };
    }

    // 2. Check if contributor is the same as owner
    if (contributor.uid === ownerUser.uid) {
        return { success: false, error: 'You cannot add yourself as a contributor.' };
    }

    // 3. Load the bracket to check existing contributors
    const bracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${ownerUser.uid}`);
    const bracketSnapshot = await getDoc(bracketRef);

    if (!bracketSnapshot.exists()) {
        return { success: false, error: 'Bracket not found.' };
    }

    const bracketData = bracketSnapshot.data();
    const existingContributorUids = bracketData.contributorUids || [];

    // 4. Check if contributor is already added
    if (existingContributorUids.includes(contributor.uid)) {
        return { success: false, error: `${contributor.displayName} is already a contributor to this bracket.` };
    }

    // 5. Check if contributor has already published their own bracket for this tournament
    const contributorLeaderboardRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${contributor.uid}`);
    const contributorLeaderboardSnapshot = await getDoc(contributorLeaderboardRef);

    if (contributorLeaderboardSnapshot.exists()) {
        return { success: false, error: `${contributor.displayName} has already published their own bracket for this tournament.` };
    }

    // 6. Add contributor to bracket document
    await updateDoc(bracketRef, {
        contributors: arrayUnion(contributor.displayName),
        contributorUids: arrayUnion(contributor.uid)
    });

    // 7. Add contributor to leaderboard entry
    const leaderboardRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${ownerUser.uid}`);
    await updateDoc(leaderboardRef, {
        contributors: arrayUnion(contributor.displayName),
        contributorUids: arrayUnion(contributor.uid)
    });

    return { success: true, addedDisplayName: contributor.displayName };
}

/**
 * Check if the current user is a secondary owner (contributor) of a bracket
 * Returns true if user is in contributorUids but is not the primary owner
 */
export async function isSecondaryOwner(
    user: User | null,
    bracketOwnerUid: string,
    year: number,
    gender: Gender = 'men'
): Promise<boolean> {
    if (!user) return false;

    // If user is the primary owner, they're not a secondary owner
    if (user.uid === bracketOwnerUid) return false;

    // Load the bracket to check contributorUids
    const bracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${bracketOwnerUid}`);
    const snapshot = await getDoc(bracketRef);

    if (!snapshot.exists()) return false;

    const data = snapshot.data();
    const contributorUids = data.contributorUids || [];

    return contributorUids.includes(user.uid);
}

/**
 * Get brackets where user is a contributor (not the primary owner)
 * Used to populate user history with shared brackets
 */
export async function getSharedBrackets(
    user: User | null,
    year: number,
    gender: Gender = 'men'
): Promise<{ ownerUid: string; bracketName: string; ownerName: string }[]> {
    if (!user) return [];

    // Query leaderboard entries where user is in contributorUids
    const leaderboardRef = collection(db, `leaderboard/${gender}/years/${year}/entries`);
    const q = query(leaderboardRef, where('contributorUids', 'array-contains', user.uid));
    const snapshot = await getDocs(q);

    const sharedBrackets: { ownerUid: string; bracketName: string; ownerName: string }[] = [];

    snapshot.forEach(doc => {
        const data = doc.data();
        sharedBrackets.push({
            ownerUid: doc.id,
            bracketName: data.bracketName,
            ownerName: data.userName
        });
    });

    return sharedBrackets;
}

/**
 * Leave a bracket that the user is a contributor on
 * Removes the user from contributors and contributorUids arrays
 */
export async function leaveBracket(
    user: User,
    ownerUid: string,
    year: number,
    gender: Gender = 'men'
): Promise<{ success: boolean; error?: string }> {
    if (!user) {
        return { success: false, error: 'You must be logged in to leave a bracket.' };
    }

    // Can't leave your own bracket
    if (user.uid === ownerUid) {
        return { success: false, error: 'You cannot leave your own bracket.' };
    }

    try {
        // 1. Load the bracket to get current contributors and verify user is a contributor
        const bracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${ownerUid}`);
        const bracketSnapshot = await getDoc(bracketRef);

        if (!bracketSnapshot.exists()) {
            return { success: false, error: 'Bracket not found.' };
        }

        const bracketData = bracketSnapshot.data();
        const contributorUids = bracketData.contributorUids || [];

        if (!contributorUids.includes(user.uid)) {
            return { success: false, error: 'You are not a contributor to this bracket.' };
        }

        // 2. Remove from bracket document
        await updateDoc(bracketRef, {
            contributors: arrayRemove(user.displayName),
            contributorUids: arrayRemove(user.uid)
        });

        // 3. Remove from leaderboard entry
        const leaderboardRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${ownerUid}`);
        await updateDoc(leaderboardRef, {
            contributors: arrayRemove(user.displayName),
            contributorUids: arrayRemove(user.uid)
        });

        return { success: true };
    } catch (error) {
        console.error('Error leaving bracket:', error);
        return { success: false, error: 'Failed to leave bracket. Please try again.' };
    }
}

/**
 * Delete a bracket and its associated leaderboard entry
 * Only the owner can delete their bracket
 */
export async function deleteBracket(
    user: User,
    year: number,
    gender: Gender = 'men'
): Promise<{ success: boolean; error?: string }> {
    if (!user) {
        return { success: false, error: 'You must be logged in to delete a bracket.' };
    }

    try {
        // 1. Load the bracket to verify ownership
        const bracketRef: DocumentReference = doc(db, `brackets/${gender}/years/${year}/users/${user.uid}`);
        const bracketSnapshot = await getDoc(bracketRef);

        if (!bracketSnapshot.exists()) {
            return { success: false, error: 'Bracket not found.' };
        }

        const bracketData = bracketSnapshot.data();
        const ownerUid = bracketData.ownerUid || user.uid; // Fallback for older brackets

        // Verify ownership
        if (ownerUid !== user.uid) {
            return { success: false, error: 'You can only delete brackets that you own.' };
        }

        // 2. Delete the bracket document
        await deleteDoc(bracketRef);

        // 3. Delete the leaderboard entry if it exists
        const leaderboardRef: DocumentReference = doc(db, `leaderboard/${gender}/years/${year}/entries/${user.uid}`);
        const leaderboardSnapshot = await getDoc(leaderboardRef);

        if (leaderboardSnapshot.exists()) {
            await deleteDoc(leaderboardRef);
        }

        return { success: true };
    } catch (error) {
        console.error('Error deleting bracket:', error);
        return { success: false, error: 'Failed to delete bracket. Please try again.' };
    }
}
