/**
 * Agent 1: Theme Extraction
 *
 * Reads CLAUDE.md (the candidate profile) and all jobs in the DB,
 * asks Claude to distill them into a structured themes.json file
 * that Agent 2 (the daily search agent) will read.
 *
 * Triggered on demand from the local Next.js UI — POST /api/agents/extract-themes.
 * No body required.
 */

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { extractThemes } from "@/lib/claude";
import { writeThemes, themesPath } from "@/lib/themes";
import { JobForThemes } from "@/lib/prompts";

export async function POST() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { updatedAt: "desc" },
    });

    const forThemes: JobForThemes[] = jobs.map((j) => ({
      title: j.title,
      company: j.company,
      status: j.status,
      location: j.location,
      remote: j.remote,
      matchScore: j.matchScore,
      matchReasons: j.matchReasons ? JSON.parse(j.matchReasons) : null,
      concerns: j.concerns ? JSON.parse(j.concerns) : null,
    }));

    const themes = await extractThemes(forThemes);
    writeThemes(themes);

    return NextResponse.json({
      ok: true,
      writtenTo: themesPath(),
      themes,
    });
  } catch (error: any) {
    console.error("extract-themes failed:", error);

    if (error?.error?.error?.message) {
      const apiMessage = error.error.error.message;
      if (apiMessage.includes("credit balance is too low")) {
        return NextResponse.json(
          { error: "Out of Anthropic credits. Top up at console.anthropic.com" },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: `API Error: ${apiMessage}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: error?.message ?? "Failed to extract themes" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // Convenience: lets you fetch the most recently saved themes for display.
  const { readThemes } = await import("@/lib/themes");
  const themes = readThemes();
  if (!themes) {
    return NextResponse.json(
      { error: "No themes file yet. POST to this endpoint to generate one." },
      { status: 404 }
    );
  }
  return NextResponse.json(themes);
}
