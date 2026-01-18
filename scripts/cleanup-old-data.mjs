/**
 * LEGACY DATA CLEANUP SCRIPT
 * 
 * This script DELETES all "old" data in the root collections, preserving only the
 * new gendered structure.
 * 
 * logic:
 * For each collection: [brackets, leaderboard, gameMappings, ncaaGames]
 *   - List all documents
 *   - IF doc.id is NOT "men" AND doc.id is NOT "women":
 *      - DELETE document (recursive)
 * 
 * USE WITH EXTREME CAUTION. This action is irreversible.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

// Config
const DRY_RUN = false;

// Initialize Firebase Admin with default credentials
// Matches the user's manual configuration from other scripts
const serviceAccountPath = join(homedir(), 'Downloads/mascot-bracket-firebase-adminsdk-fbsvc-c3cdf1f07f.json');
const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Helper to delete a document and its subcollections recursively
async function deleteLegacyDoc(docRef) {
    const path = docRef.path;

    if (DRY_RUN) {
        console.log(`[DRY RUN] Would delete legacy document: ${path}`);
        return;
    }

    try {
        console.log(`Deleting legacy document: ${path}...`);
        await db.recursiveDelete(docRef);
        console.log(`✅ Deleted ${path}`);
    } catch (error) {
        console.error(`❌ Error deleting ${path}:`, error);
    }
}

async function cleanCollection(collectionName) {
    console.log(`\nScanning collection: ${collectionName}...`);
    const collectionRef = db.collection(collectionName);

    try {
        const snapshot = await collectionRef.listDocuments();

        if (snapshot.length === 0) {
            console.log(`   (empty collection)`);
            return;
        }

        const protectedDocs = new Set(['men', 'women']);
        let deletedCount = 0;
        let skippedCount = 0;

        for (const docRef of snapshot) {
            const docId = docRef.id;

            if (protectedDocs.has(docId)) {
                console.log(`   ⚠️ Keeping protected document: ${collectionName}/${docId}`);
                skippedCount++;
            } else {
                await deleteLegacyDoc(docRef);
                deletedCount++;
            }
        }

        console.log(`   Summary for ${collectionName}: Deleted ${deletedCount}, Kept ${skippedCount}`);

    } catch (error) {
        console.error(`❌ Error listing documents in ${collectionName}:`, error);
    }
}

async function main() {
    console.log(`
      =============================================
      CLEANING UP LEGACY DATA (${DRY_RUN ? 'DRY RUN' : 'LIVE MODE'})
      =============================================
      This script will DELETE all documents in the following collections
      EXCEPT for documents named 'men' or 'women':
      
      - brackets
      - leaderboard
      - gameMappings
      - ncaaGames
      =============================================
    `);

    if (!DRY_RUN) {
        console.log('Starting cleanup in 5 seconds... Press Ctrl+C to cancel.');
        await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const collectionsToClean = [
        'brackets',
        'leaderboard',
        'gameMappings',
        'ncaaGames'
    ];

    for (const colName of collectionsToClean) {
        await cleanCollection(colName);
    }

    console.log('\n✨ Cleanup complete.');
}

main().catch(console.error);
