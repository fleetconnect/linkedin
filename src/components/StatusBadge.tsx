"use client";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_contacted: { label: "Not Contacted", color: "bg-gray-100 text-gray-700" },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-700" },
  replied: { label: "Replied", color: "bg-yellow-100 text-yellow-700" },
  connected: { label: "Connected", color: "bg-green-100 text-green-700" },
  meeting: { label: "Meeting", color: "bg-purple-100 text-purple-700" },
  closed: { label: "Closed", color: "bg-red-100 text-red-700" },
};

export const STATUSES = Object.keys(STATUS_CONFIG);

export function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, color: "bg-gray-100 text-gray-700" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}

export function StatusSelect({
  value,
  onChange,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {STATUS_CONFIG[s].label}
        </option>
      ))}
    </select>
  );
}
