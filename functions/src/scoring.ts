import { DateTime } from "luxon";
import { transformTeamName, reverseTransformTeamName } from "./utils";
import { roundOrders } from "./constants";
import { db } from "./firebase";

// 🎯 **Calculate Score for a Single Bracket**
function calculateBracketScore(
    bracket: any,
    gameMappings: any,
    ncaaGameResults: any,
    year: string,
    gender: "men" | "women"
): { score: number; maxScore: number } {
    let score = 0;
    let maxScore = 0;
    let losing_teams: string[] = [];

    for (const [region, rounds] of Object.entries(gameMappings).sort(([regionA], [regionB]) => {
        if (regionA === "final_four") return 1; // Move "final_four" to the end
        if (regionB === "final_four") return -1; // Move "final_four" to the end
        return 0; // Keep other regions in their original order
    })) {
        if (!bracket.bracketData.bracket[region]) {
            throw new Error(`Missing bracket data for region: ${region} in bracket ${bracket}`);
        }

        for (const [roundKey, gameIds] of Object.entries(rounds as Record<string, string[]>)) {
            let regionRoundScore = 0;
            let regionRoundMaxScore = 0;
            const roundNumber = parseInt(roundKey.split("_")[1]); // Extracts the round number
            let pointsPerWin = 10 * Math.pow(2, roundNumber - 1); // Doubles each round
            pointsPerWin = region === "final_four" ? pointsPerWin * 16 : pointsPerWin;
            const userRoundOrder = roundOrders[roundNumber];

            for (let i = 0; i < gameIds.length; i++) {
                const userGameIdx = region === "final_four" ? i : userRoundOrder[i]
                const userSelection = bracket.bracketData.bracket[region]["bracket"][roundNumber]?.[userGameIdx];
                const userSelectionTransform = transformTeamName(userSelection["name"], year, gender);

                const gameId = gameIds[i];
                if (!gameId || !ncaaGameResults[gameId]) {
                    // Check if userSelectionTransform is in losing_teams
                    if (!losing_teams.includes(userSelectionTransform)) {
                        // Add to regionRoundMaxScore
                        regionRoundMaxScore += pointsPerWin;
                    }
                    continue; // Skip if no game mapping or game data
                };

                const correctWinner = ncaaGameResults[gameId].winner;

                // Get Loser and add to list of losers
                const loser = ncaaGameResults[gameId].loser;
                losing_teams.push(loser);

                if (userSelectionTransform === correctWinner) {
                    regionRoundScore += pointsPerWin;
                    regionRoundMaxScore += pointsPerWin;
                }
            }
            score += regionRoundScore;
            maxScore += regionRoundMaxScore;
            console.log(`Score for ${bracket.bracketData.name} of region ${region} & round ${roundNumber}: ${regionRoundScore}, Max: ${regionRoundMaxScore}`);
        }
    }

    return { score, maxScore };
}

// 🎯 **Build Correct Bracket from NCAA Game Results**
interface CorrectGame {
    winner: string;
    loser: string;              // The losing team's NCAA name
    team1: string;              // Actual team in slot 0 (top)
    team2: string;              // Actual team in slot 1 (bottom)
    winnerScore: number | null;
    loserScore: number | null;
    gameId: string;
}

interface CorrectBracket {
    regions: Record<string, Record<string, CorrectGame[]>>;
    lastUpdated: Date;
}

function buildCorrectBracket(
    gameMappings: Record<string, Record<string, string[]>>,
    ncaaGameResults: Record<string, any>
): CorrectBracket {
    const correctBracket: CorrectBracket = {
        regions: {},
        lastUpdated: new Date()
    };

    // Sort regions so final_four is at the end (matching calculateBracketScore)
    for (const [region, rounds] of Object.entries(gameMappings).sort(([regionA], [regionB]) => {
        if (regionA === "final_four") return 1;
        if (regionB === "final_four") return -1;
        return 0;
    })) {
        correctBracket.regions[region] = {};

        for (const [roundKey, gameIds] of Object.entries(rounds)) {
            const roundNumber = parseInt(roundKey.split("_")[1]);
            const userRoundOrder = roundOrders[roundNumber];

            // Initialize array with correct size
            correctBracket.regions[region][roundKey] = [];

            for (let i = 0; i < gameIds.length; i++) {
                // For non-final_four regions, use roundOrders to determine the correct index
                // This matches the logic in calculateBracketScore
                const gameIdx = region === "final_four" ? i : userRoundOrder[i];
                const gameId = gameIds[i];

                if (!gameId || !ncaaGameResults[gameId]) {
                    // Game not yet played - push placeholder at the mapped index position
                    correctBracket.regions[region][roundKey][gameIdx] = {
                        winner: "",
                        loser: "",
                        team1: "",
                        team2: "",
                        winnerScore: null,
                        loserScore: null,
                        gameId: gameId || ""
                    };
                    continue;
                }

                const game = ncaaGameResults[gameId];
                const homeScore = parseInt(game.homeScore) || 0;
                const awayScore = parseInt(game.awayScore) || 0;
                const loser = game.winner === game.homeTeam ? game.awayTeam : game.homeTeam;

                correctBracket.regions[region][roundKey][gameIdx] = {
                    winner: reverseTransformTeamName(game.winner) || "",
                    loser: reverseTransformTeamName(loser) || "",
                    team1: reverseTransformTeamName(game.homeTeam) || "",  // Home team in slot 0
                    team2: reverseTransformTeamName(game.awayTeam) || "",  // Away team in slot 1
                    winnerScore: game.winner === game.homeTeam ? homeScore : awayScore,
                    loserScore: game.winner === game.homeTeam ? awayScore : homeScore,
                    gameId: gameId
                };
            }
        }
    }

    return correctBracket;
}

// 🎯 **Update Published Bracket Scores**
export async function updateScores(year: string | number | null = null, gender?: "men" | "women") {
    year = year || DateTime.now().year;

    const gendersToUpdate = gender ? [gender] : ["men", "women"] as const;

    for (const g of gendersToUpdate) {
        console.log(`📅 Updating ${g} bracket scores for year: ${year}`);

        // **Step 1: Get Game Mappings (required for correct bracket)**
        const gameMappingsRef = db.doc(`gameMappings/${g}/years/${year}`);
        const gameMappingsSnapshot = await gameMappingsRef.get();
        if (!gameMappingsSnapshot.exists) {
            console.error(`❌ No game mappings found for year ${year} (${g})`);
            continue;
        }
        const gameMappings = gameMappingsSnapshot.data() as Record<string, Record<string, string[]>>;
        console.log("📌 Game mappings retrieved:", gameMappings);

        // **Extract all game IDs into a single array**
        const gameIds: string[] = Object.values(gameMappings)
            .flatMap(region => Object.values(region))
            .flat()
            .filter(id => id !== null && id !== undefined);
        console.log("📌 Game ids to pull:", gameIds);

        // **Step 2: Get NCAA Game Results**
        const ncaaGamesRef = db.collection(`ncaaGames/${g}/games`);
        const ncaaGameResults: Record<string, any> = {};

        if (gameIds.length === 0) {
            console.warn("⚠ No game IDs found to query NCAA results.");
        } else {
            const chunkSize = 30; // Firestore has a limit of 30 items in 'in' queries
            const gameIdChunks = [];

            // Split gameIds into chunks of 30
            for (let i = 0; i < gameIds.length; i += chunkSize) {
                gameIdChunks.push(gameIds.slice(i, i + chunkSize));
            }

            console.log(`🔍 Fetching NCAA game results for ${gameIds.length} games in ${gameIdChunks.length} queries...`);

            // Run multiple queries if needed
            for (const chunk of gameIdChunks) {
                console.log(`Fetching chunk: ${chunk}`)
                let query = ncaaGamesRef.where("gameId", "in", chunk);
                const querySnapshot = await query.get();

                querySnapshot.forEach(doc => {
                    ncaaGameResults[doc.id] = doc.data();
                });
            }
        }

        console.log(`📌 Retrieved ${Object.keys(ncaaGameResults).length} NCAA games.`);

        // **Step 3: Build and Store Correct Bracket (always runs)**
        const correctBracket = buildCorrectBracket(gameMappings, ncaaGameResults);
        await db.doc(`correctBracket/${g}/years/${year}`).set(correctBracket);
        console.log(`📌 Correct bracket saved for ${g}/${year}.`);

        // **Step 4: Get Published Brackets (for scoring)**
        const publishedBracketsRef = db.collection(`leaderboard/${g}/years/${year}/entries`);
        const publishedBracketsSnapshot = await publishedBracketsRef.get();

        if (publishedBracketsSnapshot.empty) {
            console.warn(`⚠️ No published brackets found for year ${year} (${g}). Skipping scoring.`);
            continue;
        }

        // **Step 5: Fetch each bracket's data**
        const publishedBrackets = await Promise.all(
            publishedBracketsSnapshot.docs.map(async (doc) => {
                const bracket = { id: doc.id, ...doc.data() };

                if (!("bracketId" in bracket)) {
                    console.warn(`⚠️ Skipping bracket ${doc.id} due to missing bracketId.`);
                    return null;
                }

                // Fetch the full bracket from Firestore
                // New path: brackets/{gender}/years/{year}/users/{userId}
                // Note: bracketId in leaderboard is basically userId
                const bracketRef = db.doc(`brackets/${g}/years/${year}/users/${bracket.bracketId}`);
                const bracketSnapshot = await bracketRef.get();

                if (!bracketSnapshot.exists) {
                    console.warn(`⚠️ Bracket data missing for bracket ID: ${bracket.bracketId}`);
                    return { ...bracket, bracketData: null };
                }

                return { ...bracket, bracketData: bracketSnapshot.data() };
            })
        );

        console.log(`📌 Found ${publishedBrackets.length} published brackets.`);

        // **Step 6: Score & Update Each Published Bracket**
        const updatePromises = publishedBrackets.map(async bracket => {
            if (!bracket || !bracket.bracketData) return;
            const { score, maxScore } = calculateBracketScore(bracket, gameMappings, ncaaGameResults, String(year), g);
            console.log(`🏆 Bracket ${bracket!.id} - Score: ${score}, Max: ${maxScore}`);

            return publishedBracketsRef.doc(bracket!.id).update({ score, maxScore });
        });

        await Promise.all(updatePromises);
        console.log(`✅ All ${g} brackets updated successfully!`);
    }
}

