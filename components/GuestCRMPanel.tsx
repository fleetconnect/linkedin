"use client";

import { Icon } from "./Icon";
import { Guest } from "@/lib/mockData";
import { cn, dateFromOffset, followUpStatusStyles, formatMonthDay, initials } from "@/lib/utils";

export function GuestCRMPanel({
  guest,
  onClose,
  notify,
  onScheduleFollowUp,
  onCompleteFollowUp,
}: {
  guest: Guest;
  onClose: () => void;
  notify: (message: string) => void;
  onScheduleFollowUp: (guestId: string) => void;
  onCompleteFollowUp: (guestId: string) => void;
}) {
  const fStyles = followUpStatusStyles[guest.followUpStatus];
  const template = `Hi ${guest.name.split(" ")[0]}! This is Hotel Kaoba \u{1F334} Thank you for staying with us — we'd love to welcome you back soon. Let us know if we can help plan your next trip to Cabarete!`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close guest profile" onClick={onClose} className="absolute inset-0 bg-deep-navy/70 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-y-auto border-l border-gold/20 bg-navy shadow-panel animate-slideIn">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-sm font-semibold text-gold ring-1 ring-gold/30">
              {initials(guest.name)}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-cream/45">Guest Profile</p>
              <h3 className="text-lg font-semibold text-cream">{guest.name}</h3>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-cream/50 hover:bg-white/5 hover:text-cream">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 px-6 py-5">
          <div className="flex flex-wrap gap-1.5">
            {guest.tags.length === 0 && <span className="text-xs text-cream/40">No tags yet</span>}
            {guest.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-teal/15 px-2.5 py-1 text-[11px] font-semibold text-teal ring-1 ring-teal/30">
                {tag}
              </span>
            ))}
            <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", fStyles.bg, fStyles.text)}>
              Follow-up: {guest.followUpStatus}
            </span>
          </div>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div className="col-span-2 flex items-center gap-2">
              <Icon name="phone" className="h-4 w-4 text-cream/40" />
              <dd className="text-cream/80">{guest.phone}</dd>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <Icon name="mail" className="h-4 w-4 text-cream/40" />
              <dd className="text-cream/80">{guest.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-cream/45">Country</dt>
              <dd className="mt-1 font-medium text-cream">{guest.country}</dd>
            </div>
            <div>
              <dt className="text-xs text-cream/45">Source</dt>
              <dd className="mt-1 font-medium text-cream">{guest.source}</dd>
            </div>
            <div>
              <dt className="text-xs text-cream/45">Last Stay</dt>
              <dd className="mt-1 font-medium text-cream">{formatMonthDay(dateFromOffset(guest.lastStayOffset))}</dd>
            </div>
            <div>
              <dt className="text-xs text-cream/45">Total Stays</dt>
              <dd className="mt-1 font-medium text-cream">{guest.totalStays}</dd>
            </div>
          </dl>

          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Stay History</p>
            <div className="mt-2 space-y-2">
              {guest.stayHistory
                .slice()
                .reverse()
                .map((s, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-deep-navy/60 px-3 py-2 text-sm">
                    <span className="text-cream/75">{s.room}</span>
                    <span className="text-xs text-cream/45">
                      {formatMonthDay(dateFromOffset(s.dateOffset))} · {s.nights}n
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Preferences</p>
            <p className="mt-1.5 rounded-lg bg-deep-navy/60 p-3 text-sm leading-relaxed text-cream/75">{guest.preferences}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Notes</p>
            <p className="mt-1.5 rounded-lg bg-deep-navy/60 p-3 text-sm leading-relaxed text-cream/75">{guest.notes}</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">WhatsApp Message Template</p>
            <p className="mt-1.5 rounded-lg bg-tropical-green/10 p-3 text-sm leading-relaxed text-cream/70 ring-1 ring-tropical-green/20">
              {template}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-6 py-5">
          <button
            onClick={() => notify(`WhatsApp message sent to ${guest.name} (simulated).`)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-tropical-green px-3 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            Send WhatsApp
          </button>
          <button
            onClick={() => notify(`Reservation draft started for ${guest.name}. Full booking flow would open here.`)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-teal/20 px-3 py-2.5 text-sm font-semibold text-teal ring-1 ring-teal/40 transition hover:bg-teal/30"
          >
            <Icon name="calendar-plus" className="h-4 w-4" />
            Create Reservation
          </button>
          <button
            onClick={() => notify(`Note added to ${guest.name}'s profile.`)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <Icon name="note" className="h-4 w-4" />
            Add Note
          </button>
          {guest.followUpStatus === "Scheduled" || guest.followUpStatus === "Completed" ? (
            <button
              onClick={() => onCompleteFollowUp(guest.id)}
              disabled={guest.followUpStatus === "Completed"}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-gold/15 px-3 py-2.5 text-sm font-semibold text-gold ring-1 ring-gold/40 transition hover:bg-gold/25 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Icon name="check" className="h-4 w-4" />
              {guest.followUpStatus === "Completed" ? "Completed" : "Mark Completed"}
            </button>
          ) : (
            <button
              onClick={() => onScheduleFollowUp(guest.id)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-gold/15 px-3 py-2.5 text-sm font-semibold text-gold ring-1 ring-gold/40 transition hover:bg-gold/25"
            >
              <Icon name="calendar" className="h-4 w-4" />
              Schedule Follow-Up
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
