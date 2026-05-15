"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

interface Candidate {
  id: string;
  title: string;
  company: string;
  url: string | null;
  rawDescription: string | null;
  salary: string | null;
  location: string | null;
  remote: boolean;
  source: string | null;
  searchQuery: string | null;
  matchScore: number | null;
  matchReasons: string[] | null;
  concerns: string[] | null;
  status: string;
  discoveredAt: string;
}

const STATUS_FILTERS = [
  { value: "new", label: "New (unreviewed)" },
  { value: "", label: "All" },
  { value: "reviewed", label: "Reviewed" },
  { value: "promoted", label: "Promoted" },
  { value: "dismissed", label: "Dismissed" },
];

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("new");
  const [busyId, setBusyId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
      const res = await fetch(`/api/candidates${qs}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setCandidates(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function act(id: string, action: "promote" | "dismiss") {
    setBusyId(id);
    try {
      const res = await fetch(`/api/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Candidates" />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border-gray-300 text-sm"
          >
            {STATUS_FILTERS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="ml-auto text-sm text-blue-600 hover:text-blue-700"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : candidates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow text-gray-500">
            No candidates with status &quot;{filter || "any"}&quot;. The daily
            agent runs each morning — check back tomorrow, or extract themes and
            wait for the next run.
          </div>
        ) : (
          <div className="space-y-4">
            {candidates.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg shadow p-5 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-lg font-semibold text-gray-900">
                      {c.title}
                    </div>
                    <div className="text-sm text-gray-600">
                      {c.company}
                      {c.location ? ` • ${c.location}` : ""}
                      {c.remote ? " • Remote" : ""}
                      {c.salary ? ` • ${c.salary}` : ""}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Found {new Date(c.discoveredAt).toLocaleString()}
                      {c.source ? ` via ${c.source}` : ""}
                      {c.searchQuery ? ` — query: "${c.searchQuery}"` : ""}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.matchScore !== null && (
                      <div className="text-2xl font-bold text-gray-900">
                        {c.matchScore}
                      </div>
                    )}
                    <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-gray-100 text-gray-700">
                      {c.status}
                    </span>
                  </div>
                </div>

                {c.matchReasons && c.matchReasons.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium text-green-700">Why it might fit</div>
                    <ul className="list-disc list-inside ml-2">
                      {c.matchReasons.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {c.concerns && c.concerns.length > 0 && (
                  <div className="text-sm text-gray-700">
                    <div className="font-medium text-orange-700">Concerns</div>
                    <ul className="list-disc list-inside ml-2">
                      {c.concerns.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2">
                  {c.url && (
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Open posting →
                    </a>
                  )}
                  {c.status === "new" && (
                    <>
                      <button
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, "promote")}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                      >
                        Promote to Jobs
                      </button>
                      <button
                        disabled={busyId === c.id}
                        onClick={() => act(c.id, "dismiss")}
                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
