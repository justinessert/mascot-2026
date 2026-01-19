import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataPath = path.join(__dirname, '../functions/data/games_raw_output.json');

const ROUND_ORDER = {
    "First Four": 1,
    "First Round": 2,
    "Second Round": 3,
    "Sweet 16": 4,
    "Elite Eight": 5,
    "Final Four": 6,
    "National Championship": 7
};

try {
    const rawData = fs.readFileSync(dataPath, 'utf8');
    const data = JSON.parse(rawData);

    if (!data.games || !Array.isArray(data.games)) {
        console.error('Error: "games" array not found in JSON.');
        process.exit(1);
    }

    const processedGames = data.games.map(entry => {
        const game = entry.game;
        const home = game.home;
        const away = game.away;

        const homeSeed = parseInt(home.seed) || 99;
        const awaySeed = parseInt(away.seed) || 99;

        let team1, team2;

        // Determine smaller seed (team1)
        if (homeSeed < awaySeed) {
            team1 = home;
            team2 = away;
        } else if (awaySeed < homeSeed) {
            team1 = away;
            team2 = home;
        } else {
            // If seeds are equal or missing, just use order in json or some other tiebreaker?
            // Treating first one as team1 for consistency if equal.
            team1 = home;
            team2 = away;
        }

        return {
            gameID: game.gameID,
            bracketRound: game.bracketRound,
            bracketRegion: game.bracketRegion,
            team1,
            team2,
            minSeed: Math.min(homeSeed, awaySeed)
        };
    });

    // Sort
    processedGames.sort((a, b) => {
        // 1. Sort by Bracket Round
        const roundA = ROUND_ORDER[a.bracketRound] || 99;
        const roundB = ROUND_ORDER[b.bracketRound] || 99;
        if (roundA !== roundB) return roundA - roundB;

        // 2. Sort by Bracket Region
        if (a.bracketRegion < b.bracketRegion) return -1;
        if (a.bracketRegion > b.bracketRegion) return 1;

        // 3. Sort by Seed (Min of the two teams)
        return a.minSeed - b.minSeed;
    });

    // Print
    processedGames.forEach(g => {
        console.log(`${g.bracketRound} - ${g.bracketRegion} - ${g.gameID}: ${g.team1.seed} ${g.team1.names.seo} vs ${g.team2.seed} ${g.team2.names.seo}`);
    });

} catch (err) {
    console.error('Error reading or parsing file:', err);
}
