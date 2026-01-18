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
    // addDoc, collection, query, where - unused after migration to direct doc fetch
    Timestamp,
    getDocs
} from 'firebase/firestore';
import { db } from './firebase';
import {
    bracketData,
    currentYear,
    firstFourMapping,
    nicknames,
    regionOrder
} from '../constants';

// In-memory storage for bracket state (cleared on refresh, persisted on navigation)
// Key format: `${gender}_${year}`
const tempBracketStorage = {};

export function saveTemporaryBracket(year, data, gender = 'men') {
    const key = `${gender}_${year}`;
    tempBracketStorage[key] = data;
}

export function loadTemporaryBracket(year, gender = 'men') {
    const key = `${gender}_${year}`;
    return tempBracketStorage[key] || null;
}

/**
 * Map team name through First Four if applicable
 */
function mapName(teamName, year, mapping) {
    if (mapping) {
        return mapping[teamName] || teamName;
    }
    return firstFourMapping[year]?.[teamName] || teamName;
}

/**
 * Team class representing a single team
 */
export class Team {
    constructor(name, seed) {
        this.name = name;
        this.seed = seed;
        this.image = `/assets/teams/${name}.jpg`;
        this.nickname = nicknames[name] || '';
        this.displayName = `${this.name} ${this.nickname}`;
        this.shortDisplayName = this.name;
    }

    static fromDict(data, year) {
        if (!data) return null;
        return new Team(mapName(data.name, year), data.seed);
    }

    toDict() {
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
    constructor(name) {
        this.name = name;
        this.bracket = [];
        this.currentMatchupIndex = 0;
        this.roundIndex = 0;
        this.champion = null;
        this.nPicks = 0;
        this.totalPicks = name === 'final_four' ? 3 : 15;
    }

    static fromDict(data, year) {
        const region = new Region(data.name);

        Object.keys(data.bracket).forEach(round => {
            region.bracket[+round] = data.bracket[round].map(
                team => team ? Team.fromDict(team, year) : null
            );
        });

        region.currentMatchupIndex = data.currentMatchupIndex;
        region.roundIndex = data.roundIndex;
        region.champion = data.champion ? Team.fromDict(data.champion, year) : null;
        region.nPicks = data.nPicks;
        region.totalPicks = data.totalPicks;
        return region;
    }

    toDict() {
        return {
            name: this.name,
            bracket: Object.keys(this.bracket).reduce((acc, round) => {
                acc[round] = this.bracket[round].map(team => team ? team.toDict() : null);
                return acc;
            }, {}),
            currentMatchupIndex: this.currentMatchupIndex,
            roundIndex: this.roundIndex,
            champion: this.champion ? this.champion.toDict() : null,
            nPicks: this.nPicks,
            totalPicks: this.totalPicks,
        };
    }

    initializeBracket(teams) {
        // Correct first-round matchup ordering
        const matchupOrder = teams.length === 16
            ? [0, 7, 3, 4, 2, 5, 1, 6]  // Standard Regions
            : [0, 1];                    // Final Four

        this.bracket[0] = [];
        for (let i of matchupOrder) {
            this.bracket[0].push(teams[i]);
            this.bracket[0].push(teams[teams.length - 1 - i]);
        }

        for (let i = 1; i <= Math.log2(teams.length); i++) {
            this.bracket[i] = new Array(teams.length / Math.pow(2, i)).fill(null);
        }
    }

    startNewRound() {
        this.currentMatchupIndex = 0;
    }

    advanceRound() {
        this.roundIndex++;
        if (this.roundIndex < this.bracket.length - 1) {
            this.startNewRound();
        } else {
            this.champion = this.bracket[this.roundIndex][0];
        }
    }

    handleWinnerSelection(winner) {
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
    getCurrentMatchup() {
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
    getChampion() {
        return this.champion;
    }

    /**
     * Get progress as [completed, total]
     */
    getProgress() {
        return [this.nPicks, this.totalPicks];
    }

    /**
     * Alias for handleWinnerSelection
     */
    selectWinner(winner) {
        this.handleWinnerSelection(winner);
    }


    addTeam(team, idx) {
        // Convert seed to bracket position (only used for final four)
        const mapping = {
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
}

/**
 * Load regions from dictionary format
 */
export function loadRegions(bracketDataObj, year) {
    return Object.fromEntries(
        Object.entries(bracketDataObj).map(
            ([key, region]) => [key, Region.fromDict(region, year)]
        )
    );
}

/**
 * Initialize a fresh bracket for a given year
 * @param {number} year - Tournament year (used for First Four mapping)
 * @param {Object} bracketDataForYear - The bracket data object for the selected year/gender
 * @param {Array} regionOrderForYear - The region order array for the selected year/gender
 */
/**
 * Initialize a fresh bracket for a given year
 * @param {number} year - Tournament year (used for First Four mapping fallback)
 * @param {Object} bracketDataForYear - The bracket data object for the selected year/gender
 * @param {Array} regionOrderForYear - The region order array for the selected year/gender
 * @param {Object} firstFourMappingForYear - The first four mapping for the selected year/gender
 */
export function initializeBracket(year, bracketDataForYear, regionOrderForYear, firstFourMappingForYear) {
    const regions = {};

    // Use provided data or fallback to men's default
    const dataToUse = bracketDataForYear || bracketData[year];
    const orderToUse = regionOrderForYear || regionOrder[year];
    // Note: mapName handles the fallback if mapping is null, but we can also be explicit here
    // However, mapName looks at global firstFourMapping[year] if mapping is not passed.
    // If we pass a mapping (even empty object), it uses it.

    for (let regionName of orderToUse) {
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
 * @param {Object} user - Firebase user object
 * @param {number} year - Tournament year
 * @param {Object} regions - Region objects
 * @param {string} name - Bracket name
 * @param {boolean} published - Whether bracket is published
 * @param {string} gender - 'men' or 'women'
 */
export async function saveBracket(user, year, regions, name, published = false, gender = 'men') {
    if (!user) {
        throw new Error('User not authenticated');
    }

    const userBracketRef = doc(db, `brackets/${gender}/years/${year}/users/${user.uid}`);

    const regionsDict = Object.fromEntries(
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

/**
 * Load bracket from Firebase
 * @param {Object} user - Firebase user object
 * @param {number} year - Tournament year
 * @param {string} gender - 'men' or 'women'
 */
export async function loadBracket(user, year, gender = 'men') {
    if (!user) {
        return null;
    }

    const userBracketRef = doc(db, `brackets/${gender}/years/${year}/users/${user.uid}`);
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

/**
 * Load bracket by user ID (for viewing shared brackets)
 * @param {string} userId - User ID
 * @param {number} year - Tournament year
 * @param {string} gender - 'men' or 'women'
 */
export async function loadBracketByUserId(userId, year, gender = 'men') {
    const bracketRef = doc(db, `brackets/${gender}/years/${year}/users/${userId}`);
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
 * @param {Object} user - Firebase user object
 * @param {number} year - Tournament year
 * @param {Object} regions - Region objects
 * @param {string} name - Bracket name
 * @param {Object} champion - Champion team
 * @param {string} gender - 'men' or 'women'
 */
export async function publishBracket(user, year, regions, name, champion, gender = 'men') {
    if (!user) {
        throw new Error('User not authenticated');
    }

    // Use doc() with user.uid as the document ID (enforces one entry per user per year)
    const leaderboardEntryRef = doc(db, `leaderboard/${gender}/years/${year}/entries/${user.uid}`);

    await setDoc(leaderboardEntryRef, {
        bracketId: user.uid,
        bracketName: name,
        userName: user.displayName || 'Anonymous',
        score: 0,
        timestamp: new Date(),
        champion: champion ? champion.toDict() : null,
    });

    // Mark as published in saved bracket
    await saveBracket(user, year, regions, name, true, gender);
}

/**
 * Get user's bracket history across all years
 */
export async function getUserBracketHistory(user, gender = 'men') {
    if (!user) return [];

    const years = Object.keys(bracketData).sort((a, b) => b - a); // Descending years
    const history = [];

    for (const year of years) {
        // 1. Try to load saved bracket
        const savedBracket = await loadBracket(user, year, gender);

        if (savedBracket) {
            let score = 0;

            // 2. If published, try to get score from leaderboard (direct fetch by userId)
            if (savedBracket.published) {
                try {
                    // Doc ID is userId, so we can fetch directly
                    // Use gender in path
                    const leaderboardEntryRef = doc(db, `leaderboard/${gender}/years/${year}/entries/${user.uid}`);
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
                timestamp: savedBracket.timestamp
            });
        }
    }

    return history;
}
