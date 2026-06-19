"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";

interface Themes {
  generatedAt: string;
  candidateName: string;
  hardFilters: {
    excludeIndustries: string[];
    excludeCompanies: string[];
    excludeKeywords: string[];
    requireRemote: boolean;
    excludeLocations: string[];
  };
  targetTitles: string[];
  targetIndustries: string[];
  targetCompanies: { name: string; tier: number; rationale: string }[];
  positiveThemes: string[];
  negativeThemes: string[];
  searchQueries: string[];
  knownCompanies: string[];
  narrative: string;
}

export default function ThemesPage() {
  const [themes, setThemes] = useState<Themes | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/extract-themes");
      if (res.status === 404) {
        setThemes(null);
        return;
      }
      if (!res.ok) {
        throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      }
      setThemes(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function refresh() {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch("/api/agents/extract-themes", { method: "POST" });
      if (!res.ok) {
        throw new Error((await res.json()).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setThemes(data.themes);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setRefreshing(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Search Themes" />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="text-sm text-gray-600">
            {themes
              ? `Last extracted ${new Date(themes.generatedAt).toLocaleString()}`
              : "No themes file yet."}
          </div>
          <button
            disabled={refreshing}
            onClick={refresh}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md hover:bg-purple-700 disabled:opacity-50"
          >
            {refreshing ? "Re-extracting…" : "Re-extract themes"}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-4 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading…</div>
        ) : !themes ? (
          <div className="text-center py-12 bg-white rounded-lg shadow text-gray-600">
            <p className="text-sm text-gray-600">
              No themes have been extracted yet. Click <strong>Re-extract themes</strong> above
              to have Claude read your <code>CLAUDE.md</code> and applied-jobs history
              and produce a theme summary.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Narrative">
              <p className="text-gray-700">{themes.narrative}</p>
            </Section>

            <Section title="Target titles">
              <Tags items={themes.targetTitles} />
            </Section>

            <Section title="Target industries">
              <Tags items={themes.targetIndustries} />
            </Section>

            <Section title="Target companies (watchlist)">
              <div className="space-y-2">
                {themes.targetCompanies.map((c, i) => (
                  <div key={i} className="text-sm">
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-gray-400 ml-2">Tier {c.tier}</span>
                    <div className="text-gray-600 ml-1">{c.rationale}</div>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Positive themes (patterns from applied roles)">
              <Tags items={themes.positiveThemes} color="green" />
            </Section>

            <Section title="Negative themes (patterns from rejected roles)">
              <Tags items={themes.negativeThemes} color="orange" />
            </Section>

            <Section title="Hard filters">
              <div className="text-sm space-y-2">
                <div>
                  <span className="font-medium">Remote required:</span>{" "}
                  {themes.hardFilters.requireRemote ? "Yes" : "No"}
                </div>
                <div>
                  <span className="font-medium">Exclude industries:</span>{" "}
                  <Tags items={themes.hardFilters.excludeIndustries} color="red" inline />
                </div>
                <div>
                  <span className="font-medium">Exclude companies:</span>{" "}
                  <Tags items={themes.hardFilters.excludeCompanies} color="red" inline />
                </div>
              </div>
            </Section>

            <Section title="Search queries (used by the daily agent)">
              <ul className="list-disc list-inside text-sm text-gray-700">
                {themes.searchQueries.map((q, i) => (
                  <li key={i}>
                    <code className="bg-gray-100 px-1.5 py-0.5 rounded">{q}</code>
                  </li>
                ))}
              </ul>
            </Section>

            <Section title="Known companies (deduped against by the daily agent)">
              <Tags items={themes.knownCompanies} />
            </Section>
          </div>
        )}
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <h2 className="text-base font-semibold text-gray-900 mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Tags({
  items,
  color = "blue",
  inline = false,
}: {
  items: string[];
  color?: "blue" | "green" | "orange" | "red";
  inline?: boolean;
}) {
  if (!items || items.length === 0)
    return <span className="text-sm text-gray-400">(none)</span>;
  const colorMap = {
    blue: "bg-blue-50 text-blue-800 border-blue-200",
    green: "bg-green-50 text-green-800 border-green-200",
    orange: "bg-orange-50 text-orange-800 border-orange-200",
    red: "bg-red-50 text-red-800 border-red-200",
  }[color];
  return (
    <div className={inline ? "inline-flex flex-wrap gap-1.5" : "flex flex-wrap gap-2"}>
      {items.map((t, i) => (
        <span
          key={i}
          className={`text-xs px-2 py-1 rounded-md border ${colorMap}`}
        >
          {t}
        </span>
      ))}
    </div>
  );
}
