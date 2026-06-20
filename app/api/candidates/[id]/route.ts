/**
 * Per-candidate operations: PATCH (status/promote) and DELETE.
 *
 * Promote: copies the candidate row into the Job table with status='viewed'
 * and marks the candidate as 'promoted' with promotedJobId set.
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
  remote: number;
  matchScore: number | null;
  matchReasons: string | null;
  concerns: string | null;
  status: string;
}

async function getCandidate(id: string): Promise<CandidateRow | null> {
  const rows = await prisma.$queryRawUnsafe<CandidateRow[]>(
    `SELECT * FROM Candidate WHERE id = ? LIMIT 1`,
    id
  );
  return rows[0] ?? null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { action, status } = body;

    const candidate = await getCandidate(id);
    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    const now = new Date().toISOString();

    if (action === "promote") {
      // Move it into the Job table.
      const job = await prisma.job.create({
        data: {
          title: candidate.title,
          company: candidate.company,
          url: candidate.url,
          rawDescription:
            candidate.rawDescription ?? `[Discovered by daily search agent]`,
          salary: candidate.salary,
          location: candidate.location,
          remote: candidate.remote === 1,
          matchScore: candidate.matchScore,
          matchReasons: candidate.matchReasons,
          concerns: candidate.concerns,
          status: "viewed",
        },
      });

      await prisma.$executeRawUnsafe(
        `UPDATE Candidate SET status = 'promoted', promotedJobId = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        job.id,
        now,
        now,
        id
      );

      return NextResponse.json({ ok: true, promotedJobId: job.id });
    }

    if (action === "dismiss") {
      await prisma.$executeRawUnsafe(
        `UPDATE Candidate SET status = 'dismissed', reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        now,
        now,
        id
      );
      return NextResponse.json({ ok: true });
    }

    if (status && typeof status === "string") {
      await prisma.$executeRawUnsafe(
        `UPDATE Candidate SET status = ?, reviewedAt = ?, updatedAt = ? WHERE id = ?`,
        status,
        now,
        now,
        id
      );
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { error: "Provide action='promote'|'dismiss' or status" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("PATCH /candidates/[id] failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to update candidate" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.$executeRawUnsafe(`DELETE FROM Candidate WHERE id = ?`, id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /candidates/[id] failed:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to delete candidate" },
      { status: 500 }
    );
  }
}
