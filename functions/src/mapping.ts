import { db } from "./firebase";


export async function manualUpdateGameMappings(year: number, newMappings: Record<string, any>, gender: "men" | "women" = "men") {
    const mappingRef = db.doc(`gameMappings/${gender}/years/${year}`);

    try {
        // Fetch existing mappings
        const mappingDoc = await mappingRef.get();
        let existingMappings = mappingDoc.exists ? mappingDoc.data() : {};

        // Merge new mappings with existing ones
        for (const [region, rounds] of Object.entries(newMappings)) {
            if (!existingMappings![region]) {
                existingMappings![region] = {};
            }

            for (const [round, gameIds] of Object.entries(rounds as Record<string, string[]>)) {
                existingMappings![region][round] = gameIds;
            }
        }

        // Save updated mappings
        await mappingRef.set(existingMappings!, { merge: true });
        console.log("✅ Game mappings updated successfully:", existingMappings);
    } catch (error) {
        console.error("❌ Error updating game mappings:", error);
    }
}
