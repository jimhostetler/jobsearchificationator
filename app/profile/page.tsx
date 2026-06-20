"use client";

import { useEffect, useState, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";

export default function ProfilePage() {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isDirty = content !== savedContent;

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.content) {
          setContent(data.content);
          setSavedContent(data.content);
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = useCallback(async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (response.ok) {
        setSavedContent(content);
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
  }, [content, saving]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleSave]);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Profile" />

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
              {/* Save bar */}
              <div className="flex items-center gap-1 mb-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-default"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
                  {error && <span className="text-red-600">{error}</span>}
                  {isDirty
                    ? <span className="text-amber-600">Unsaved changes</span>
                    : savedAt
                      ? <span>Saved {savedAt}</span>
                      : null}
                  <span>Ctrl+S to save</span>
                </div>
              </div>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-[60vh] p-3 font-mono text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                placeholder="Paste your CLAUDE.md profile here..."
                spellCheck={false}
              />
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
