#!/usr/bin/env node
/**
 * Generates game mappings JSON from the NCAA brackets API.
 *
 * Usage:
 *   node scripts/generate_mappings.mjs <sport> <year>
 *
 * Examples:
 *   node scripts/generate_mappings.mjs basketball-men 2026
 *   node scripts/generate_mappings.mjs basketball-women 2026
 *
 * Output:
 *   Writes to functions/data/mappings_<year>_<gender>.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_BASE = 'https://ncaa-api.henrygd.me';

// --- Parse CLI args ---
const sport = process.argv[2];
const year = process.argv[3];

if (!sport || !year) {
    console.error('Usage: node scripts/generate_mappings.mjs <sport> <year>');
    console.error('  e.g. node scripts/generate_mappings.mjs basketball-men 2026');
    process.exit(1);
}

const gender = sport.includes('women') ? 'women' : 'men';

// --- Fetch bracket data ---
async function fetchBracket(sport, year) {
    const url = `${API_BASE}/brackets/${sport}/d1/${year}`;
    console.log(`Fetching bracket from: ${url}`);
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch bracket: ${response.status} ${response.statusText}`);
    }
    return response.json();
}

// --- Build mappings from bracket data ---
function buildMappings(bracketData) {
    const championship = bracketData.championships[0];
    const { games, regions } = championship;

    // Build sectionId -> region name map from the API regions array
    // e.g. { 2: "east", 3: "west", 4: "south", 5: "midwest" }
    const sectionToRegion = {};
    for (const region of regions) {
        const name = region.title.trim().toLowerCase();
        if (name && region.sectionId !== 1) { // skip First Four section (no named region)
            sectionToRegion[region.sectionId] = name;
        }
    }

    console.log('\nRegion mapping (sectionId -> name):');
    for (const [id, name] of Object.entries(sectionToRegion)) {
        console.log(`  sectionId ${id} -> ${name}`);
    }

    // Group games by region and round.
    // bracketId encodes the round in its first digit:
    //   1xx = First Four  -> skip (not in mappings)
    //   2xx = First Round  -> round_1
    //   3xx = Second Round -> round_2
    //   4xx = Sweet 16     -> round_3
    //   5xx = Elite Eight  -> round_4
    //   6xx = Final Four   -> final_four.round_1
    //   7xx = Championship -> final_four.round_2
    const regionGames = {};

    for (const game of games) {
        const bracketId = game.bracketId;
        const sectionId = game.sectionId;
        const contestId = String(game.contestId);
        const roundDigit = Math.floor(bracketId / 100);

        // Skip First Four games (round digit 1 / sectionId 1)
        if (roundDigit === 1) continue;

        let regionName;
        let roundName;

        if (roundDigit === 6) {
            regionName = 'final_four';
            roundName = 'round_1';
        } else if (roundDigit === 7) {
            regionName = 'final_four';
            roundName = 'round_2';
        } else {
            regionName = sectionToRegion[sectionId];
            if (!regionName) {
                console.warn(`  ⚠️  Unknown sectionId ${sectionId} for bracketId ${bracketId}, skipping`);
                continue;
            }
            // 2xx -> round_1, 3xx -> round_2, 4xx -> round_3, 5xx -> round_4
            roundName = `round_${roundDigit - 1}`;
        }

        if (!regionGames[regionName]) regionGames[regionName] = {};
        if (!regionGames[regionName][roundName]) regionGames[regionName][roundName] = [];

        regionGames[regionName][roundName].push({ contestId, bracketId });
    }

    // Sort games within each round by bracketId (gives standard bracket order)
    for (const rounds of Object.values(regionGames)) {
        for (const gameList of Object.values(rounds)) {
            gameList.sort((a, b) => a.bracketId - b.bracketId);
        }
    }

    // Build final output, ordering regions by sectionId
    const newMappings = {};

    const orderedRegions = Object.entries(sectionToRegion)
        .filter(([id]) => Number(id) !== 6) // exclude Final Four section from regional list
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([, name]) => name);

    for (const regionName of orderedRegions) {
        if (!regionGames[regionName]) continue;
        newMappings[regionName] = {};
        for (const roundName of Object.keys(regionGames[regionName]).sort()) {
            newMappings[regionName][roundName] = regionGames[regionName][roundName].map(g => g.contestId);
        }
    }

    // Append final_four
    if (regionGames['final_four']) {
        newMappings['final_four'] = {};
        for (const roundName of Object.keys(regionGames['final_four']).sort()) {
            newMappings['final_four'][roundName] = regionGames['final_four'][roundName].map(g => g.contestId);
        }
    }

    return {
        year: Number(year),
        gender,
        newMappings,
    };
}

// --- Main ---
async function main() {
    try {
        const bracketData = await fetchBracket(sport, year);
        const mappings = buildMappings(bracketData);

        // Print summary
        console.log('\n--- Mapping Summary ---');
        for (const [region, rounds] of Object.entries(mappings.newMappings)) {
            const counts = Object.entries(rounds).map(([r, ids]) => `${r}: ${ids.length} games`).join(', ');
            console.log(`  ${region}: ${counts}`);
        }

        // Write file
        const outputPath = path.join(__dirname, `../functions/data/mappings_${year}_${gender}.json`);
        fs.writeFileSync(outputPath, JSON.stringify(mappings, null, 4) + '\n');
        console.log(`\n✅ Mappings written to: ${outputPath}`);
    } catch (err) {
        console.error('❌ Error:', err.message);
        process.exit(1);
    }
}

main();
