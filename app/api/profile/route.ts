import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const profilePath = path.join(process.cwd(), "CLAUDE.md");

export async function GET() {
  try {
    const content = fs.readFileSync(profilePath, "utf-8");
    return NextResponse.json({ content });
  } catch {
    return NextResponse.json({ error: "Failed to read profile" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    fs.writeFileSync(profilePath, content, "utf-8");
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to write profile" }, { status: 500 });
  }
}
