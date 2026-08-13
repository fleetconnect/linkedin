"use client";

import { useMemo } from "react";
import { Icon } from "./Icon";
import { GuestCRMPanel } from "./GuestCRMPanel";
import { Guest } from "@/lib/mockData";
import { cn, dateFromOffset, followUpStatusStyles, formatMonthDay, initials } from "@/lib/utils";

export function GuestTable({
  guests,
  searchQuery,
  selectedGuestId,
  onSelectGuest,
  notify,
  onScheduleFollowUp,
  onCompleteFollowUp,
}: {
  guests: Guest[];
  searchQuery: string;
  selectedGuestId: string | null;
  onSelectGuest: (id: string | null) => void;
  notify: (message: string) => void;
  onScheduleFollowUp: (guestId: string) => void;
  onCompleteFollowUp: (guestId: string) => void;
}) {
  const query = searchQuery.trim().toLowerCase();

  const filteredGuests = useMemo(() => {
    if (!query) return guests;
    return guests.filter((g) =>
      [g.name, g.country, g.phone, g.email, ...g.tags].join(" ").toLowerCase().includes(query)
    );
  }, [guests, query]);

  const queue = useMemo(() => {
    return {
      checkedOutYesterday: guests.filter((g) => g.lastStayOffset === -1),
      unpaidBalances: guests.filter((g) => g.notes.toLowerCase().includes("balance")),
      reEngage: guests.filter((g) => g.lastStayOffset <= -300),
      influencerCandidates: guests.filter((g) => g.tags.includes("Influencer") || g.notes.toLowerCase().includes("residency")),
      longStayProspects: guests.filter(
        (g) => g.tags.includes("Long-Term Stay") || g.notes.toLowerCase().includes("long-stay") || g.notes.toLowerCase().includes("monthly rate")
      ),
    };
  }, [guests]);

  const selectedGuest = guests.find((g) => g.id === selectedGuestId) ?? null;

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto rounded-xl2 border border-white/5 bg-navy/60 shadow-card">
        <table className="w-full min-w-[860px] text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-cream/45">
              <th className="px-4 py-3 font-semibold">Guest</th>
              <th className="px-4 py-3 font-semibold">Country</th>
              <th className="px-4 py-3 font-semibold">Contact</th>
              <th className="px-4 py-3 font-semibold">Last Stay</th>
              <th className="px-4 py-3 font-semibold">Stays</th>
              <th className="px-4 py-3 font-semibold">Source</th>
              <th className="px-4 py-3 font-semibold">Tags</th>
              <th className="px-4 py-3 font-semibold">Follow-Up</th>
            </tr>
          </thead>
          <tbody>
            {filteredGuests.map((guest) => {
              const fStyles = followUpStatusStyles[guest.followUpStatus];
              return (
                <tr
                  key={guest.id}
                  tabIndex={0}
                  onClick={() => onSelectGuest(guest.id)}
                  onKeyDown={(e) => (e.key === "Enter" ? onSelectGuest(guest.id) : undefined)}
                  className="cursor-pointer border-b border-white/5 transition hover:bg-white/5 focus:bg-white/5"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold ring-1 ring-gold/30">
                        {initials(guest.name)}
                      </div>
                      <span className="font-medium text-cream">{guest.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-cream/65">{guest.country}</td>
                  <td className="px-4 py-3 text-cream/55">
                    <p>{guest.phone}</p>
                    <p className="text-xs text-cream/40">{guest.email}</p>
                  </td>
                  <td className="px-4 py-3 text-cream/65">{formatMonthDay(dateFromOffset(guest.lastStayOffset))}</td>
                  <td className="px-4 py-3 text-cream/65">{guest.totalStays}</td>
                  <td className="px-4 py-3 text-cream/65">{guest.source}</td>
                  <td className="px-4 py-3">
                    <div className="flex max-w-[220px] flex-wrap gap-1">
                      {guest.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-full bg-teal/15 px-2 py-0.5 text-[10px] font-semibold text-teal">
                          {tag}
                        </span>
                      ))}
                      {guest.tags.length > 2 && (
                        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-cream/50">
                          +{guest.tags.length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", fStyles.bg, fStyles.text)}>
                      {guest.followUpStatus}
                    </span>
                  </td>
                </tr>
              );
            })}
            {filteredGuests.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-cream/45">
                  No guests match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Follow-Up Queue</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <QueueCard
            title="Checked Out Yesterday"
            icon="check-in"
            guests={queue.checkedOutYesterday}
            onSelect={onSelectGuest}
            emptyText="No checkouts to review."
          />
          <QueueCard
            title="Unpaid Balances"
            icon="dollar"
            guests={queue.unpaidBalances}
            onSelect={onSelectGuest}
            emptyText="No unpaid balances flagged."
          />
          <QueueCard
            title="Past Guests to Re-Engage"
            icon="history"
            guests={queue.reEngage}
            onSelect={onSelectGuest}
            emptyText="No lapsed guests to re-engage."
          />
          <QueueCard
            title="Influencer Residency Candidates"
            icon="sparkles"
            guests={queue.influencerCandidates}
            onSelect={onSelectGuest}
            emptyText="No active candidates."
          />
          <QueueCard
            title="Long-Stay Prospects"
            icon="tag"
            guests={queue.longStayProspects}
            onSelect={onSelectGuest}
            emptyText="No long-stay prospects yet."
          />
        </div>
      </div>

      {selectedGuest && (
        <GuestCRMPanel
          guest={selectedGuest}
          onClose={() => onSelectGuest(null)}
          notify={notify}
          onScheduleFollowUp={onScheduleFollowUp}
          onCompleteFollowUp={onCompleteFollowUp}
        />
      )}
    </div>
  );
}

function QueueCard({
  title,
  icon,
  guests,
  onSelect,
  emptyText,
}: {
  title: string;
  icon: Parameters<typeof Icon>[0]["name"];
  guests: Guest[];
  onSelect: (id: string) => void;
  emptyText: string;
}) {
  return (
    <div className="rounded-xl2 border border-white/5 bg-navy/60 p-4 shadow-card">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-cream/55">
        <Icon name={icon} className="h-4 w-4 text-gold" />
        {title}
        <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-cream/50">{guests.length}</span>
      </p>
      <div className="mt-3 space-y-1.5">
        {guests.length === 0 && <p className="text-xs text-cream/40">{emptyText}</p>}
        {guests.map((g) => (
          <button
            key={g.id}
            onClick={() => onSelect(g.id)}
            className="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-sm text-cream/75 transition hover:bg-white/5"
          >
            {g.name}
            <Icon name="chevron-right" className="h-3.5 w-3.5 text-cream/30" />
          </button>
        ))}
      </div>
    </div>
  );
}
