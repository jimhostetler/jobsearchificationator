"use client";

import { useEffect, useState, useCallback } from "react";
import { AppHeader } from "@/components/AppHeader";

type CompanyStatus = "pursue" | "watch" | "network" | "applied" | "exclude";

interface Company {
  id: string;
  name: string;
  status: CompanyStatus;
  why: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CompanyDetail extends Company {
  jobs: { id: string; title: string; status: string; matchScore: number | null; createdAt: string }[];
  candidates: { id: string; title: string; status: string; matchScore: number | null; discoveredAt: string }[];
}

const STATUS_META: Record<CompanyStatus, { label: string; color: string }> = {
  pursue:  { label: "Tier 1 — Pursuing",      color: "bg-green-100 text-green-800" },
  watch:   { label: "Tier 2 — Watching",       color: "bg-blue-100 text-blue-800" },
  network: { label: "Networking",               color: "bg-purple-100 text-purple-800" },
  applied: { label: "Applied / In Process",     color: "bg-yellow-100 text-yellow-800" },
  exclude: { label: "Excluded",                 color: "bg-red-100 text-red-800" },
};

const STATUS_ORDER: CompanyStatus[] = ["pursue", "applied", "watch", "network", "exclude"];

const ALL_STATUSES: CompanyStatus[] = ["pursue", "watch", "network", "applied", "exclude"];

function StatusBadge({ status }: { status: CompanyStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${meta.color}`}>
      {meta.label}
    </span>
  );
}

function AddCompanyModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<CompanyStatus>("watch");
  const [why, setWhy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, status, why: why || null, notes: notes || null }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error ?? `HTTP ${res.status}`);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add Company</h2>
        </div>
        <form onSubmit={submit} className="px-6 py-4 space-y-4">
          {error && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CompanyStatus)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_META[s].label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Why interesting</label>
            <input
              value={why}
              onChange={(e) => setWhy(e.target.value)}
              placeholder="Mission, platform fit, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes / current status</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Open roles, outreach status, etc."
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Saving…" : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyCard({
  company,
  onChanged,
}: {
  company: Company;
  onChanged: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editWhy, setEditWhy] = useState(company.why ?? "");
  const [editNotes, setEditNotes] = useState(company.notes ?? "");
  const [editStatus, setEditStatus] = useState<CompanyStatus>(company.status);
  const [saving, setSaving] = useState(false);

  async function loadDetail() {
    if (detail) return;
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`);
      if (res.ok) setDetail(await res.json());
    } finally {
      setLoadingDetail(false);
    }
  }

  function handleToggle() {
    if (!expanded) loadDetail();
    setExpanded((v) => !v);
  }

  async function saveEdits() {
    setSaving(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, why: editWhy, notes: editNotes }),
      });
      if (res.ok) {
        setEditing(false);
        setDetail(null); // force reload
        onChanged();
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteCompany() {
    if (!confirm(`Remove ${company.name} from tracking?`)) return;
    await fetch(`/api/companies/${company.id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div
        className="px-5 py-4 flex items-start justify-between gap-4 cursor-pointer select-none"
        onClick={handleToggle}
      >
        <div className="flex items-center gap-3 min-w-0">
          <svg
            className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${expanded ? "rotate-90" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <div className="font-semibold text-gray-900">{company.name}</div>
            {company.why && (
              <div className="text-sm text-gray-500 truncate">{company.why}</div>
            )}
          </div>
        </div>
        <StatusBadge status={company.status} />
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 py-4 space-y-4">
          {editing ? (
            <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CompanyStatus)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_META[s].label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Why interesting</label>
                <input
                  value={editWhy}
                  onChange={(e) => setEditWhy(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <input
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={saveEdits}
                  disabled={saving}
                  className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {company.notes && (
                <p className="text-sm text-gray-700">{company.notes}</p>
              )}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditing(true); }}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteCompany(); }}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          {loadingDetail && (
            <div className="text-sm text-gray-400">Loading jobs &amp; candidates…</div>
          )}

          {detail && (detail.jobs.length > 0 || detail.candidates.length > 0) && (
            <div className="space-y-3 pt-1 border-t border-gray-100">
              {detail.jobs.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Jobs ({detail.jobs.length})
                  </div>
                  <ul className="space-y-1">
                    {detail.jobs.map((j) => (
                      <li key={j.id} className="flex items-center justify-between text-sm">
                        <a href={`/jobs/${j.id}`} className="text-blue-600 hover:text-blue-800 truncate">
                          {j.title}
                        </a>
                        <span className="ml-3 shrink-0 text-gray-400 text-xs">
                          {j.status}{j.matchScore != null ? ` · ${j.matchScore}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.candidates.length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Candidates ({detail.candidates.length})
                  </div>
                  <ul className="space-y-1">
                    {detail.candidates.map((c) => (
                      <li key={c.id} className="flex items-center justify-between text-sm">
                        <span className="text-gray-700 truncate">{c.title}</span>
                        <span className="ml-3 shrink-0 text-gray-400 text-xs">
                          {c.status}{c.matchScore != null ? ` · ${c.matchScore}` : ""}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {detail && detail.jobs.length === 0 && detail.candidates.length === 0 && (
            <p className="text-sm text-gray-400">No jobs or candidates tracked yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [filterStatus, setFilterStatus] = useState<CompanyStatus | "">("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/companies");
      if (res.ok) setCompanies(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = filterStatus
    ? companies.filter((c) => c.status === filterStatus)
    : companies;

  const grouped = STATUS_ORDER.reduce<Record<string, Company[]>>((acc, s) => {
    const group = filtered.filter((c) => c.status === s);
    if (group.length > 0) acc[s] = group;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Companies" />

      {showAdd && (
        <AddCompanyModal
          onClose={() => setShowAdd(false)}
          onSaved={load}
        />
      )}

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6 flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter:</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CompanyStatus | "")}
            className="rounded-md border-gray-300 text-sm"
          >
            <option value="">All</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_META[s].label}</option>
            ))}
          </select>
          <span className="text-sm text-gray-400">{filtered.length} companies</span>
          <button
            onClick={() => setShowAdd(true)}
            className="ml-auto px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
          >
            + Add Company
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600" />
            <p className="mt-2 text-gray-500">Loading…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow text-gray-500">
            No companies tracked yet.{" "}
            <button onClick={() => setShowAdd(true)} className="text-blue-600 hover:text-blue-800">
              Add one
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([status, group]) => (
              <section key={status}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
                  {STATUS_META[status as CompanyStatus].label}
                </h2>
                <div className="space-y-3">
                  {group.map((company) => (
                    <CompanyCard key={company.id} company={company} onChanged={load} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
