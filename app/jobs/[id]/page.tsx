"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Job } from "@/lib/types";
import { StatusSelect } from "@/components/StatusBadge";
import { JobStatus } from "@prisma/client";

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

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [rescoreError, setRescoreError] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await fetch(`/api/jobs/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setJob(data);
        }
      } catch (error) {
        console.error("Failed to fetch job:", error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchJob();
    }
  }, [params.id]);

  const handleStatusChange = async (status: JobStatus) => {
    if (!job) return;

    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setJob(updatedJob);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleRescore = async () => {
    if (!job) return;
    setRescoring(true);
    setRescoreError(null);

    try {
      const response = await fetch(`/api/jobs/${job.id}/rescore`, {
        method: "POST",
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setJob(updatedJob);
      } else {
        const data = await response.json();
        setRescoreError(data.error || "Re-evaluation failed");
      }
    } catch {
      setRescoreError("Re-evaluation failed");
    } finally {
      setRescoring(false);
    }
  };

  const handleDelete = async () => {
    if (!job || !confirm("Are you sure you want to delete this job?")) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/jobs/${job.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        router.push("/jobs");
      }
    } catch (error) {
      console.error("Failed to delete job:", error);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
          <p className="mt-2 text-gray-500">Loading job...</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500">Job not found.</p>
          <a href="/jobs" className="mt-4 inline-block text-blue-600">
            Back to jobs
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a
            href="/jobs"
            className="text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            &larr; Back to Jobs
          </a>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            {deleting ? "Deleting..." : "Delete Job"}
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
          {/* Header with score */}
          <div className={`p-6 border-b ${getScoreBg(job.matchScore)}`}>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{job.title}</h1>
                <p className="text-lg text-gray-600">{job.company}</p>
                <p className="text-sm text-gray-500 mt-1">
                  Added {new Date(job.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="text-right">
                <div
                  className={`text-5xl font-bold ${getScoreColor(job.matchScore)}`}
                >
                  {job.matchScore}
                </div>
                <div className="text-sm text-gray-500">Match Score</div>
                <button
                  onClick={handleRescore}
                  disabled={rescoring}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 disabled:opacity-50 underline"
                >
                  {rescoring ? "Re-evaluating..." : "Re-evaluate"}
                </button>
              </div>
            </div>
            {rescoreError && (
              <p className="mt-2 text-sm text-red-600">{rescoreError}</p>
            )}
            {rescoring && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
                Scoring against current profile...
              </div>
            )}
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
                  <StatusSelect status={job.status} onChange={handleStatusChange} />
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
                <ul className="space-y-2">
                  {job.matchReasons.map((reason, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-gray-600"
                    >
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
                <h3 className="text-sm font-medium text-red-700 mb-2">
                  Concerns
                </h3>
                <ul className="space-y-2">
                  {job.concerns.map((concern, i) => (
                    <li
                      key={i}
                      className="flex items-start text-sm text-gray-600"
                    >
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

            {/* Raw description */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">
                Original Job Description
              </h3>
              <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-600 whitespace-pre-wrap max-h-96 overflow-y-auto">
                {job.rawDescription}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
