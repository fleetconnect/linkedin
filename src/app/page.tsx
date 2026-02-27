"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";

type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  status: string;
  updatedAt: string;
};

const PIPELINE_STATUSES = ["not_contacted", "sent", "replied", "connected", "meeting"];

const STATUS_LABELS: Record<string, string> = {
  not_contacted: "Not Contacted",
  sent: "Sent",
  replied: "Replied",
  connected: "Connected",
  meeting: "Meeting",
  closed: "Closed",
};

export default function DashboardPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        setContacts(data);
        setLoading(false);
      });
  }, []);

  const byStatus = PIPELINE_STATUSES.reduce<Record<string, Contact[]>>((acc, s) => {
    acc[s] = contacts.filter((c) => c.status === s);
    return acc;
  }, {});

  const total = contacts.length;
  const sentCount = contacts.filter((c) => c.status !== "not_contacted").length;
  const replied = contacts.filter((c) => ["replied", "connected", "meeting"].includes(c.status)).length;
  const replyRate = sentCount > 0 ? Math.round((replied / sentCount) * 100) : 0;
  const meetings = contacts.filter((c) => c.status === "meeting").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <Link
          href="/contacts?new=true"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          + Add Contact
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Contacts" value={total} valueColor="text-blue-700" />
        <StatCard label="Reply Rate" value={`${replyRate}%`} valueColor="text-green-700" />
        <StatCard label="Meetings Booked" value={meetings} valueColor="text-purple-700" />
      </div>

      {/* Pipeline */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Outreach Pipeline</h2>
        <div className="grid grid-cols-5 gap-3">
          {PIPELINE_STATUSES.map((status) => (
            <PipelineColumn
              key={status}
              status={status}
              label={STATUS_LABELS[status]}
              contacts={byStatus[status] ?? []}
            />
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Contacts</h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {contacts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-3">No contacts yet.</p>
              <Link href="/contacts?new=true" className="text-blue-600 hover:underline text-sm">
                Add your first contact
              </Link>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Company</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                  <th className="text-left px-4 py-3 text-gray-600 font-medium">Last Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contacts.slice(0, 5).map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.company ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/contacts/${c.id}`} className="text-blue-600 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {contacts.length > 5 && (
          <div className="mt-3 text-center">
            <Link href="/contacts" className="text-sm text-blue-600 hover:underline">
              View all {contacts.length} contacts →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  valueColor,
}: {
  label: string;
  value: string | number;
  valueColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    </div>
  );
}

function PipelineColumn({
  label,
  contacts,
}: {
  status: string;
  label: string;
  contacts: Contact[];
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide truncate">
          {label}
        </span>
        <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full ml-1 shrink-0">
          {contacts.length}
        </span>
      </div>
      <div className="space-y-2">
        {contacts.slice(0, 4).map((c) => (
          <Link
            key={c.id}
            href={`/contacts/${c.id}`}
            className="block p-2 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors"
          >
            <p className="text-xs font-medium text-gray-900 truncate">{c.name}</p>
            {c.company && (
              <p className="text-xs text-gray-500 truncate">{c.company}</p>
            )}
          </Link>
        ))}
        {contacts.length > 4 && (
          <p className="text-xs text-gray-400 text-center">+{contacts.length - 4} more</p>
        )}
        {contacts.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-2">Empty</p>
        )}
      </div>
    </div>
  );
}
