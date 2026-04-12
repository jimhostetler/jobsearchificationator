"use client";

import { Job } from "@/lib/types";
import { StatusBadge, StatusSelect } from "./StatusBadge";
import { JobStatus } from "@prisma/client";

interface JobCardProps {
  job: Job;
  onStatusChange: (id: string, status: JobStatus) => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600 bg-green-50";
  if (score >= 40) return "text-yellow-600 bg-yellow-50";
  return "text-red-600 bg-red-50";
}

export function JobCard({ job, onStatusChange }: JobCardProps) {
  const formattedDate = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  return (
    <div className="bg-white rounded-lg shadow border p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-4">
        {/* Left: Job info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <a
              href={`/jobs/${job.id}`}
              className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
            >
              {job.title}
            </a>
            {job.remote && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                Remote
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600">{job.company}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            {job.location && <span>{job.location}</span>}
            {job.salary && <span>{job.salary}</span>}
            <span>{formattedDate}</span>
          </div>
        </div>

        {/* Right: Score and status */}
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${getScoreColor(
              job.matchScore
            )}`}
          >
            {job.matchScore}
          </div>
          <div className="w-32">
            <StatusSelect
              status={job.status}
              onChange={(status) => onStatusChange(job.id, status)}
            />
          </div>
        </div>
      </div>

      {/* Match highlights */}
      {job.matchReasons.length > 0 && (
        <div className="mt-3 pt-3 border-t">
          <div className="flex flex-wrap gap-2">
            {job.matchReasons.slice(0, 2).map((reason, i) => (
              <span
                key={i}
                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700"
              >
                {reason.length > 50 ? reason.slice(0, 50) + "..." : reason}
              </span>
            ))}
            {job.matchReasons.length > 2 && (
              <span className="text-xs text-gray-500">
                +{job.matchReasons.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
