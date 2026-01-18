/**
 * Firestore Migration Script: Gender-Aware Paths
 * 
 * This script migrates existing (Men's) tournament data to a new path structure
 * that supports both Men's and Women's tournaments.
 * 
 * ============================================================================
 * DATA STRUCTURE: BEFORE (Old)
 * ============================================================================
 * 
 * brackets/{year}/{userId}/data                    (4 components - document)
 *   └── Contains: bracket picks, name, timestamp, published status
 * 
 * leaderboard/{year}/data/{entryId}                (4 components - document)
 *   └── Contains: bracketId, bracketName, userName, score, champion
 * 
 * gameMappings/{year}                              (2 components - document)
 *   └── Contains: region → round → gameId mappings for scoring
 * 
 * ncaaGames/{gameId}                               (2 components - document)
 *   └── Contains: homeTeam, awayTeam, scores, winner, loser, status
 * 
 * ============================================================================
 * DATA STRUCTURE: AFTER (New - Gender-Aware)
 * ============================================================================
 * 
 * brackets/men/years/{year}/users/{userId}         (6 components - document)
 * brackets/women/years/{year}/users/{userId}       (6 components - document)
 *   └── Same content as before
 * 
 * leaderboard/men/years/{year}/entries/{entryId}   (6 components - document)
 * leaderboard/women/years/{year}/entries/{entryId} (6 components - document)
 *   └── Same content as before
 * 
 * gameMappings/men/years/{year}                    (4 components - document)
 * gameMappings/women/years/{year}                  (4 components - document)
 *   └── Same content as before
 * 
 * ncaaGames/men/games/{gameId}                     (4 components - document)
 * ncaaGames/women/games/{gameId}                   (4 components - document)
 *   └── Same content as before
 * 
 * ============================================================================
 * NOTES
 * ============================================================================
 * - All document paths must have an EVEN number of components (Firestore rule)
 * - This is a COPY operation - original data is preserved for rollback safety
 * - This script only migrates to /men/ paths; /women/ paths start empty
 * 
 * Usage:
 *   cd mascot-2026
 *   node scripts/migrate-to-gendered-paths.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// Initialize Firebase Admin with default credentials
const serviceAccountPath = join(homedir(), 'Downloads/mascot-bracket-firebase-adminsdk-fbsvc-c3cdf1f07f.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

const YEARS_TO_MIGRATE = [2022, 2023, 2024, 2025, 2026];
const DRY_RUN = false; // Set to true to preview changes without writing

async function migrateBrackets() {
    console.log('=== Migrating Brackets ===');
    console.log(`Dry run: ${DRY_RUN}`);
    console.log('');
    console.log('Path: brackets/{year}/{userId}/data → brackets/men/years/{year}/users/{userId}');
    console.log('');

    let totalCopied = 0;

    for (const year of YEARS_TO_MIGRATE) {
        console.log(`Processing year ${year}...`);

        try {
            // Old structure: brackets/{year} may be a "virtual" document with only subcollections
            // In Firestore, subcollections can exist even if the parent doc has no data
            const yearDocRef = db.doc(`brackets/${year}`);

            // List all subcollections (each is named by userId) - don't check if doc exists
            const subcollections = await yearDocRef.listCollections();

            if (subcollections.length === 0) {
                console.log(`  No user brackets for ${year}`);
                continue;
            }

            console.log(`  Found ${subcollections.length} user(s) with brackets`);

            for (const userCollection of subcollections) {
                const userId = userCollection.id;

                // Get the data document from the user's subcollection
                const dataDoc = await db.doc(`brackets/${year}/${userId}/data`).get();

                if (!dataDoc.exists) {
                    console.log(`    User ${userId}: No data document`);
                    continue;
                }

                const data = dataDoc.data();
                console.log(`    User ${userId}: Copying bracket "${data.name || 'Untitled'}"`);

                if (!DRY_RUN) {
                    // New path: brackets/men/years/{year}/users/{userId} (6 components = document)
                    const newPath = `brackets/men/years/${year}/users/${userId}`;
                    await db.doc(newPath).set(data);
                    totalCopied++;
                }
            }
        } catch (error) {
            console.error(`  Error processing year ${year}:`, error.message);
            console.error(error.stack);
        }
    }

    console.log(`  Total brackets copied: ${totalCopied}`);
}

async function migrateLeaderboard() {
    console.log('');
    console.log('=== Migrating Leaderboard ===');
    console.log('Path: leaderboard/{year}/data/{entryId} → leaderboard/men/years/{year}/entries/{entryId}');
    console.log('');

    let totalCopied = 0;

    for (const year of YEARS_TO_MIGRATE) {
        console.log(`Processing year ${year}...`);

        try {
            // Old structure: leaderboard/{year}/data is a collection
            const oldCollectionPath = `leaderboard/${year}/data`;
            const entriesSnapshot = await db.collection(oldCollectionPath).get();

            if (entriesSnapshot.empty) {
                console.log(`  No leaderboard entries for ${year}`);
                continue;
            }

            console.log(`  Found ${entriesSnapshot.size} leaderboard entries`);

            for (const entryDoc of entriesSnapshot.docs) {
                const entryId = entryDoc.id;
                const data = entryDoc.data();

                console.log(`    Copying entry: ${data.bracketName || entryId}`);

                if (!DRY_RUN) {
                    // New path: leaderboard/men/years/{year}/entries/{entryId}
                    // Use bracketId (userId) as document ID if available, to match new "one entry per user" pattern
                    const targetId = data.bracketId || entryId;
                    const newPath = `leaderboard/men/years/${year}/entries/${targetId}`;
                    await db.doc(newPath).set(data);
                    totalCopied++;
                }
            }
        } catch (error) {
            console.error(`  Error processing leaderboard ${year}:`, error.message);
            console.error(error.stack);
        }
    }

    console.log(`  Total leaderboard entries copied: ${totalCopied}`);
}

async function migrateGameMappings() {
    console.log('');
    console.log('=== Migrating Game Mappings ===');
    console.log('Path: gameMappings/{year} → gameMappings/men/years/{year}');
    console.log('');

    let totalCopied = 0;

    for (const year of YEARS_TO_MIGRATE) {
        console.log(`Processing year ${year}...`);

        try {
            // Old structure: gameMappings/{year} is a document (2 components)
            const mappingDoc = await db.doc(`gameMappings/${year}`).get();

            if (!mappingDoc.exists) {
                console.log(`  No game mappings for ${year}`);
                continue;
            }

            const data = mappingDoc.data();
            console.log(`    Copying game mappings (${Object.keys(data).length} regions)`);

            if (!DRY_RUN) {
                // New path: gameMappings/men/years/{year} (4 components = document)
                const newPath = `gameMappings/men/years/${year}`;
                await db.doc(newPath).set(data);
                totalCopied++;
            }
        } catch (error) {
            console.error(`  Error processing gameMappings ${year}:`, error.message);
            console.error(error.stack);
        }
    }

    console.log(`  Total game mappings copied: ${totalCopied}`);
}

async function migrateNcaaGames() {
    console.log('');
    console.log('=== Migrating NCAA Games ===');
    console.log('Path: ncaaGames/{gameId} → ncaaGames/men/games/{gameId}');
    console.log('');

    let totalCopied = 0;

    try {
        const gamesSnapshot = await db.collection('ncaaGames').get();

        if (gamesSnapshot.empty) {
            console.log('  No NCAA games found');
            return;
        }

        console.log(`  Found ${gamesSnapshot.size} NCAA games`);

        for (const gameDoc of gamesSnapshot.docs) {
            const gameId = gameDoc.id;
            const data = gameDoc.data();

            if (!DRY_RUN) {
                // New path: ncaaGames/men/games/{gameId} (4 components = document)
                const newPath = `ncaaGames/men/games/${gameId}`;
                await db.doc(newPath).set(data);
                totalCopied++;

                // Log every 50 games to avoid spam
                if (totalCopied % 50 === 0) {
                    console.log(`    Copied ${totalCopied} games...`);
                }
            }
        }

        console.log(`  Total NCAA games copied: ${totalCopied}`);
    } catch (error) {
        console.error(`  Error processing ncaaGames:`, error.message);
        console.error(error.stack);
    }
}

async function main() {
    console.log('========================================');
    console.log('Firestore Migration: Gender-Aware Paths');
    console.log('========================================');
    console.log('');

    if (DRY_RUN) {
        console.log('*** DRY RUN MODE - No changes will be made ***');
        console.log('Set DRY_RUN = false to perform actual migration');
        console.log('');
    } else {
        console.log('*** LIVE MODE - Changes will be written to Firestore ***');
        console.log('');
    }

    await migrateBrackets();
    await migrateLeaderboard();
    await migrateGameMappings();
    await migrateNcaaGames();

    console.log('');
    console.log('========================================');
    console.log('Migration complete!');
    if (DRY_RUN) {
        console.log('(Dry run - no changes were made)');
    }
    console.log('========================================');
}

main().catch(console.error);
