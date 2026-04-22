import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreJobDescription } from "@/lib/claude";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({ where: { id } });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const scoreResult = await scoreJobDescription(job.rawDescription);

    const updatedJob = await prisma.job.update({
      where: { id },
      data: {
        matchScore: scoreResult.matchScore,
        matchReasons: JSON.stringify(scoreResult.matchReasons),
        concerns: JSON.stringify(scoreResult.concerns),
      },
    });

    return NextResponse.json({
      ...updatedJob,
      matchReasons: scoreResult.matchReasons,
      concerns: scoreResult.concerns,
      missionAlignment: scoreResult.missionAlignment,
    });
  } catch (error: any) {
    console.error("Error rescoring job:", error);

    if (error?.error?.error?.message) {
      const apiMessage = error.error.error.message;
      if (apiMessage.includes("credit balance is too low")) {
        return NextResponse.json(
          { error: "You're out of credits dummy. Feed the beast at console.anthropic.com" },
          { status: 402 }
        );
      }
      return NextResponse.json(
        { error: `API Error: ${apiMessage}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json({ error: "Failed to rescore job" }, { status: 500 });
  }
}
