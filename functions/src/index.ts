import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { DateTime } from "luxon";
import { updateNCAAGames } from "./games";
import { manualUpdateGameMappings } from "./mapping";
import { updateScores } from "./scoring";
import { authenticateRequest } from "./auth";

export const manualUpdateNCAAGames = onRequest(
    { timeoutSeconds: 300 },
    async (req, res) => {

        try {
            // Authenticate the request
            await authenticateRequest(req, res);

            const date = req.query.date as string
            const gender = req.query.gender as "men" | "women" | undefined
            await updateNCAAGames(date, gender);

            // Log final message to confirm function completion
            console.log("🏁 [manualUpdateNCAAGames] Finished execution successfully.");
            res.status(200).json({ message: "Games updated successfully" });
        } catch (error) {
            console.error("❌ [manualUpdateNCAAGames] Error updating games:", error);
            res.status(500).json({ error: "Failed to fetch NCAA games", details: error });
        }
    });


// Scheduled Automatic Update (Every 15 minutes)
export const scheduledUpdateNCAAGames = onSchedule(
    {
        // schedule: "every 15 minutes",
        schedule: "0 0 1 * *", // Run at 00:00 on day-of-month 1
        timeoutSeconds: 540,
    },
    async () => {
        const now = DateTime.now().setZone("America/Los_Angeles"); // Use Pacific Time

        const currentHour = now.hour; // 0-23 format
        const currentDay = now.weekday; // 1 (Monday) - 7 (Sunday)

        const isValidDay = [4, 5, 6, 7].includes(currentDay); // Thursday-Sunday
        const isValidHour = currentHour >= 12 && currentHour < 24; // 12pm - 11:59pm

        if (!isValidDay || !isValidHour) {
            console.log(`⏳ Skipping update. Current time: ${now.toFormat("yyyy-MM-dd HH:mm:ss ZZZZ")}`);
            return;
        }

        await updateNCAAGames();
        await updateScores();
    });

export const updateGameMappings = onRequest(
    { timeoutSeconds: 300 },
    async (req, res) => {
        try {
            // Authenticate the request
            await authenticateRequest(req, res);

            const { year, newMappings, gender } = req.body; // Get data from request body

            if (!year || newMappings === undefined) {
                res.status(400).json({ error: "Missing required parameters" });
                return
            }

            await manualUpdateGameMappings(year, newMappings, gender);

            res.status(200).json({ message: "Game mapping updated successfully" });
        } catch (error) {
            console.error("❌ Error in updateGameMappings:", error);
            res.status(500).json({ error: "Failed to update game mappings" });
        }
    });

// 🎯 **Update Published Bracket Scores**
export const updateBracketScores = onRequest(
    { timeoutSeconds: 300 },
    async (req, res) => {
        try {
            // Authenticate the request
            await authenticateRequest(req, res);

            const year = req.query.year ? parseInt(req.query.year as string) : DateTime.now().year;
            const gender = req.query.gender as "men" | "women" | undefined

            await updateScores(year, gender)

            res.status(200).json({ message: "Bracket scores updated successfully!" });

        } catch (error) {
            console.error("❌ Error updating bracket scores:", error);
            res.status(500).json({ error: "Failed to update bracket scores" });
        }
    });
