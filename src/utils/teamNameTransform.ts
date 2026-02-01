import specialNcaaNames from '../../shared-data/specialNcaaNames.json';

/**
 * Transforms a team name to match the NCAA SEO format used in the correct bracket data.
 * Replicates and enhances the logic from `functions/src/utils.ts` to handle frontend display names.
 */
export function transformTeamName(teamName: string): string {
    if (!teamName) return "";

    // Normalize: lower case and trim
    const normalized = teamName.toLowerCase().trim();

    // Create a potential key by replacing spaces with underscores
    // e.g. "NC State" -> "nc_state"
    const potentialKey = normalized.replace(/\s+/g, "_");

    // Convert using special mapping if exists
    const mapping = specialNcaaNames as Record<string, string>;

    // Check against key (e.g. "nc_state") or original/normalized (e.g. "nc_state" or "NC State" if raw was key)
    // We check potentialKey first as that's the canonical format in the JSON
    const mappedName = mapping[potentialKey] || mapping[normalized] || mapping[teamName] || teamName;

    // Final transformation:
    // 1. Ensure lowercase (mapped values might be arbitrary case, though usually lower)
    // 2. Replace underscores with hyphens
    // 3. Replace spaces with hyphens (if any remained)
    // 4. Replace "state" with "st" (e.g. "alabama-state" -> "alabama-st")
    return mappedName
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\s+/g, "-")
        .replace(/state/gi, "st");
}
