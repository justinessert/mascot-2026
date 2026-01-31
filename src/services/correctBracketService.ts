/**
 * Correct Bracket Service
 * 
 * Fetches the canonical "correct" bracket data from Firebase
 * for displaying correct/incorrect indicators on bracket views.
 */

import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Gender } from '../types/bracket';

/**
 * A single game's correct answer with scores
 */
export interface CorrectGame {
    winner: string;          // NCAA SEO name of the winner
    loser: string;           // NCAA SEO name of the loser
    team1: string;           // Actual team in slot 0 (top)
    team2: string;           // Actual team in slot 1 (bottom)
    winnerScore: number | null;
    loserScore: number | null;
    gameId: string;
}

/**
 * Full correct bracket structure
 * Mirrors the user bracket structure for easy comparison
 */
export interface CorrectBracket {
    regions: Record<string, Record<string, CorrectGame[]>>; // region -> round_X -> games[]
    lastUpdated: Date;
}

/**
 * Load the correct bracket for a given year and gender
 * Returns null if no correct bracket exists yet (games haven't been played)
 */
export async function loadCorrectBracket(
    year: number,
    gender: Gender
): Promise<CorrectBracket | null> {
    try {
        const correctBracketRef = doc(db, `correctBracket/${gender}/years/${year}`);
        const snapshot = await getDoc(correctBracketRef);

        if (snapshot.exists()) {
            const data = snapshot.data();
            console.log('=== CORRECT BRACKET DATA ===');
            console.log('Year:', year, 'Gender:', gender);
            console.log('Full data:', JSON.stringify(data, null, 2));

            // Log each region's round_1 games for debugging
            if (data.regions) {
                for (const [regionName, regionData] of Object.entries(data.regions)) {
                    console.log(`\n--- ${regionName.toUpperCase()} Region ---`);
                    const typedRegionData = regionData as Record<string, any[]>;
                    if (typedRegionData.round_1) {
                        typedRegionData.round_1.forEach((game: any, idx: number) => {
                            console.log(`  Game ${idx}: winner="${game.winner}", gameId="${game.gameId}"`);
                        });
                    }
                }
            }

            return {
                regions: data.regions || {},
                lastUpdated: data.lastUpdated?.toDate?.() || new Date()
            };
        }

        return null;
    } catch (error) {
        console.error('Error loading correct bracket:', error);
        return null;
    }
}
