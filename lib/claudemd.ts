import fs from "fs/promises";
import path from "path";
import { prisma } from "./db";

const CLAUDE_MD_PATH = path.join(process.cwd(), "CLAUDE.md");
const SKILL_PATH = path.join(process.cwd(), "job-search-skill.md");

// Syncs company data to both CLAUDE.md and job-search-skill.md.
// Called after any company create / update / delete.
export async function syncCompanies(): Promise<void> {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  await Promise.all([
    syncClaudeMd(companies),
    syncSkillFile(companies),
  ]);
}

// Keep the old name as an alias so the seed route doesn't need a separate import change.
export const syncCompaniesToClaudeMd = syncCompanies;

// ---------------------------------------------------------------------------
// CLAUDE.md — rewrites "## Target Company Watchlist" section
// ---------------------------------------------------------------------------
async function syncClaudeMd(companies: Awaited<ReturnType<typeof prisma.company.findMany>>) {
  const tier1 = companies.filter((c) => c.status === "pursue");
  const tier2 = companies.filter((c) => c.status === "watch" || c.status === "network");
  const excluded = companies.filter((c) => c.status === "exclude");

  const tier1Rows = tier1
    .map((c) => `| ${c.name} | ${c.why ?? ""} | ${c.notes ?? ""} |`)
    .join("\n");

  const tier2Rows = tier2
    .map((c) => `| ${c.name} | ${c.why ?? ""} | ${c.notes ?? ""} |`)
    .join("\n");

  const excludedItems = excluded
    .map((c) => `- **${c.name}**${c.notes ? ` — ${c.notes}` : ""}`)
    .join("\n");

  const newSection = `## Target Company Watchlist

### Tier 1 — Active pursuit
| Company | Why | Current Status |
|---|---|---|
${tier1Rows || "| _(none)_ | | |"}

### Tier 2 — Monitor and outreach
| Company | Why | Notes |
|---|---|---|
${tier2Rows || "| _(none)_ | | |"}

### Off the list
${excludedItems || "_(none)_"}`;

  const content = await fs.readFile(CLAUDE_MD_PATH, "utf-8");
  const updated = content.replace(
    /## Target Company Watchlist[\s\S]*?(?=\n## )/,
    newSection + "\n"
  );

  if (updated === content) {
    console.warn("claudemd: could not locate Target Company Watchlist section in CLAUDE.md");
    return;
  }

  await fs.writeFile(CLAUDE_MD_PATH, updated, "utf-8");
}

// ---------------------------------------------------------------------------
// job-search-skill.md — rewrites "## FLAGGED COMPANIES" section
// ---------------------------------------------------------------------------
async function syncSkillFile(companies: Awaited<ReturnType<typeof prisma.company.findMany>>) {
  let content: string;
  try {
    content = await fs.readFile(SKILL_PATH, "utf-8");
  } catch {
    return; // skill file doesn't exist yet — nothing to sync
  }

  if (!content.includes("## FLAGGED COMPANIES")) {
    return; // section not present — don't touch the file
  }

  // pursue + network + applied → Tier 1
  const tier1 = companies.filter(
    (c) => c.status === "pursue" || c.status === "network" || c.status === "applied"
  );
  // watch → Tier 2
  const tier2 = companies.filter((c) => c.status === "watch");

  const formatItem = (c: { name: string; why: string | null; notes: string | null }) => {
    const detail = c.why || c.notes;
    return `- ${c.name}${detail ? ` — ${detail}` : ""}`;
  };

  const newSection = `## FLAGGED COMPANIES

### Tier 1 (Active Apply/Network)
${tier1.length > 0 ? tier1.map(formatItem).join("\n") : "_(none)_"}

### Tier 2 (Watch)
${tier2.length > 0 ? tier2.map(formatItem).join("\n") : "_(none)_"}`;

  // Replace everything from "## FLAGGED COMPANIES" to the next "## " heading (or end of file)
  const updated = content.replace(
    /## FLAGGED COMPANIES[\s\S]*?(?=\n## |$)/,
    newSection + "\n"
  );

  if (updated === content) {
    console.warn("claudemd: could not replace FLAGGED COMPANIES section in job-search-skill.md");
    return;
  }

  await fs.writeFile(SKILL_PATH, updated, "utf-8");
}
