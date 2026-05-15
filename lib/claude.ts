import Anthropic from "@anthropic-ai/sdk";
import {
  buildScoringPrompt,
  buildResumeTweaksPrompt,
  buildThemeExtractionPrompt,
  JobForThemes,
} from "./prompts";
import { fetchMasterResume } from "./resume";
import { ResumeTweak } from "./types";
import { Themes } from "./themes";

const anthropic = new Anthropic();

export interface JobScoreResult {
  title: string;
  company: string;
  salary: string | null;
  location: string | null;
  remote: boolean;
  matchScore: number;
  matchReasons: string[];
  concerns: string[];
  missionAlignment: string;
}

export async function scoreJobDescription(
  jobDescription: string
): Promise<JobScoreResult> {
  const prompt = buildScoringPrompt(jobDescription);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const result = JSON.parse(content.text) as JobScoreResult;
    return result;
  } catch {
    throw new Error(`Failed to parse Claude response: ${content.text}`);
  }
}

export async function extractThemes(jobs: JobForThemes[]): Promise<Themes> {
  const prompt = buildThemeExtractionPrompt(jobs);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  // Strip code fences if the model added them despite the instruction.
  const cleaned = content.text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const result = JSON.parse(cleaned) as Themes;
    // Force generatedAt to now — don't trust the model's clock.
    result.generatedAt = new Date().toISOString();
    return result;
  } catch (e) {
    throw new Error(`Failed to parse theme extraction response: ${content.text}`);
  }
}

export async function generateResumeTweaks(jobDescription: string): Promise<ResumeTweak[]> {
  const resumeText = await fetchMasterResume();
  const prompt = buildResumeTweaksPrompt(jobDescription, resumeText);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  try {
    const result = JSON.parse(content.text) as { tweaks: ResumeTweak[] };
    return result.tweaks;
  } catch {
    throw new Error(`Failed to parse resume tweaks response: ${content.text}`);
  }
}
