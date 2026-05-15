"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobForm } from "@/components/JobForm";
import { ScoreDisplay } from "@/components/ScoreDisplay";
import { AppHeader } from "@/components/AppHeader";
import { Job } from "@/lib/types";
import { JobStatus } from "@prisma/client";

export default function Home() {
  const router = useRouter();
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [updating, setUpdating] = useState(false);

  const handleJobCreated = (job: Job) => {
    if (job.matchScore === null) {
      router.push(`/jobs/${job.id}`);
    } else {
      setCurrentJob(job);
    }
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
      <AppHeader title="Add Job" />

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentJob ? (
          <ScoreDisplay
            job={currentJob}
            onStatusChange={handleStatusChange}
            onDismiss={handleDismiss}
            onJobUpdate={setCurrentJob}
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
