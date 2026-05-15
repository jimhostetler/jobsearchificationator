/**
 * Candidate jobs surfaced by the daily search agent.
 * Staged here for review before being promoted into the Job table.
 *
 * Uses raw SQL via Prisma's $queryRawUnsafe so it works even before
 * `npx prisma generate` is re-run after the Candidate model is added.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

interface CandidateRow {
  id: string;
  title: string;
  company: string;
  url: string | null;
  rawDescription: string | null;
  salary: string | null;
  location: string | null;
  remote: number; // SQLite returns 0/1
  source: string | null;
  searchQuery: string | null;
  matchScore: number | null;
  matchReasons: string | null;
  concerns: string | null;
  status: string;
  discoveredAt: string;
  reviewedAt: string | null;
  promotedJobId: string | null;
  createdAt: string;
  updatedAt: string;
}

function parseCandidate(row: CandidateRow) {
  return {
    ...row,
    remote: row.remote === 1,
    matchReasons: row.matchReasons ? JSON.parse(row.matchReasons) : null,
    concerns: row.concerns ? JSON.parse(row.concerns) : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // optional filter

    const rows = status
      ? await prisma.$queryRawUnsafe<CandidateRow[]>(
          `SELECT * FROM Candidate WHERE status = ? ORDER BY discoveredAt DESC`,
          status
        )
      : await prisma.$queryRawUnsafe<CandidateRow[]>(
          `SELECT * FROM Candidate ORDER BY status = 'new' DESC, discoveredAt DESC`
        );

    return NextResponse.json(rows.map(parseCandidate));
  } catch (error: any) {
    console.error("GET /candidates failed:", error);
    if (String(error?.message ?? "").includes("no such table")) {
      return NextResponse.json(
        {
          error:
            "Candidate table missing. Run `npx prisma db push` to apply the new schema.",
        },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "Failed to fetch candidates" },
      { status: 500 }
    );
  }
}

/**
 * Used by the daily search agent (or anything else) to insert a new
 * candidate. Deduplicates on URL when present, otherwise on (title, company).
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      company,
      url,
      rawDescription,
      salary,
      location,
      remote,
      source,
      searchQuery,
      matchScore,
      matchReasons,
      concerns,
    } = body;

    if (!title || !company) {
      return NextResponse.json(
        { error: "title and company are required" },
        { status: 400 }
      );
    }

    // Dedupe
    const dupes = url
      ? await prisma.$queryRawUnsafe<CandidateRow[]>(
          `SELECT id FROM Candidate WHERE url = ? LIMIT 1`,
          url
        )
      : await prisma.$queryRawUnsafe<CandidateRow[]>(
          `SELECT id FROM Candidate WHERE title = ? AND company = ? LIMIT 1`,
          title,
          company
        );
    if (dupes.length > 0) {
      return NextResponse.json(
        { ok: true, deduped: true, existingId: dupes[0].id },
        { status: 200 }
      );
    }

    // Also dedupe against the Job table by title+company so we don't re-surface
    // something Jim already tracks.
    const existingJob = await prisma.job.findFirst({
      where: { title, company },
      select: { id: true },
    });
    if (existingJob) {
      return NextResponse.json(
        { ok: true, deduped: true, existingJobId: existingJob.id },
        { status: 200 }
      );
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await prisma.$executeRawUnsafe(
      `INSERT INTO Candidate
        (id, title, company, url, rawDescription, salary, location, remote,
         source, searchQuery, matchScore, matchReasons, concerns,
         status, discoveredAt, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?, ?)`,
      id,
      title,
      company,
      url ?? null,
      rawDescription ?? null,
      salary ?? null,
      location ?? null,
      remote ? 1 : 0,
      source ?? null,
      searchQuery ?? null,
      matchScore ?? null,
      matchReasons ? JSON.stringify(matchReasons) : null,
      concerns ? JSON.stringify(concerns) : null,
      now,
      now,
      now
    );

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error: any) {
    console.error("POST /candidates failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to insert candidate" },
      { status: 500 }
    );
  }
}
