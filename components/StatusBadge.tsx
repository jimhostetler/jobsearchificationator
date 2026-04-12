"use client";

import { JobStatus } from "@prisma/client";

const statusColors: Record<JobStatus, string> = {
  viewed: "bg-gray-100 text-gray-800",
  applied: "bg-blue-100 text-blue-800",
  interviewed: "bg-purple-100 text-purple-800",
  rejected: "bg-red-100 text-red-800",
  cancelled: "bg-yellow-100 text-yellow-800",
};

const statusLabels: Record<JobStatus, string> = {
  viewed: "Viewed",
  applied: "Applied",
  interviewed: "Interviewed",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

interface StatusBadgeProps {
  status: JobStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}

interface StatusSelectProps {
  status: JobStatus;
  onChange: (status: JobStatus) => void;
  disabled?: boolean;
}

export function StatusSelect({ status, onChange, disabled }: StatusSelectProps) {
  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value as JobStatus)}
      disabled={disabled}
      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
    >
      {Object.entries(statusLabels).map(([value, label]) => (
        <option key={value} value={value}>
          {label}
        </option>
      ))}
    </select>
  );
}
