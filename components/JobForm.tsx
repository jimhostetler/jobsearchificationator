"use client";

import { useState } from "react";
import { Job } from "@/lib/types";

interface JobFormProps {
  onJobCreated: (job: Job) => void;
}

export function JobForm({ onJobCreated }: JobFormProps) {
  const [description, setDescription] = useState("");
  const [titleInput, setTitleInput] = useState("");
  const [companyInput, setCompanyInput] = useState("");
  const [urlInput, setUrlInput] = useState("");
  const [scoring, setScoring] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loading = scoring || saving;

  const handleScore = async () => {
    if (!description.trim()) return;
    setScoring(true);
    setError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawDescription: description, url: urlInput.trim() || undefined }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to process job");
      }

      const job = await response.json();
      onJobCreated(job);
      setDescription("");
      setTitleInput("");
      setCompanyInput("");
      setUrlInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setScoring(false);
    }
  };

  const handleSaveForLater = async () => {
    if (!description.trim()) return;
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawDescription: description,
          skipScoring: true,
          title: titleInput.trim() || undefined,
          company: companyInput.trim() || undefined,
          url: urlInput.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save job");
      }

      const job = await response.json();
      onJobCreated(job);
      setDescription("");
      setTitleInput("");
      setCompanyInput("");
      setUrlInput("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Job Title{" "}
            <span className="text-gray-500 font-normal">(optional — extracted automatically when scoring)</span>
          </label>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
            placeholder="e.g. Director of Product"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 text-gray-900"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-900 mb-1">
            Company{" "}
            <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={companyInput}
            onChange={(e) => setCompanyInput(e.target.value)}
            placeholder="e.g. Kickstarter"
            className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 text-gray-900"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 mb-1">
          Posting URL <span className="text-gray-500 font-normal">(optional)</span>
        </label>
        <input
          type="url"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder="https://..."
          className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 text-gray-900"
          disabled={loading}
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-900 mb-2"
        >
          Paste Job Description
        </label>
        <textarea
          id="description"
          rows={12}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          className="block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-3 text-gray-900"
          disabled={loading}
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleSaveForLater}
          disabled={loading || !description.trim()}
          className="flex-1 py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save for Later"}
        </button>
        <button
          type="button"
          onClick={handleScore}
          disabled={loading || !description.trim()}
          className="flex-1 flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {scoring ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Analyzing with Claude...
            </span>
          ) : (
            "Score Job"
          )}
        </button>
      </div>
    </div>
  );
}
