import { JobStatus } from "@prisma/client";

export interface ResumeTweak {
  section: string;
  suggestion: string;
  rationale: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  url: string | null;
  rawDescription: string;
  salary: string | null;
  location: string | null;
  remote: boolean;
  matchScore: number | null;
  matchReasons: string[] | null;
  concerns: string[] | null;
  resumeTweaks: ResumeTweak[] | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  missionAlignment?: string;
}
