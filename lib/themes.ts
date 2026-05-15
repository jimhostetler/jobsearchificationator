import fs from "fs";
import path from "path";

/**
 * Themes are the distilled signal of what Jim is looking for —
 * extracted by Agent 1 from CLAUDE.md + the jobs he has actually
 * applied to / dismissed. Agent 2 (the daily job-search agent)
 * reads this file to know what to search for.
 *
 * This is intentionally a JSON file on disk (not a DB table) so the
 * scheduled task can read it without needing the Prisma client.
 */
export interface Themes {
  generatedAt: string;
  candidateName: string;

  // Hard filters — anything matching gets rejected outright by Agent 2.
  hardFilters: {
    excludeIndustries: string[];      // e.g., ["health insurance", "traditional banking"]
    excludeCompanies: string[];       // e.g., ["Discord", "Duolingo", "AirBnB"]
    excludeKeywords: string[];        // e.g., ["on-site required", "must relocate"]
    requireRemote: boolean;
    excludeLocations: string[];       // e.g., ["San Francisco only"]
  };

  // Soft preferences — used for scoring, not hard rejection.
  targetTitles: string[];             // e.g., ["Director of Product", "Head of Product", "VP Product"]
  targetIndustries: string[];         // e.g., ["creator economy", "climate tech", "consumer fintech"]
  targetCompanies: {                  // explicit watchlist
    name: string;
    tier: 1 | 2;
    rationale: string;
  }[];

  // Themes derived from Jim's behavior: jobs he applied to share certain qualities.
  positiveThemes: string[];           // e.g., "mission-driven consumer platforms", "people-management responsibilities"
  negativeThemes: string[];           // e.g., "B2B infrastructure", "async-heavy cultures"

  // Concrete strings Agent 2 should plug into web search.
  searchQueries: string[];            // e.g., "Director of Product remote creator economy hiring 2026"

  // Already-applied or already-tracked companies — used to dedupe results.
  knownCompanies: string[];

  // Free-text summary the user can read.
  narrative: string;
}

const THEMES_PATH = path.join(process.cwd(), "prisma", "themes.json");

export function readThemes(): Themes | null {
  try {
    if (!fs.existsSync(THEMES_PATH)) return null;
    const raw = fs.readFileSync(THEMES_PATH, "utf-8");
    return JSON.parse(raw) as Themes;
  } catch {
    return null;
  }
}

export function writeThemes(themes: Themes): void {
  fs.writeFileSync(THEMES_PATH, JSON.stringify(themes, null, 2), "utf-8");
}

export function themesPath(): string {
  return THEMES_PATH;
}
