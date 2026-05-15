import fs from "fs";
import path from "path";

export function getProfileContext(): string {
  const profilePath = path.join(process.cwd(), "CLAUDE.md");
  return fs.readFileSync(profilePath, "utf-8");
}

export function buildResumeTweaksPrompt(jobDescription: string, resumeText: string): string {
  const profile = getProfileContext();

  return `You are a resume optimization expert helping a job seeker tailor their resume for a specific role.

## Candidate Profile
${profile}

## Master Resume
${resumeText}

## Target Job Description
${jobDescription}

## Instructions

Analyze the job description against the candidate's master resume and return specific, actionable recommendations to tailor the resume for this role.

Return a JSON object with this structure:

{
  "tweaks": [
    {
      "section": "Which section this applies to (e.g., 'Professional Summary', 'Cigna/Evernorth', 'Skills')",
      "suggestion": "The specific change — be concrete about wording where possible",
      "rationale": "Why this change improves fit for this specific role"
    }
  ]
}

## Guidance

- Focus on the 4–6 highest-leverage changes, not an exhaustive list
- Prioritize reframing existing experience over adding new claims
- Call out specific keywords or phrases from the job description that should appear in the resume
- If any section is actively working against the application, say so directly and suggest how to neutralize it
- Do not suggest adding experience the candidate does not have
- Be direct. Soften nothing.

Return ONLY the JSON object, no additional text or markdown formatting.`;
}

export interface JobForThemes {
  title: string;
  company: string;
  status: string;
  location: string | null;
  remote: boolean;
  matchScore: number | null;
  matchReasons: string[] | null;
  concerns: string[] | null;
}

export function buildThemeExtractionPrompt(jobs: JobForThemes[]): string {
  const profile = getProfileContext();

  const applied = jobs.filter((j) => j.status === "applied" || j.status === "interviewed");
  const dismissed = jobs.filter((j) => j.status === "rejected" || j.status === "cancelled");
  const viewed = jobs.filter((j) => j.status === "viewed");

  const summarize = (j: JobForThemes) =>
    `- ${j.title} @ ${j.company} (score ${j.matchScore ?? "n/a"}, ${j.location ?? "loc?"}${j.remote ? ", remote" : ""})\n` +
    (j.matchReasons?.length ? `    + reasons: ${j.matchReasons.join("; ")}\n` : "") +
    (j.concerns?.length ? `    - concerns: ${j.concerns.join("; ")}\n` : "");

  return `You are a job-search analyst. Distill what this candidate is actually looking for into a structured "themes" object that a downstream search agent can use to find new jobs on the open web.

## Candidate Profile (the source of truth)

${profile}

## Jobs the candidate has APPLIED to or INTERVIEWED for (positive signal)

${applied.length === 0 ? "(none yet)" : applied.map(summarize).join("")}

## Jobs the candidate has VIEWED but not acted on (mixed signal)

${viewed.length === 0 ? "(none)" : viewed.map(summarize).join("")}

## Jobs the candidate REJECTED or CANCELLED (negative signal)

${dismissed.length === 0 ? "(none)" : dismissed.map(summarize).join("")}

## Instructions

Synthesize the profile + behavior. The profile is authoritative — applied/rejected data refines it.

Return ONLY a JSON object (no markdown, no prose) with this exact shape:

{
  "generatedAt": "ISO 8601 timestamp",
  "candidateName": "string",
  "hardFilters": {
    "excludeIndustries": ["string", ...],
    "excludeCompanies": ["string", ...],
    "excludeKeywords": ["string", ...],
    "requireRemote": true,
    "excludeLocations": ["string", ...]
  },
  "targetTitles": ["string", ...],
  "targetIndustries": ["string", ...],
  "targetCompanies": [
    { "name": "string", "tier": 1, "rationale": "string" }
  ],
  "positiveThemes": ["string", ...],
  "negativeThemes": ["string", ...],
  "searchQueries": ["string", ...],
  "knownCompanies": ["string", ...],
  "narrative": "string"
}

## Guidance

- **knownCompanies**: list EVERY company already in the dataset above (applied, viewed, rejected, cancelled) — the downstream agent will use this to dedupe.
- **targetCompanies**: pull the Tier 1 and Tier 2 watchlists from the profile. Do NOT invent new ones here; this list is curated.
- **searchQueries**: write 6-10 concrete strings someone could paste into Google or LinkedIn job search. Mix titles, themes, and remote constraints. Examples that fit this candidate: "Director of Product remote creator economy 2026", "Head of Product remote climate tech hiring", "VP Product remote consumer fintech". Do NOT include excluded industries.
- **positiveThemes**: cluster patterns from the applied roles (e.g., "people management responsibilities", "consumer product with genuine user value", "real-time collaboration culture").
- **negativeThemes**: cluster patterns from the rejected/cancelled roles. Be specific (e.g., "B2B financial infrastructure", "async-heavy / documentation-heavy cultures", "roles requiring relocation").
- **hardFilters.excludeIndustries**: pull directly from the profile's hard constraints. Be precise.
- **hardFilters.excludeCompanies**: include the "Off the list" entries from the profile, plus anything the candidate has explicitly rejected.
- **narrative**: 3-5 sentence summary of what this person is looking for. Honest, no fluff.
- Be direct. The candidate explicitly wants real feedback, not encouragement.

Return ONLY the JSON object.`;
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
