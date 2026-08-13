"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import { Guest, Room, RoomStatus } from "@/lib/mockData";
import { cn, dateFromOffset, formatMonthDay, roomStatusStyles } from "@/lib/utils";

const FILTERS: (RoomStatus | "All")[] = ["All", "Available", "Occupied", "Dirty", "Maintenance", "Reserved"];

export function RoomGrid({
  rooms,
  guests,
  searchQuery,
  onUpdateRoom,
  notify,
}: {
  rooms: Room[];
  guests: Guest[];
  searchQuery: string;
  onUpdateRoom: (roomId: string, patch: Partial<Room>) => void;
  notify: (message: string) => void;
}) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [historyRoom, setHistoryRoom] = useState<Room | null>(null);
  const query = searchQuery.trim().toLowerCase();

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      const matchesFilter = filter === "All" || room.status === filter;
      const matchesQuery =
        query.length === 0 ||
        room.number.toLowerCase().includes(query) ||
        room.type.toLowerCase().includes(query) ||
        (room.currentGuest ?? "").toLowerCase().includes(query);
      return matchesFilter && matchesQuery;
    });
  }, [rooms, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: rooms.length };
    for (const room of rooms) c[room.status] = (c[room.status] ?? 0) + 1;
    return c;
  }, [rooms]);

  function markClean(room: Room) {
    onUpdateRoom(room.id, { status: "Available", cleaningStatus: "Clean" });
    notify(`Room ${room.number} marked clean and available.`);
  }

  function blockRoom(room: Room) {
    onUpdateRoom(room.id, { status: "Maintenance", cleaningStatus: "In Progress" });
    notify(`Room ${room.number} blocked for maintenance.`);
  }

  function assignGuest(room: Room) {
    onUpdateRoom(room.id, { status: "Reserved", nextArrivalOffset: 0 });
    notify(`Room ${room.number} marked reserved. A full guest picker would open here in production.`);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        This is the first step toward replacing manual room tracking and reducing double-booking risk.
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-semibold transition",
              filter === f
                ? "bg-gold text-deep-navy"
                : "bg-navy/70 text-cream/60 ring-1 ring-white/10 hover:bg-white/5"
            )}
          >
            {f}
            <span className="ml-1.5 text-[10px] opacity-70">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredRooms.map((room) => {
          const styles = roomStatusStyles[room.status];
          return (
            <div
              key={room.id}
              className="flex flex-col rounded-xl2 border border-white/5 bg-navy/70 p-4 shadow-card transition hover:-translate-y-0.5 hover:border-gold/25"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-cream">{room.number}</p>
                  <p className="text-xs text-cream/45">{room.type}</p>
                </div>
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold", styles.bg, styles.text, styles.border)}>
                  <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
                  {room.status}
                </span>
              </div>

              <div className="mt-3 space-y-1.5 text-xs text-cream/60">
                {room.currentGuest && (
                  <p className="flex items-center gap-1.5">
                    <Icon name="users" className="h-3.5 w-3.5 text-teal" />
                    {room.currentGuest}
                  </p>
                )}
                {typeof room.nextArrivalOffset === "number" && (
                  <p className="flex items-center gap-1.5">
                    <Icon name="calendar-plus" className="h-3.5 w-3.5 text-gold" />
                    Next arrival {room.nextArrivalOffset === 0 ? "today" : formatMonthDay(dateFromOffset(room.nextArrivalOffset))}
                  </p>
                )}
                <p className="flex items-center gap-1.5">
                  <Icon name="sparkles" className="h-3.5 w-3.5 text-cream/40" />
                  Cleaning: {room.cleaningStatus}
                </p>
                {room.floorNote && (
                  <p className="flex items-start gap-1.5 text-coral/90">
                    <Icon name="alert" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {room.floorNote}
                  </p>
                )}
              </div>

              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-lg font-semibold text-gold">${room.rateTonight}</span>
                <span className="text-[11px] text-cream/40">/ night</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
                <button
                  disabled={room.status !== "Dirty"}
                  onClick={() => markClean(room)}
                  className="rounded-md bg-tropical-green/15 px-2 py-1.5 text-tropical-green ring-1 ring-tropical-green/30 transition hover:bg-tropical-green/25 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Mark Clean
                </button>
                <button
                  disabled={room.status === "Maintenance"}
                  onClick={() => blockRoom(room)}
                  className="rounded-md bg-coral/15 px-2 py-1.5 text-coral ring-1 ring-coral/30 transition hover:bg-coral/25 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Block Room
                </button>
                <button
                  disabled={room.status === "Occupied" || room.status === "Maintenance"}
                  onClick={() => assignGuest(room)}
                  className="rounded-md bg-teal/15 px-2 py-1.5 text-teal ring-1 ring-teal/30 transition hover:bg-teal/25 disabled:cursor-not-allowed disabled:opacity-30"
                >
                  Assign Guest
                </button>
                <button
                  onClick={() => setHistoryRoom(room)}
                  className="rounded-md bg-white/5 px-2 py-1.5 text-cream/70 ring-1 ring-white/10 transition hover:bg-white/10"
                >
                  View History
                </button>
              </div>
            </div>
          );
        })}
        {filteredRooms.length === 0 && (
          <p className="col-span-full rounded-xl2 border border-dashed border-white/10 bg-navy/40 px-4 py-10 text-center text-sm text-cream/45">
            No rooms match this filter or search.
          </p>
        )}
      </div>

      {historyRoom && <RoomHistoryModal room={historyRoom} guests={guests} onClose={() => setHistoryRoom(null)} />}
    </div>
  );
}

function RoomHistoryModal({ room, guests, onClose }: { room: Room; guests: Guest[]; onClose: () => void }) {
  const stays = guests
    .flatMap((g) => g.stayHistory.map((s) => ({ ...s, guestName: g.name })))
    .filter((s) => s.room === room.number)
    .sort((a, b) => a.dateOffset - b.dateOffset);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close room history" onClick={onClose} className="absolute inset-0 bg-deep-navy/70 backdrop-blur-sm" />
      <div className="relative w-full max-w-md rounded-xl2 border border-white/10 bg-navy p-6 shadow-panel animate-fadeIn">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Room History</p>
            <h3 className="mt-1 text-lg font-semibold text-cream">{room.number}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-cream/50 hover:bg-white/5 hover:text-cream">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {stays.length === 0 && (
            <p className="rounded-lg bg-deep-navy/60 p-3 text-sm text-cream/55">No recorded stay history for this room yet.</p>
          )}
          {stays.map((s, i) => (
            <div key={i} className="flex items-center justify-between rounded-lg bg-deep-navy/60 px-3 py-2.5 text-sm">
              <div>
                <p className="font-medium text-cream">{s.guestName}</p>
                <p className="text-xs text-cream/45">{formatMonthDay(dateFromOffset(s.dateOffset))} · {s.nights} nights</p>
              </div>
              <Icon name="history" className="h-4 w-4 text-cream/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
