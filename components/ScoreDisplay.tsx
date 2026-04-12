"use client";

import { Job } from "@/lib/types";
import { StatusSelect } from "./StatusBadge";
import { JobStatus } from "@prisma/client";

interface ScoreDisplayProps {
  job: Job;
  onStatusChange: (status: JobStatus) => void;
  onDismiss: () => void;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-green-600";
  if (score >= 40) return "text-yellow-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-green-50 border-green-200";
  if (score >= 40) return "bg-yellow-50 border-yellow-200";
  return "bg-red-50 border-red-200";
}

export function ScoreDisplay({ job, onStatusChange, onDismiss }: ScoreDisplayProps) {
  return (
    <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
      {/* Header with score */}
      <div className={`p-6 border-b ${getScoreBg(job.matchScore)}`}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{job.title}</h2>
            <p className="text-gray-600">{job.company}</p>
          </div>
          <div className="text-right">
            <div className={`text-4xl font-bold ${getScoreColor(job.matchScore)}`}>
              {job.matchScore}
            </div>
            <div className="text-sm text-gray-500">Match Score</div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-6">
        {/* Quick info */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Location:</span>
            <p className="font-medium">
              {job.location || "Not specified"}
              {job.remote && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                  Remote
                </span>
              )}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Salary:</span>
            <p className="font-medium">{job.salary || "Not listed"}</p>
          </div>
          <div>
            <span className="text-gray-500">Status:</span>
            <div className="mt-1">
              <StatusSelect status={job.status} onChange={onStatusChange} />
            </div>
          </div>
        </div>

        {/* Mission alignment */}
        {job.missionAlignment && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Mission Alignment
            </h3>
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {job.missionAlignment}
            </p>
          </div>
        )}

        {/* Match reasons */}
        {job.matchReasons.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-green-700 mb-2">
              Why This Fits
            </h3>
            <ul className="space-y-1">
              {job.matchReasons.map((reason, i) => (
                <li key={i} className="flex items-start text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 text-green-500 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Concerns */}
        {job.concerns.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-red-700 mb-2">Concerns</h3>
            <ul className="space-y-1">
              {job.concerns.map((concern, i) => (
                <li key={i} className="flex items-start text-sm text-gray-600">
                  <svg
                    className="h-5 w-5 text-red-500 mr-2 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {concern}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            onClick={onDismiss}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Score Another Job
          </button>
          <a
            href="/jobs"
            className="flex-1 py-2 px-4 bg-blue-600 rounded-md text-sm font-medium text-white hover:bg-blue-700 text-center"
          >
            View All Jobs
          </a>
        </div>
      </div>
    </div>
  );
}
