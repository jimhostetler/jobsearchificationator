import { JobStatus } from "@prisma/client";

export interface Job {
  id: string;
  title: string;
  company: string;
  rawDescription: string;
  salary: string | null;
  location: string | null;
  remote: boolean;
  matchScore: number | null;
  matchReasons: string[] | null;
  concerns: string[] | null;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  missionAlignment?: string;
}
