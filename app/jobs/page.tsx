"use client";

import { useEffect, useState } from "react";
import { Job } from "@/lib/types";
import { JobCard } from "@/components/JobCard";
import { JobStatus } from "@prisma/client";

const statusFilters: { value: string; label: string }[] = [
  { value: "", label: "All Active" },
  { value: "viewed", label: "Viewed" },
  { value: "applied", label: "Applied" },
  { value: "interviewed", label: "Interviewed" },
  { value: "rejected", label: "Rejected" },
  { value: "cancelled", label: "Cancelled" },
];

const sortOptions: { value: string; label: string }[] = [
  { value: "createdAt:desc", label: "Newest First" },
  { value: "createdAt:asc", label: "Oldest First" },
  { value: "matchScore:desc", label: "Highest Score" },
  { value: "matchScore:asc", label: "Lowest Score" },
  { value: "company:asc", label: "Company A-Z" },
];

const DEAD_STATUSES = new Set(["rejected", "cancelled"]);

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt:desc");
  const [deadExpanded, setDeadExpanded] = useState(false);

  const fetchJobs = async () => {
    setLoading(true);
    const [field, order] = sortBy.split(":");
    const params = new URLSearchParams();
    // When filtering to rejected/cancelled specifically, don't restrict to active
    if (statusFilter) params.set("status", statusFilter);
    params.set("sortBy", field);
    params.set("sortOrder", order);

    try {
      const response = await fetch(`/api/jobs?${params}`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter, sortBy]);

  const handleStatusChange = async (id: string, status: JobStatus) => {
    try {
      const response = await fetch(`/api/jobs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setJobs((prev) =>
          prev.map((job) => (job.id === id ? { ...job, status } : job))
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  // When "All Active" is selected, separate active from dead
  const isShowingAll = statusFilter === "";
  const activeJobs = isShowingAll ? jobs.filter((j) => !DEAD_STATUSES.has(j.status)) : jobs;
  const deadJobs = isShowingAll ? jobs.filter((j) => DEAD_STATUSES.has(j.status)) : [];

  const stats = {
    total: jobs.filter((j) => !DEAD_STATUSES.has(j.status)).length,
    applied: jobs.filter((j) => j.status === "applied").length,
    interviewed: jobs.filter((j) => j.status === "interviewed").length,
    avgScore:
      activeJobs.length > 0
        ? Math.round(activeJobs.reduce((sum, j) => sum + j.matchScore, 0) / activeJobs.length)
        : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">All Jobs</h1>
          <div className="flex items-center gap-3">
            <a
              href="/profile"
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50"
            >
              Edit Profile
            </a>
            <a
              href="/"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
            >
              Score New Job
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-500">Active</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.applied}</div>
            <div className="text-sm text-gray-500">Applied</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-purple-600">
              {stats.interviewed}
            </div>
            <div className="text-sm text-gray-500">Interviewed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-2xl font-bold text-green-600">{stats.avgScore}</div>
            <div className="text-sm text-gray-500">Avg Score</div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Status:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                {statusFilters.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="rounded-md border-gray-300 text-sm"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Job list */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-2 text-gray-500">Loading jobs...</p>
          </div>
        ) : activeJobs.length === 0 && deadJobs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">No jobs found.</p>
            <a
              href="/"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700"
            >
              Score your first job
            </a>
          </div>
        ) : (
          <>
            {/* Active jobs */}
            {activeJobs.length > 0 ? (
              <div className="space-y-4">
                {activeJobs.map((job) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            ) : isShowingAll ? (
              <div className="text-center py-8 bg-white rounded-lg shadow">
                <p className="text-gray-500">No active jobs. Score a new one above.</p>
              </div>
            ) : null}

            {/* Dead jobs section (only when showing all) */}
            {isShowingAll && deadJobs.length > 0 && (
              <div className="mt-8">
                <button
                  onClick={() => setDeadExpanded((v) => !v)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 mb-3"
                >
                  <svg
                    className={`h-4 w-4 transition-transform ${deadExpanded ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  Rejected &amp; Cancelled ({deadJobs.length})
                </button>

                {deadExpanded && (
                  <div className="space-y-4 opacity-60">
                    {deadJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
