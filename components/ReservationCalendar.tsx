"use client";

import { useMemo, useState } from "react";
import { Icon } from "./Icon";
import {
  BookingSource,
  ITBIS_RATE,
  Reservation,
  ReservationStatus,
  Room,
  RoomType,
} from "@/lib/mockData";
import {
  cn,
  computeFolio,
  confirmationCode,
  dateFromOffset,
  formatCurrency,
  formatDateShort,
  formatMonthDay,
  getDateWindow,
  hasOffsetConflict,
  offsetFromISODate,
  paymentStatusStyles,
  reservationStatusStyles,
  toISODate,
} from "@/lib/utils";

const ROOM_TYPE_ORDER: RoomType[] = ["Bungalow", "Standard Room", "Poolside Room", "Suite"];
const WINDOW_DAYS = 7;
const SOURCES: BookingSource[] = ["Direct", "Airbnb", "Booking.com", "Walk-in", "WhatsApp"];

interface NewResDraft {
  roomId: string;
  startOffset: number;
}

export function ReservationCalendar({
  rooms,
  reservations,
  searchQuery,
  onCheckIn,
  onCheckOut,
  onAddNote,
  onSendWhatsApp,
  onViewGuestProfile,
  onCreateReservation,
}: {
  rooms: Room[];
  reservations: Reservation[];
  searchQuery: string;
  onCheckIn: (reservationId: string) => void;
  onCheckOut: (reservationId: string) => void;
  onAddNote: (reservationId: string) => void;
  onSendWhatsApp: (guestName: string) => void;
  onViewGuestProfile: (guestId: string | undefined, guestName: string) => void;
  onCreateReservation: (reservation: Reservation) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newResDraft, setNewResDraft] = useState<NewResDraft | null>(null);
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
  const selectedRoom = selected ? rooms.find((r) => r.id === selected.roomId) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        <span>Calendar MVP shows how Hotel Kaoba can view rooms, guests, holds, and blocks in one operational screen.</span>
        <button
          onClick={() => setNewResDraft({ roomId: rooms[0]?.id ?? "", startOffset: 0 })}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-3.5 py-2 text-xs font-semibold text-deep-navy transition hover:brightness-110"
        >
          <Icon name="plus" className="h-3.5 w-3.5" />
          New Reservation
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-cream/60">
        {(Object.keys(reservationStatusStyles) as ReservationStatus[]).map((status) => (
          <span key={status} className="flex items-center gap-1.5">
            <span className={cn("h-2.5 w-2.5 rounded-full", reservationStatusStyles[status].dot)} />
            {status}
          </span>
        ))}
        <span className="ml-auto text-cream/40">Click an open night to start a booking.</span>
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
                        {days.map((_, i) => {
                          const occupied = roomReservations.some((r) => r.startOffset <= i && r.endOffset > i);
                          return (
                            <button
                              key={i}
                              type="button"
                              disabled={occupied}
                              onClick={() => setNewResDraft({ roomId: room.id, startOffset: i })}
                              aria-label={occupied ? undefined : `Start a booking for ${room.number} on ${formatMonthDay(dateFromOffset(i))}`}
                              className={cn(
                                "h-12 rounded-md border border-dashed border-white/5 transition",
                                !occupied && "cursor-pointer hover:border-gold/40 hover:bg-gold/5"
                              )}
                            />
                          );
                        })}
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
          room={selectedRoom}
          onClose={() => setSelectedId(null)}
          onCheckIn={onCheckIn}
          onCheckOut={onCheckOut}
          onAddNote={onAddNote}
          onSendWhatsApp={onSendWhatsApp}
          onViewGuestProfile={onViewGuestProfile}
        />
      )}

      {newResDraft && (
        <NewReservationModal
          rooms={rooms}
          reservations={reservations}
          draft={newResDraft}
          onClose={() => setNewResDraft(null)}
          onSave={(res) => {
            onCreateReservation(res);
            setNewResDraft(null);
          }}
        />
      )}
    </div>
  );
}

function ReservationDetailPanel({
  reservation,
  room,
  onClose,
  onCheckIn,
  onCheckOut,
  onAddNote,
  onSendWhatsApp,
  onViewGuestProfile,
}: {
  reservation: Reservation;
  room: Room | undefined;
  onClose: () => void;
  onCheckIn: (reservationId: string) => void;
  onCheckOut: (reservationId: string) => void;
  onAddNote: (reservationId: string) => void;
  onSendWhatsApp: (guestName: string) => void;
  onViewGuestProfile: (guestId: string | undefined, guestName: string) => void;
}) {
  const styles = reservationStatusStyles[reservation.status];
  const payStyles = paymentStatusStyles[reservation.paymentStatus];
  const start = dateFromOffset(reservation.startOffset);
  const end = dateFromOffset(reservation.endOffset);
  const folio = computeFolio(reservation.endOffset - reservation.startOffset, room?.rateTonight ?? 0, ITBIS_RATE);
  const canCheckOut = reservation.status === "Checked In" && !reservation.checkedOut;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button aria-label="Close reservation details" onClick={onClose} className="absolute inset-0 bg-deep-navy/70 backdrop-blur-sm" />
      <div className="relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gold/20 bg-navy shadow-panel animate-slideIn">
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-xs uppercase tracking-wide text-cream/45">
              Reservation Details
              <span className="rounded bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-cream/50">
                {confirmationCode(reservation.id)}
              </span>
            </p>
            <h3 className="mt-1 text-lg font-semibold text-cream">{reservation.guestName}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-cream/50 hover:bg-white/5 hover:text-cream" aria-label="Close">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 px-6 py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold", styles.bg, styles.text, styles.border)}>
              <span className={cn("h-1.5 w-1.5 rounded-full", styles.dot)} />
              {reservation.status}
            </span>
            {reservation.checkedOut && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-muted/40 bg-muted/15 px-3 py-1 text-xs font-semibold text-cream/70">
                Checked Out
              </span>
            )}
          </div>

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
            <p className="text-xs uppercase tracking-wide text-cream/45">Folio</p>
            <div className="mt-1.5 space-y-1.5 rounded-lg bg-deep-navy/60 p-3 text-sm">
              <div className="flex items-center justify-between text-cream/70">
                <span>
                  {folio.nights} night{folio.nights === 1 ? "" : "s"} × {formatCurrency(room?.rateTonight ?? 0)}
                </span>
                <span className="font-mono">{formatCurrency(Math.round(folio.subtotal))}</span>
              </div>
              <div className="flex items-center justify-between text-cream/50">
                <span>ITBIS {Math.round(ITBIS_RATE * 100)}%</span>
                <span className="font-mono">{formatCurrency(Math.round(folio.tax))}</span>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-1.5 font-semibold text-cream">
                <span>Total</span>
                <span className="font-mono">{formatCurrency(Math.round(folio.total))}</span>
              </div>
            </div>
          </div>

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
            onClick={() => onCheckOut(reservation.id)}
            disabled={!canCheckOut}
            className="flex items-center justify-center gap-1.5 rounded-lg bg-coral/15 px-3 py-2.5 text-sm font-semibold text-coral ring-1 ring-coral/40 transition hover:bg-coral/25 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="arrow-right" className="h-4 w-4" />
            {reservation.checkedOut ? "Checked Out" : "Check Out"}
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
            className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg bg-gold/15 px-3 py-2.5 text-sm font-semibold text-gold ring-1 ring-gold/40 transition hover:bg-gold/25"
          >
            <Icon name="users" className="h-4 w-4" />
            View Guest Profile
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

function NewReservationModal({
  rooms,
  reservations,
  draft,
  onClose,
  onSave,
}: {
  rooms: Room[];
  reservations: Reservation[];
  draft: NewResDraft;
  onClose: () => void;
  onSave: (reservation: Reservation) => void;
}) {
  const [guestName, setGuestName] = useState("");
  const [roomId, setRoomId] = useState(draft.roomId);
  const [checkIn, setCheckIn] = useState(toISODate(dateFromOffset(draft.startOffset)));
  const [checkOut, setCheckOut] = useState(toISODate(dateFromOffset(draft.startOffset + 2)));
  const [adults, setAdults] = useState(2);
  const [source, setSource] = useState<BookingSource>("Direct");
  const [notes, setNotes] = useState("");

  const room = rooms.find((r) => r.id === roomId);
  const startOffset = offsetFromISODate(checkIn);
  const endOffset = offsetFromISODate(checkOut);
  const nights = endOffset - startOffset;
  const conflict =
    nights > 0 && hasOffsetConflict(reservations, roomId, startOffset, endOffset, undefined, (r) => (r as Reservation).id);
  const folio = room && nights > 0 ? computeFolio(nights, room.rateTonight, ITBIS_RATE) : null;
  const canSave = guestName.trim().length > 0 && nights > 0 && !conflict && !!room;

  function save() {
    if (!canSave || !room) return;
    const id = `res-${Date.now()}`;
    onSave({
      id,
      guestName: guestName.trim(),
      roomId: room.id,
      roomNumber: room.number,
      roomType: room.type,
      startOffset,
      endOffset,
      status: "Confirmed",
      guestsCount: adults,
      source,
      paymentStatus: "Unpaid",
      notes: notes.trim(),
      checkedOut: false,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close new reservation" onClick={onClose} className="absolute inset-0 bg-deep-navy/70 backdrop-blur-sm" />
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl2 border border-white/10 bg-navy p-6 shadow-panel animate-fadeIn">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-cream/45">Front Desk</p>
            <h3 className="mt-1 text-lg font-semibold text-cream">New Reservation</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-md p-1.5 text-cream/50 hover:bg-white/5 hover:text-cream">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block text-sm">
            <span className="text-cream/60">Guest name</span>
            <input
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="e.g. María Peralta"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
            />
          </label>

          <label className="block text-sm">
            <span className="text-cream/60">Room</span>
            <select
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream focus:border-gold/50 focus:outline-none"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.number} · {r.type} · {formatCurrency(r.rateTonight)}/night
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-cream/60">Check-in</span>
              <input
                type="date"
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream focus:border-gold/50 focus:outline-none"
              />
            </label>
            <label className="block text-sm">
              <span className="text-cream/60">Check-out</span>
              <input
                type="date"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream focus:border-gold/50 focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="text-cream/60">Adults</span>
              <select
                value={adults}
                onChange={(e) => setAdults(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream focus:border-gold/50 focus:outline-none"
              >
                {[1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="text-cream/60">Source</span>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as BookingSource)}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream focus:border-gold/50 focus:outline-none"
              >
                {SOURCES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="block text-sm">
            <span className="text-cream/60">Notes / requests</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Arrival time, pickup, special requests…"
              className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
            />
          </label>

          <div className="rounded-lg bg-deep-navy/50 px-3 py-2.5 text-sm">
            {nights <= 0 ? (
              <span className="text-coral">Check-out must be after check-in.</span>
            ) : conflict ? (
              <span className="text-coral">
                {room?.number} is already booked over those dates. Pick another room or adjust the stay.
              </span>
            ) : folio ? (
              <span className="text-cream/75">
                <b className="text-cream">
                  {folio.nights} night{folio.nights === 1 ? "" : "s"}
                </b>{" "}
                × {formatCurrency(room!.rateTonight)} + {Math.round(ITBIS_RATE * 100)}% ITBIS ={" "}
                <b className="text-gold">{formatCurrency(Math.round(folio.total))}</b>
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={save}
            disabled={!canSave}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Icon name="check" className="h-4 w-4" />
            Save Reservation
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/10"
          >
            Discard
          </button>
        </div>
      </div>
    </div>
  );
}
