"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import {
  Reservation,
  ReservationStatus,
  Room,
  RoomType,
} from "@/lib/mockData";
import {
  cn,
  dateFromOffset,
  formatDateShort,
  formatMonthDay,
  getDateWindow,
  paymentStatusStyles,
  reservationStatusStyles,
} from "@/lib/utils";

const ROOM_TYPE_ORDER: RoomType[] = ["Bungalow", "Standard Room", "Poolside Room", "Suite"];
const WINDOW_DAYS = 7;

export function ReservationCalendar({
  rooms,
  reservations,
  searchQuery,
  onCheckIn,
  onAddNote,
  onSendWhatsApp,
  onViewGuestProfile,
}: {
  rooms: Room[];
  reservations: Reservation[];
  searchQuery: string;
  onCheckIn: (reservationId: string) => void;
  onAddNote: (reservationId: string) => void;
  onSendWhatsApp: (guestName: string) => void;
  onViewGuestProfile: (guestId: string | undefined, guestName: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const days = useMemo(() => getDateWindow(WINDOW_DAYS), []);
  const query = searchQuery.trim().toLowerCase();

  const roomsByType = useMemo(() => {
    const groups: Record<string, Room[]> = {};
    for (const type of ROOM_TYPE_ORDER) groups[type] = [];
    for (const room of rooms) groups[room.type]?.push(room);
    return groups;
  }, [rooms]);

  const reservationsByRoom = useMemo(() => {
    const map: Record<string, Reservation[]> = {};
    for (const res of reservations) {
      if (!map[res.roomId]) map[res.roomId] = [];
      map[res.roomId].push(res);
    }
    return map;
  }, [reservations]);

  const selected = reservations.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        Calendar MVP shows how Hotel Kaoba can view rooms, guests, holds, and blocks in one operational screen.
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-cream/60">
        {(Object.keys(reservationStatusStyles) as ReservationStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", reservationStatusStyles[status].dot)} />
            {status}
          </span>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl2 border border-white/5 bg-navy/60 shadow-card">
        <div className="min-w-[920px]">
          {/* Header row */}
          <div
            className="grid border-b border-white/10 bg-deep-navy/80"
            style={{ gridTemplateColumns: "160px repeat(7, minmax(112px,1fr))" }}
          >
            <div className="sticky left-0 z-20 flex items-center bg-deep-navy/95 px-3 py-3 text-xs font-semibold uppercase tracking-wide text-cream/50">
              Room
            </div>
            {days.map((d, i) => (
              <div
                key={i}
                className={cn(
                  "flex flex-col items-center justify-center border-l border-white/5 px-2 py-3 text-center",
                  i === 0 && "bg-gold/5"
                )}
              >
                <span className="text-[11px] font-semibold uppercase tracking-wide text-gold/80">
                  {i === 0 ? "Today" : formatDateShort(d).split(",")[0]}
                </span>
                <span className="text-xs text-cream/50">{formatMonthDay(d)}</span>
              </div>
            ))}
          </div>

          {/* Room rows grouped by type */}
          {ROOM_TYPE_ORDER.map((type) => {
            const typeRooms = roomsByType[type] ?? [];
            if (typeRooms.length === 0) return null;
            return (
              <div key={type}>
                <div className="sticky left-0 z-10 border-b border-white/5 bg-teal/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-teal">
                  {type}
                </div>
                {typeRooms.map((room) => {
                  const roomReservations = reservationsByRoom[room.id] ?? [];
                  return (
                    <div
                      key={room.id}
                      className="grid border-b border-white/5"
                      style={{ gridTemplateColumns: "160px repeat(7, minmax(112px,1fr))" }}
                    >
                      <div className="sticky left-0 z-10 flex items-center gap-2 bg-navy/60 px-3 py-2.5 text-sm text-cream/80">
                        {room.number}
                      </div>
                      <div className="relative col-span-7 grid grid-cols-7 gap-1 p-1">
                        {days.map((_, i) => (
                          <div key={i} className="h-12 rounded-md border border-dashed border-white/5" />
                        ))}
                        {roomReservations.map((res) => {
                          const clampedStart = Math.max(res.startOffset, 0);
                          const clampedEnd = Math.min(res.endOffset, WINDOW_DAYS);
                          if (clampedEnd <= clampedStart) return null;
                          const styles = reservationStatusStyles[res.status];
                          const matches =
                            query.length === 0 ||
                            res.guestName.toLowerCase().includes(query) ||
                            res.roomNumber.toLowerCase().includes(query);
                          return (
                            <button
                              key={res.id}
                              onClick={() => setSelectedId(res.id)}
                              title={`${res.guestName} — ${res.status}`}
                              style={{
                                gridColumn: `${clampedStart + 1} / ${clampedEnd + 1}`,
                                gridRow: 1,
                              }}
                              className={cn(
                                "absolute inset-y-1 z-0 flex cursor-grab items-center gap-1.5 truncate rounded-md border px-2 text-left text-xs font-medium transition hover:-translate-y-0.5 hover:shadow-card active:cursor-grabbing",
                                styles.bg,
                                styles.text,
                                styles.border,
                                query.length > 0 && !matches && "opacity-25"
                              )}
                            >
                              <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", styles.dot)} />
                              <span className="truncate">{res.guestName}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <ReservationDetailPanel
          reservation={selected}
          onClose={() => setSelectedId(null)}
          onCheckIn={onCheckIn}
          onAddNote={onAddNote}
          onSendWhatsApp={onSendWhatsApp}
          onViewGuestProfile={onViewGuestProfile}
        />
      )}
    </div>
  );
}

function ReservationDetailPanel({
  reservation,
  onClose,
  onCheckIn,
  onAddNote,
  onSendWhatsApp,
  onViewGuestProfile,
}: {
  reservation: Reservation;
  onClose: () => void;
  onCheckIn: (reservationId: string) => void;
  onAddNote: (reservationId: string) => void;
  onSendWhatsApp: (guestName: string) => void;
  onViewGuestProfile: (guestId: string | undefined, guestName: string) => void;
}) {
  const styles = reservationStatusStyles[reservation.status];
  const payStyles = paymentStatusStyles[reservation.paymentStatus];
  const start = dateFromOffset(reservation.startOffset);
  const end = dateFromOffset(reservation.endOffset);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close reservation details" onClick={onClose} className="absolute inset-0 bg-deep-navy/70 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gold/20 bg-navy shadow-panel animate-slideIn">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Reservation Details</p>
            <h3 className="mt-1 text-lg font-semibold text-cream">{reservation.guestName}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-cream/50 hover:bg-white/5 hover:text-cream" aria-label="Close">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", styles.bg, styles.text, styles.border)}>
            <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
            {reservation.status}
          </span>

          <dl className="grid grid-cols-2 gap-4 text-sm">
            <Field label="Room" value={`${reservation.roomNumber} · ${reservation.roomType}`} />
            <Field label="Guests" value={String(reservation.guestsCount || "—")} />
            <Field label="Check-in" value={formatMonthDay(start)} />
            <Field label="Check-out" value={formatMonthDay(end)} />
            <Field label="Source" value={reservation.source} />
            <div>
              <dt className="text-xs text-cream/45">Payment</dt>
              <dd className={cn("mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold", payStyles.bg, payStyles.text)}>
                {reservation.paymentStatus}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Notes</p>
            <p className="mt-1.5 rounded-lg bg-deep-navy/60 p-3 text-sm leading-relaxed text-cream/75">{reservation.notes}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-white/10 px-6 py-5">
          <button
            onClick={() => onCheckIn(reservation.id)}
            disabled={reservation.status === "Checked In"}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-tropical-green px-3 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="check-in" className="h-4 w-4" />
            {reservation.status === "Checked In" ? "Checked In" : "Check In"}
          </button>
          <button
            onClick={() => onSendWhatsApp(reservation.guestName)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-teal/20 px-3 py-2.5 text-sm font-semibold text-teal ring-1 ring-teal/40 transition hover:bg-teal/30"
          >
            <Icon name="whatsapp" className="h-4 w-4" />
            Send WhatsApp
          </button>
          <button
            onClick={() => onAddNote(reservation.id)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-white/5 px-3 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <Icon name="note" className="h-4 w-4" />
            Add Note
          </button>
          <button
            onClick={() => onViewGuestProfile(reservation.guestId, reservation.guestName)}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-gold/15 px-3 py-2.5 text-sm font-semibold text-gold ring-1 ring-gold/40 transition hover:bg-gold/25"
          >
            <Icon name="users" className="h-4 w-4" />
            Guest Profile
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-cream/45">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-cream">{value}</dd>
    </div>
  );
}
