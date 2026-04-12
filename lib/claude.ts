import Anthropic from "@anthropic-ai/sdk";
import { buildScoringPrompt } from "./prompts";

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
