"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StatusBadge, StatusSelect } from "@/components/StatusBadge";

type Message = {
  id: string;
  body: string;
  sentAt: string | null;
  createdAt: string;
  template: { name: string } | null;
};

type Template = { id: string; name: string; body: string };

type Contact = {
  id: string;
  name: string;
  company: string | null;
  role: string | null;
  linkedinUrl: string | null;
  email: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  messages: Message[];
};

export default function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Contact>>({});

  // Message compose state
  const [msgBody, setMsgBody] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [genTone, setGenTone] = useState("professional and friendly");
  const [genGoal, setGenGoal] = useState("establish a connection and explore potential collaboration");

  const loadContact = () =>
    fetch(`/api/contacts/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setContact(data);
        setEditForm(data);
        setLoading(false);
      });

  useEffect(() => {
    loadContact();
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, [id]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const t = templates.find((t) => t.id === templateId);
    if (t) setMsgBody(t.body);
  };

  const handleGenerateAI = async () => {
    if (!contact) return;
    setGenerating(true);
    const tpl = templates.find((t) => t.id === selectedTemplate);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contact: { name: contact.name, company: contact.company, role: contact.role, notes: contact.notes },
        template: tpl,
        tone: genTone,
        goal: genGoal,
      }),
    });
    const data = await res.json();
    if (data.message) setMsgBody(data.message);
    setGenerating(false);
  };

  const handleSendMessage = async () => {
    if (!msgBody.trim() || !contact) return;
    setSendingMsg(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: msgBody,
        contactId: contact.id,
        templateId: selectedTemplate || null,
        sentAt: new Date().toISOString(),
      }),
    });
    setMsgBody("");
    setSelectedTemplate("");
    setSendingMsg(false);
    loadContact();
  };

  const handleSaveEdit = async () => {
    if (!contact) return;
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    setEditing(false);
    loadContact();
  };

  const handleStatusChange = async (status: string) => {
    if (!contact) return;
    await fetch(`/api/contacts/${contact.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadContact();
  };

  const handleDelete = async () => {
    if (!contact || !confirm(`Delete ${contact.name}?`)) return;
    await fetch(`/api/contacts/${contact.id}`, { method: "DELETE" });
    router.push("/contacts");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!contact) {
    return <div className="text-center py-16 text-gray-500">Contact not found.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link href="/contacts" className="text-sm text-blue-600 hover:underline mb-2 block">
            ← Back to Contacts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{contact.name}</h1>
          {contact.role && <p className="text-gray-600">{contact.role}{contact.company && ` at ${contact.company}`}</p>}
        </div>
        <div className="flex items-center gap-2">
          <StatusSelect value={contact.status} onChange={handleStatusChange} />
          <button
            onClick={() => setEditing(true)}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="px-3 py-1.5 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Contact info + compose */}
        <div className="col-span-2 space-y-5">
          {/* Contact details */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">Contact Details</h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Status</dt>
                <dd className="mt-0.5"><StatusBadge status={contact.status} /></dd>
              </div>
              {contact.email && (
                <div>
                  <dt className="text-gray-500">Email</dt>
                  <dd className="mt-0.5 font-medium">{contact.email}</dd>
                </div>
              )}
              {contact.linkedinUrl && (
                <div className="col-span-2">
                  <dt className="text-gray-500">LinkedIn</dt>
                  <dd className="mt-0.5">
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate block"
                    >
                      {contact.linkedinUrl}
                    </a>
                  </dd>
                </div>
              )}
              {contact.notes && (
                <div className="col-span-2">
                  <dt className="text-gray-500">Notes</dt>
                  <dd className="mt-0.5 text-gray-700 whitespace-pre-wrap">{contact.notes}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Compose message */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-4">Compose Message</h2>

            <div className="space-y-3">
              {/* Template picker */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Template (optional)</label>
                <select
                  value={selectedTemplate}
                  onChange={(e) => handleTemplateSelect(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* AI Generation */}
              <div className="border border-blue-100 bg-blue-50 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-blue-700">AI Message Generation</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tone</label>
                    <input
                      value={genTone}
                      onChange={(e) => setGenTone(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Goal</label>
                    <input
                      value={genGoal}
                      onChange={(e) => setGenGoal(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleGenerateAI}
                  disabled={generating}
                  className="w-full bg-blue-600 text-white py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {generating ? (
                    <>
                      <span className="animate-spin rounded-full h-3 w-3 border-b border-white" />
                      Generating…
                    </>
                  ) : (
                    "Generate with AI"
                  )}
                </button>
              </div>

              {/* Message textarea */}
              <textarea
                rows={6}
                value={msgBody}
                onChange={(e) => setMsgBody(e.target.value)}
                placeholder="Write your outreach message here, or generate one with AI above…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{msgBody.length} characters</span>
                <button
                  onClick={handleSendMessage}
                  disabled={sendingMsg || !msgBody.trim()}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {sendingMsg ? "Saving…" : "Log Message"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Message history */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-800 mb-3">
              Message History ({contact.messages.length})
            </h2>
            {contact.messages.length === 0 ? (
              <p className="text-sm text-gray-400">No messages yet.</p>
            ) : (
              <div className="space-y-3">
                {contact.messages.map((m) => (
                  <div key={m.id} className="bg-gray-50 rounded-lg p-3">
                    {m.template && (
                      <p className="text-xs text-blue-600 font-medium mb-1">{m.template.name}</p>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{m.body}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {m.sentAt
                        ? `Sent ${new Date(m.sentAt).toLocaleDateString()}`
                        : `Logged ${new Date(m.createdAt).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Edit Contact</h2>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    required
                    value={editForm.name ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
                  <input
                    value={editForm.company ?? ""}
                    onChange={(e) => setEditForm({ ...editForm, company: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <input
                  value={editForm.role ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn URL</label>
                <input
                  value={editForm.linkedinUrl ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, linkedinUrl: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input
                  value={editForm.email ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes ?? ""}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
