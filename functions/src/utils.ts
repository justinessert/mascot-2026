import { firstFourMapping, specialNcaaNames } from "./constants";

// Build reverse mapping from NCAA SEO format back to frontend format
const reverseSpecialNcaaNames: Record<string, string> = Object.fromEntries(
  Object.entries(specialNcaaNames).map(([frontendName, ncaaName]) => [ncaaName, frontendName])
);

export function transformTeamName(teamName: string, year: string, gender?: "men" | "women"): string {
  if (!teamName) return "";

  teamName = firstFourMapping[year][teamName] || teamName;

  // Convert using special mapping if exists
  const mappedName = specialNcaaNames[teamName] || teamName;

  // Replace underscores with hyphens and "state" with "st"
  return mappedName.replace(/_/g, "-").replace(/state/gi, "st");
}

/**
 * Reverses the transformTeamName transformation.
 * Converts NCAA SEO format (e.g., "alabama-st") back to frontend format (e.g., "alabama_state").
 */
export function reverseTransformTeamName(ncaaName: string): string {
  if (!ncaaName) return "";

  // First check if there's a special mapping to reverse
  const specialMapped = reverseSpecialNcaaNames[ncaaName];
  if (specialMapped) {
    return specialMapped;
  }

  // Apply reverse transformations:
  // 1. Replace "-st" suffix with "_state" (only at word boundaries to avoid false positives like "houston")
  // 2. Replace hyphens with underscores
  return ncaaName
    .replace(/-st$/g, "_state")       // Handle suffix "-st" -> "_state"
    .replace(/-st-/g, "_state_")      // Handle mid-word "-st-" -> "_state_"
    .replace(/-/g, "_");              // Replace remaining hyphens with underscores
}
