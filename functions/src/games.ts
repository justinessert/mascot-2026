import fetch from "node-fetch";
import { DateTime } from "luxon";
import { Timestamp } from "firebase-admin/firestore";
import { db } from "./firebase";

// Fetch NCAA Game Data from API
async function fetchNCAAGamesFromAPI(date: string | null = null, gender: "men" | "women" = "men") {
    const pacificNow = DateTime.now().setZone("America/Los_Angeles");
    const targetDate = date || pacificNow.toFormat("yyyy/MM/dd"); // Format: "2024/03/10"
    const sport = gender === "men" ? "basketball-men" : "basketball-women";
    const apiUrl = `https://data.ncaa.com/casablanca/scoreboard/${sport}/d1/${targetDate}/scoreboard.json`;
    console.log(`🌍 Fetching NCAA games from for ${targetDate}: ${apiUrl}`);

    try {
        console.log("⏳ Fetching NCAA games...");
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);

        const data = await response.json();
        console.log("✅ NCAA game data retrieved:", data);
        return data;
    } catch (error) {
        console.error("❌ Error fetching NCAA games:", error);
        throw error;
    }
}

// Save Game Data to Firestore
async function saveGamesToDatabase(games: any, gender: "men" | "women") {
    const batch = db.batch();
    const gamesCollection = db.collection(`ncaaGames/${gender}/games`);

    games.games.forEach((game: any) => {
        const gameRef = gamesCollection.doc(game.game.gameID.toString());
        let winner = null;
        let loser = null;
        if (game.game.home.winner) {
            winner = game.game.home.names.seo;
            loser = game.game.away.names.seo;
        } else if (game.game.away.winner) {
            winner = game.game.away.names.seo;
            loser = game.game.home.names.seo;
        }
        batch.set(gameRef, {
            homeTeam: game.game.home.names.seo,
            awayTeam: game.game.away.names.seo,
            homeScore: game.game.home.score,
            awayScore: game.game.away.score,
            gameDate: game.game.startDate,
            status: game.game.currentPeriod,
            winner: winner,
            loser: loser,
            gameId: game.game.gameID.toString(),
            lastUpdated: Timestamp.now(),
        });
    });

    await batch.commit();
    console.log("✅ NCAA games saved to Firestore.");
}

// Main Function: Fetch & Store Games
// Main Function: Fetch & Store Games
export async function updateNCAAGames(date: string | undefined | null = null, gender?: "men" | "women") {
    if (date) {
        date = DateTime.fromISO(date).toFormat("yyyy/MM/dd");
    }

    const gendersToUpdate = gender ? [gender] : ["men", "women"] as const;

    for (const g of gendersToUpdate) {
        console.log(`🔄 Updating NCAA games for ${g} on date ${date}...`);
        try {
            const games = await fetchNCAAGamesFromAPI(date, g);
            console.log(`🎉 NCAA ${g} games fetched successfully.`);
            await saveGamesToDatabase(games, g);
            console.log(`🎉 NCAA ${g} games updated successfully.`);
        } catch (error) {
            console.error(`❌ Error updating ${g} games:`, error);
        }
    }
};
