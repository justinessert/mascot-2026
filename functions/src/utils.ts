import { firstFourMapping, specialNcaaNames } from "./constants";

export function transformTeamName(teamName: string, year: string, gender?: "men" | "women"): string {
  if (!teamName) return "";

  teamName = firstFourMapping[year][teamName] || teamName;

  // Convert using special mapping if exists
  const mappedName = specialNcaaNames[teamName] || teamName;

  // Replace underscores with hyphens and "state" with "st"
  return mappedName.replace(/_/g, "-").replace(/state/gi, "st");
}
