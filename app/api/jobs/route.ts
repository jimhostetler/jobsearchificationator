import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { scoreJobDescription } from "@/lib/claude";

export async function POST(request: NextRequest) {
  try {
    const { rawDescription } = await request.json();

    if (!rawDescription || typeof rawDescription !== "string") {
      return NextResponse.json(
        { error: "Job description is required" },
        { status: 400 }
      );
    }

    // Score the job using Claude
    const scoreResult = await scoreJobDescription(rawDescription);

    // Create the job in the database
    const job = await prisma.job.create({
      data: {
        title: scoreResult.title,
        company: scoreResult.company,
        rawDescription,
        salary: scoreResult.salary,
        location: scoreResult.location,
        remote: scoreResult.remote,
        matchScore: scoreResult.matchScore,
        matchReasons: JSON.stringify(scoreResult.matchReasons),
        concerns: JSON.stringify(scoreResult.concerns),
        status: "viewed",
      },
    });

    return NextResponse.json({
      ...job,
      matchReasons: scoreResult.matchReasons,
      concerns: scoreResult.concerns,
      missionAlignment: scoreResult.missionAlignment,
    });
  } catch (error: any) {
    console.error("Error creating job:", error);

    // Check for Anthropic API errors
    if (error?.error?.error?.message) {
      const apiMessage = error.error.error.message;

      if (apiMessage.includes("credit balance is too low")) {
        return NextResponse.json(
          { error: "You're out of credits dummy. Feed the beast at console.anthropic.com" },
          { status: 402 }
        );
      }

      // Return other API errors directly
      return NextResponse.json(
        { error: `API Error: ${apiMessage}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to process job description" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const where = status ? { status: status as any } : {};

    const jobs = await prisma.job.findMany({
      where,
      orderBy: {
        [sortBy]: sortOrder,
      },
    });

    // Parse JSON fields
    const parsedJobs = jobs.map((job) => ({
      ...job,
      matchReasons: JSON.parse(job.matchReasons),
      concerns: JSON.parse(job.concerns),
    }));

    return NextResponse.json(parsedJobs);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}
