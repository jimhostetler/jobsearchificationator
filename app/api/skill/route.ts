import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

const SKILL_PATH = path.join(process.cwd(), "job-search-skill.md");

export async function GET() {
  try {
    const content = await fs.readFile(SKILL_PATH, "utf-8");
    const stat = await fs.stat(SKILL_PATH);
    return NextResponse.json({ content, updatedAt: stat.mtime.toISOString() });
  } catch {
    return NextResponse.json({ content: "", updatedAt: null });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { content } = await request.json();
    if (typeof content !== "string") {
      return NextResponse.json({ error: "content must be a string" }, { status: 400 });
    }
    await fs.writeFile(SKILL_PATH, content, "utf-8");
    const stat = await fs.stat(SKILL_PATH);
    return NextResponse.json({ updatedAt: stat.mtime.toISOString() });
  } catch (error) {
    console.error("Error writing skill file:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
