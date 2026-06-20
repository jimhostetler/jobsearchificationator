import fs from "fs/promises";
import path from "path";
import { prisma } from "./db";

const SKILL_PATH = path.join(process.cwd(), "job-search-skill.md");
const INTERESTS_PATH = path.join(process.cwd(), "company-interests.md");

// Syncs company data to job-search-skill.md and company-interests.md.
// CLAUDE.md is no longer auto-synced — it's a manually maintained personal dataset.
// Called after any company create / update / delete.
export async function syncCompanies(): Promise<void> {
  const companies = await prisma.company.findMany({
    orderBy: { name: "asc" },
  });

  await Promise.all([
    syncSkillFile(companies),
    syncInterestsFile(companies),
  ]);
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

// ---------------------------------------------------------------------------
// company-interests.md — public read-only snapshot for GitHub
// Fully rewritten on every sync; never edited manually.
// ---------------------------------------------------------------------------
async function syncInterestsFile(companies: Awaited<ReturnType<typeof prisma.company.findMany>>) {
  const pursuing = companies.filter(
    (c) => c.status === "pursue" || c.status === "network" || c.status === "applied"
  );
  const watching = companies.filter((c) => c.status === "watch");

  const tableRows = (list: typeof companies) =>
    list.map((c) => `| **${c.name}** | ${c.why ?? ""} |`).join("\n");

  const updated = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });

  const content = `# Companies I'm Excited About

A living list of companies I'm actively researching or pursuing — organized by how engaged I currently am. Updated automatically from my job search tracker.

*Last updated: ${updated}*

---

## Actively Pursuing

These are companies where I've either applied, am in active outreach, or have identified a specific angle worth pursuing now.

| Company | Why it matters to me |
|---|---|
${pursuing.length > 0 ? tableRows(pursuing) : "| _(none currently)_ | |"}

---

## Watching

Companies I'm tracking and would move on quickly if the right role opened.

| Company | Why it matters to me |
|---|---|
${watching.length > 0 ? tableRows(watching) : "| _(none currently)_ | |"}
`;

  await fs.writeFile(INTERESTS_PATH, content, "utf-8");
}
