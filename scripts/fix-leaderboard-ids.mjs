/**
 * Firestore Utility Script: Fix Leaderboard IDs
 * 
 * This script iterates through all entries in `leaderboard/men/years/{year}/entries`
 * and ensures that the document ID matches the `bracketId` (which corresponds to the userId).
 * 
 * If an entry has a random document ID but contains a valid `bracketId` field:
 * 1. Creates a new document with ID = bracketId (userId)
 * 2. Deletes the old document with the random ID
 * 
 * Usage:
 *   node scripts/fix-leaderboard-ids.mjs
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';

// --- CONFIGURATION ---
const YEARS_TO_CHECK = [2022, 2023, 2024, 2025, 2026];
const DRY_RUN = false; // Set to true to preview changes without writing

// --- INITIALIZATION ---
const serviceAccountPath = join(homedir(), 'Downloads', 'mascot-bracket-firebase-adminsdk-fbsvc-c3cdf1f07f.json');

try {
    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    initializeApp({
        credential: cert(serviceAccount)
    });
} catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    console.error(`Make sure serviceAccountKey.json is at: ${serviceAccountPath}`);
    process.exit(1);
}

const db = getFirestore();

async function fixLeaderboardIds() {
    console.log('=== Fixing Leaderboard IDs ===');
    console.log(`Dry run: ${DRY_RUN}`);
    console.log('');
    console.log('Path: leaderboard/men/years/{year}/entries/{docId}');
    console.log('Goal: Rename {docId} to {userId} (bracketId) if they differ');
    console.log('');

    let totalFixed = 0;
    let totalSkipped = 0; // Already correct
    let totalErrors = 0; // Missing bracketId

    for (const year of YEARS_TO_CHECK) {
        console.log(`Checking year ${year}...`);

        try {
            const collectionPath = `leaderboard/men/years/${year}/entries`;
            const snapshot = await db.collection(collectionPath).get();

            if (snapshot.empty) {
                console.log(`  No entries for ${year}`);
                continue;
            }

            console.log(`  Found ${snapshot.size} entries. Verifying IDs...`);

            for (const doc of snapshot.docs) {
                const data = doc.data();
                const currentId = doc.id;
                const correctId = data.bracketId; // This corresponds to userId

                if (!correctId) {
                    console.warn(`  [WARN] Entry "${currentId}" is missing 'bracketId' field. Skipping.`);
                    totalErrors++;
                    continue;
                }

                if (currentId === correctId) {
                    // ID is already correct (userId)
                    totalSkipped++;
                    continue;
                }

                // ID mismatch: We have a random ID, but valid userId (bracketId)
                console.log(`  Fixing entry: ${data.userName || 'Anonymous'} (${data.bracketName})`);
                console.log(`    Current ID: ${currentId}`);
                console.log(`    Target ID:  ${correctId}`);

                if (!DRY_RUN) {
                    // Copy to new path with correct ID
                    const newRef = db.doc(`${collectionPath}/${correctId}`);
                    // Check if target already exists (duplicate?)
                    const targetDoc = await newRef.get();

                    if (targetDoc.exists) {
                        console.log(`    [NOTE] Target doc ${correctId} already exists. Overwriting/Merging.`);
                    }

                    // Write new doc
                    await newRef.set(data);

                    // Delete old doc
                    await db.doc(`${collectionPath}/${currentId}`).delete();
                    console.log(`    -> Migrated and old doc deleted.`);
                    totalFixed++;
                } else {
                    console.log(`    -> [DRY RUN] Would set new doc and delete old.`);
                    totalFixed++; // Count potential fixes
                }
            }
        } catch (error) {
            console.error(`  Error processing ${year}:`, error);
        }
    }

    console.log('');
    console.log('=== Summary ===');
    console.log(`Total entries fixed:   ${totalFixed}`);
    console.log(`Total entries verified:  ${totalSkipped}`);
    console.log(`Total errors (skipped):  ${totalErrors}`);
    console.log('Done!');
}

fixLeaderboardIds().catch(console.error);
