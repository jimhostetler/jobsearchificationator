"use client";

import { useState } from "react";
import { JobForm } from "@/components/JobForm";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { Job } from "@/lib/types";
import { JobStatus } from "@prisma/client";

export default function Home() {
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleJobCreated = (job: Job) => {
    setCurrentJob(job);
  };

  const handleStatusChange = async (status: JobStatus) => {
    if (!currentJob) return;
    setUpdating(true);

    try {
      const response = await fetch(`/api/jobs/${currentJob.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        const updatedJob = await response.json();
        setCurrentJob(updatedJob);
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdating(false);
    }
  };

  const handleDismiss = () => {
    setCurrentJob(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Job Search Tracker
          </h1>
          <a
            href="/jobs"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Jobs
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentJob ? (
          <ScoreDisplay
            job={currentJob}
            onStatusChange={handleStatusChange}
            onDismiss={handleDismiss}
          />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Score a New Job
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Paste a job description below to get a fit score based on your
                profile, interests, and requirements.
              </p>
            </div>
            <JobForm onJobCreated={handleJobCreated} />
          </div>
        )}
      </main>
    </div>
  );
}
