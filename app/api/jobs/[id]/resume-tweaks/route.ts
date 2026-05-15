import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateResumeTweaks } from "@/lib/claude";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const tweaks = await generateResumeTweaks(job.rawDescription);

    const updated = await prisma.job.update({
      where: { id },
      data: { resumeTweaks: JSON.stringify(tweaks) },
    });

    return NextResponse.json({
      ...updated,
      matchReasons: updated.matchReasons ? JSON.parse(updated.matchReasons) : null,
      concerns: updated.concerns ? JSON.parse(updated.concerns) : null,
      resumeTweaks: tweaks,
    });
  } catch (error: any) {
    console.error("Error generating resume tweaks:", error);

    if (error?.message?.includes("GOOGLE_DOCS_RESUME_ID")) {
      return NextResponse.json(
        { error: "Master resume not configured. Add GOOGLE_DOCS_RESUME_ID to your .env file." },
        { status: 400 }
      );
    }

    if (error?.message?.includes("Failed to fetch resume")) {
      return NextResponse.json(
        { error: "Could not fetch your resume from Google Docs. Make sure the document is shared as 'Anyone with the link can view'." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate resume tweaks" },
      { status: 500 }
    );
  }
}
