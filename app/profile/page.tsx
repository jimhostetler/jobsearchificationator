"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.content) setContent(data.content);
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        setSavedAt(new Date().toLocaleTimeString());
      } else {
        const data = await response.json();
        setError(data.error || "Failed to save");
      }
    } catch {
      setError("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a href="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
              &larr; Home
            </a>
            <h1 className="text-xl font-bold text-gray-900">Profile (CLAUDE.md)</h1>
          </div>
          <a
            href="/jobs"
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            View All Jobs
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Candidate Profile</h2>
            <p className="text-sm text-gray-600 mt-1">
              This is the profile Claude uses when scoring jobs. Edit it to update your criteria,
              preferences, and deal-breakers. Any re-evaluations will use the saved version.
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[60vh] p-3 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Paste your CLAUDE.md profile here..."
                spellCheck={false}
              />

              {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-gray-500">
                  {savedAt ? `Saved at ${savedAt}` : "Unsaved changes will affect future scoring"}
                </span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Tip:</strong> After updating your profile, use the &ldquo;Re-evaluate&rdquo; button on any
            job to rescore it against your updated criteria.
          </p>
        </div>
      </main>
    </div>
  );
}
