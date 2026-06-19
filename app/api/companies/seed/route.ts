import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { syncCompanies } from "@/lib/claudemd";

const SEED_DATA = [
  // Tier 1 — Pursuing
  {
    name: "Reddit",
    status: "pursue" as const,
    why: "Community platform, daily user, multiple prior applications",
    notes: "Direct outreach is higher-leverage than more applications",
  },
  {
    name: "GoodLeap",
    status: "pursue" as const,
    why: "Solar/sustainable home financing, $30B+ facilitated, 1M+ homeowners",
    notes: "Active remote PM roles open (Principal PM Payments, PM Virtual Power Plant)",
  },
  {
    name: "Kickstarter",
    status: "pursue" as const,
    why: "Creator crowdfunding, Jim is a contributor and believes in the mission",
    notes: "No PM role posted; direct outreach + POV memo is the play",
  },
  {
    name: "Patreon",
    status: "pursue" as const,
    why: "Creator monetization and community",
    notes: "Check jobs.ashbyhq.com/patreon; roles open and close quickly",
  },
  // Tier 2 — Watching
  {
    name: "Figma",
    status: "watch" as const,
    why: "Democratizing design and collaboration",
    notes: "No Director of PM currently posted; watch",
  },
  {
    name: "Substack",
    status: "watch" as const,
    why: "Creator economy, writing culture fits Jim",
    notes: "Small team; direct outreach play",
  },
  {
    name: "Etsy",
    status: "watch" as const,
    why: "Independent maker marketplace",
    notes: "In transition; verify current hiring state",
  },
  {
    name: "Octopus Energy",
    status: "watch" as const,
    why: "Green energy tech at scale",
    notes: "UK HQ but US remote roles exist",
  },
  {
    name: "Khan Academy",
    status: "watch" as const,
    why: "Free world-class education, AI investment",
    notes: "PM roles rare but meaningful",
  },
  // Excluded
  {
    name: "Duolingo",
    status: "exclude" as const,
    why: null,
    notes: "confirmed on-site",
  },
  {
    name: "AirBnB",
    status: "exclude" as const,
    why: null,
    notes: "previously rejected",
  },
];

export async function POST() {
  try {
    let created = 0;
    let skipped = 0;

    for (const entry of SEED_DATA) {
      const existing = await prisma.company.findUnique({ where: { name: entry.name } });
      if (existing) {
        skipped++;
        continue;
      }
      await prisma.company.create({ data: entry });
      created++;
    }

    await syncCompanies();

    return NextResponse.json({ created, skipped });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: "Seed failed" }, { status: 500 });
  }
}
