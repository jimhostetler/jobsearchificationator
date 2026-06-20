"use client";

import { useEffect, useState, useRef } from "react";
import { AppHeader } from "@/components/AppHeader";

type Tab = "edit" | "preview";

export default function SkillPage() {
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDirty = content !== savedContent;

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/skill");
      if (res.ok) {
        const data = await res.json();
        setContent(data.content);
        setSavedContent(data.content);
        setUpdatedAt(data.updatedAt);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  // Ctrl+S / Cmd+S to save
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        save();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function save() {
    if (!isDirty || saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/skill", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSavedContent(content);
      setUpdatedAt(data.updatedAt);
    } catch (err: any) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  // Tab key inserts spaces in textarea
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = content.slice(0, start) + "  " + content.slice(end);
      setContent(next);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 2;
      });
    }
  }

  const lineCount = content.split("\n").length;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader title="Job Search Skill" />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col">
        {/* Tabs + save bar */}
        <div className="flex items-center gap-1 mb-3">
          {(["edit", "preview"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                tab === t
                  ? "bg-white shadow text-gray-900"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              {t === "edit" ? "Edit" : "Preview"}
            </button>
          ))}
          <button
            onClick={save}
            disabled={!isDirty || saving}
            className="px-4 py-1.5 text-sm font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-default"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          <div className="ml-auto flex items-center gap-3 text-xs text-gray-400">
            {saveError && <span className="text-red-600">{saveError}</span>}
            {isDirty
              ? <span className="text-amber-600">Unsaved changes</span>
              : updatedAt
                ? <span>Saved {new Date(updatedAt).toLocaleTimeString()}</span>
                : null}
            <span>{lineCount} {lineCount === 1 ? "line" : "lines"}</span>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            Loading…
          </div>
        ) : tab === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            placeholder="Paste or write the cowork agent skill instructions here…"
            className="flex-1 min-h-[600px] w-full font-mono text-sm bg-white border border-gray-200 rounded-lg shadow-sm p-4 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 leading-relaxed"
          />
        ) : (
          <div className="flex-1 min-h-[600px] bg-white border border-gray-200 rounded-lg shadow-sm p-6 overflow-auto">
            {content.trim() ? (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 leading-relaxed">
                {content}
              </pre>
            ) : (
              <p className="text-gray-400 text-sm">Nothing to preview — the file is empty.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
