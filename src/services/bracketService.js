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
    addDoc,
    collection
} from 'firebase/firestore';
import { db } from './firebase';
import {
    bracketData,
    currentYear,
    firstFourMapping,
    nicknames,
    regionOrder
} from '../constants';

/**
 * Map team name through First Four if applicable
 */
function mapName(teamName, year) {
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

    /**
     * Add a team to the bracket (used for Final Four)
     */
    addTeam(team) {
        // Find first empty slot in first round
        for (let i = 0; i < this.bracket[0].length; i++) {
            if (!this.bracket[0][i]) {
                this.bracket[0][i] = team;
                return;
            }
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
 */
export function initializeBracket(year) {
    const regions = {};

    for (let regionName of regionOrder[year]) {
        regions[regionName] = new Region(regionName);
        regions[regionName].initializeBracket(
            bracketData[year][regionName].map(
                (name, index) => new Team(mapName(name, year), index + 1)
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
export async function saveBracket(user, year, regions, name, published = false) {
    if (!user) {
        throw new Error('User not authenticated');
    }

    const userBracketRef = doc(db, `brackets/${year}/${user.uid}/data`);

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
 */
export async function loadBracket(user, year) {
    if (!user) {
        return null;
    }

    const userBracketRef = doc(db, `brackets/${year}/${user.uid}/data`);
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
 */
export async function loadBracketByUserId(userId, year) {
    const bracketRef = doc(db, `brackets/${year}/${userId}/data`);
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
 */
export async function publishBracket(user, year, regions, name, champion) {
    if (!user) {
        throw new Error('User not authenticated');
    }

    const leaderboardRef = collection(db, `leaderboard/${year}/data`);

    await addDoc(leaderboardRef, {
        bracketId: user.uid,
        bracketName: name,
        userName: user.displayName || 'Anonymous',
        score: 0,
        timestamp: new Date(),
        champion: champion ? champion.toDict() : null,
    });

    // Mark as published in saved bracket
    await saveBracket(user, year, regions, name, true);
}
