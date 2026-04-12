import fs from "fs";
import path from "path";

export function getProfileContext(): string {
  const profilePath = path.join(process.cwd(), "CLAUDE.md");
  return fs.readFileSync(profilePath, "utf-8");
}

export function buildScoringPrompt(jobDescription: string): string {
  const profile = getProfileContext();

  return `You are a job fit analyzer. Your task is to analyze a job description against a candidate's profile and provide a structured assessment.

## Candidate Profile

${profile}

## Job Description to Analyze

${jobDescription}

## Instructions

Analyze the job description and return a JSON object with the following structure:

{
  "title": "Job title extracted from the description",
  "company": "Company name extracted from the description",
  "salary": "Salary range if mentioned, null if not listed",
  "location": "Location mentioned (city, state, country)",
  "remote": true/false - whether the job is remote or allows remote work,
  "matchScore": 0-100 score indicating overall fit,
  "matchReasons": [
    "Reason 1 why this is a good fit",
    "Reason 2 why this is a good fit"
  ],
  "concerns": [
    "Concern 1 about this role",
    "Concern 2 about this role"
  ],
  "missionAlignment": "Brief assessment of mission/values alignment"
}

## Scoring Guidelines

- 80-100: Excellent fit - strong alignment on role, skills, mission, and requirements
- 60-79: Good fit - solid alignment with minor gaps or concerns
- 40-59: Moderate fit - some alignment but notable gaps or concerns
- 20-39: Weak fit - significant misalignment on key criteria
- 0-19: Poor fit - fundamental mismatches (e.g., requires relocation, wrong level, ethically problematic)

## Key Factors to Consider

1. **Role Level Match**: Is this Staff PM, Director, or Sr. PM level?
2. **Remote Work**: Must be remote - flag if requires relocation or in-office
3. **Mission Alignment**: Flag public companies with ethically murky products, health insurance conflicts
4. **Skills Match**: AI/LLM, search, agents, community platforms, user research, 0→1
5. **Industry Fit**: AI, gaming/community, consumer tech preferred
6. **Differentiators**: Gaming passion, Discord moderation, D&D content creation are relevant for gaming/community roles

Be direct and honest in your assessment. The candidate explicitly wants real feedback, not encouragement.

Return ONLY the JSON object, no additional text or markdown formatting.`;
}
