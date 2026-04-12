import { JobStatus } from "@prisma/client";

export interface Job {
  id: string;
  title: string;
  company: string;
  rawDescription: string;
  salary: string | null;
  location: string | null;
  remote: boolean;
  matchScore: number;
  matchReasons: string[];
  concerns: string[];
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  missionAlignment?: string;
}
