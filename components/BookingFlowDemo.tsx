"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { roomTypeOptions, RoomType } from "@/lib/mockData";
import { cn, toISODate, dateFromOffset } from "@/lib/utils";

const STEPS = ["Dates", "Room Type", "Guest Details", "Review"] as const;

interface GuestDetails {
  name: string;
  email: string;
  phone: string;
  notes: string;
}

const emptyGuest: GuestDetails = { name: "", email: "", phone: "", notes: "" };

export function BookingFlowDemo({ notify }: { notify: (message: string) => void }) {
  const [step, setStep] = useState(0);
  const [checkIn, setCheckIn] = useState(toISODate(dateFromOffset(3)));
  const [checkOut, setCheckOut] = useState(toISODate(dateFromOffset(6)));
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [guest, setGuest] = useState<GuestDetails>(emptyGuest);
  const [submitted, setSubmitted] = useState(false);

  const selectedOption = roomTypeOptions.find((r) => r.type === roomType) ?? null;
  const nights = Math.max(1, Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000));
  const canContinue = [true, roomType !== null, guest.name.trim() && guest.email.trim() && guest.phone.trim(), true][step];

  function reset() {
    setStep(0);
    setRoomType(null);
    setGuest(emptyGuest);
    setSubmitted(false);
  }

  function submit() {
    setSubmitted(true);
    notify(`Direct booking request captured for ${guest.name || "a guest"} — added to CRM with a follow-up task.`);
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl rounded-xl2 border border-tropical-green/30 bg-tropical-green/10 p-8 text-center shadow-card animate-fadeIn">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-tropical-green/20 ring-1 ring-tropical-green/40">
          <Icon name="check" className="h-7 w-7 text-tropical-green" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-cream">Booking request captured.</h3>
        <p className="mt-1 text-sm text-cream/70">Guest added to CRM. Follow-up task created.</p>

        <div className="mt-6 grid grid-cols-1 gap-3 rounded-lg bg-deep-navy/50 p-4 text-left text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs text-cream/45">Guest</p>
            <p className="font-medium text-cream">{guest.name}</p>
          </div>
          <div>
            <p className="text-xs text-cream/45">Room Type</p>
            <p className="font-medium text-cream">{roomType}</p>
          </div>
          <div>
            <p className="text-xs text-cream/45">Dates</p>
            <p className="font-medium text-cream">{checkIn} → {checkOut} ({nights} nights)</p>
          </div>
          <div>
            <p className="text-xs text-cream/45">Estimated Total</p>
            <p className="font-medium text-cream">${selectedOption ? selectedOption.rate * nights : "—"}</p>
          </div>
        </div>

        <p className="mt-6 text-xs text-cream/45">
          This MVP does not process payments or live inventory. It demonstrates the future direct booking path.
        </p>

        <button
          onClick={reset}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110"
        >
          <Icon name="plus" className="h-4 w-4" />
          Start Another Request
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        This MVP does not process payments or live inventory. It demonstrates the future direct booking path.
      </div>

      {/* Step indicator */}
      <ol className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        {STEPS.map((label, i) => (
          <li key={label} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full ring-1",
                i === step
                  ? "bg-gold text-deep-navy ring-gold"
                  : i < step
                  ? "bg-tropical-green/20 text-tropical-green ring-tropical-green/40"
                  : "bg-white/5 text-cream/40 ring-white/10"
              )}
            >
              {i < step ? <Icon name="check" className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn(i === step ? "text-cream" : "text-cream/40")}>{label}</span>
            {i < STEPS.length - 1 && <Icon name="chevron-right" className="h-3.5 w-3.5 text-cream/25" />}
          </li>
        ))}
      </ol>

      <div className="rounded-xl2 border border-white/5 bg-navy/60 p-6 shadow-card">
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-cream">Select dates</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <p className="text-xs text-cream/45">{nights} night{nights === 1 ? "" : "s"} selected.</p>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-cream">Select room type</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {roomTypeOptions.map((opt) => (
                <div
                  key={opt.type}
                  className={cn(
                    "flex flex-col overflow-hidden rounded-xl2 border transition",
                    roomType === opt.type ? "border-gold ring-2 ring-gold/40" : "border-white/10 hover:border-white/20"
                  )}
                >
                  <div className={cn("relative h-28 w-full", opt.gradient)}>
                    <span className="absolute right-2 top-2 rounded-full bg-deep-navy/70 px-2.5 py-1 text-xs font-semibold text-cream">
                      ${opt.rate}/night
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 bg-navy/70 p-4">
                    <p className="text-sm font-semibold text-cream">{opt.type}</p>
                    <p className="text-xs text-cream/55">{opt.description}</p>
                    <p className="flex items-center gap-1.5 text-xs text-cream/50">
                      <Icon name="users" className="h-3.5 w-3.5" />
                      Sleeps {opt.capacity}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {opt.amenities.map((a) => (
                        <span key={a} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-cream/55">
                          {a}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => setRoomType(opt.type)}
                      className={cn(
                        "mt-2 rounded-lg px-3 py-2 text-xs font-semibold transition",
                        roomType === opt.type
                          ? "bg-gold text-deep-navy"
                          : "bg-white/5 text-cream ring-1 ring-white/10 hover:bg-white/10"
                      )}
                    >
                      {roomType === opt.type ? "Selected" : "Select Room"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-cream">Guest details</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="text-cream/60">Full name</span>
                <input
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  placeholder="Jordan Michaels"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-cream/60">Email</span>
                <input
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  placeholder="jordan@email.com"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="text-cream/60">Phone</span>
                <input
                  value={guest.phone}
                  onChange={(e) => setGuest({ ...guest, phone: e.target.value })}
                  placeholder="+1 555 555 0100"
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="text-cream/60">Notes / special requests</span>
                <textarea
                  value={guest.notes}
                  onChange={(e) => setGuest({ ...guest, notes: e.target.value })}
                  rows={3}
                  placeholder="Arriving late, celebrating an anniversary, etc."
                  className="mt-1.5 w-full rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
                />
              </label>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-cream">Review request</h3>
            <div className="grid grid-cols-1 gap-4 rounded-lg bg-deep-navy/50 p-4 text-sm sm:grid-cols-2">
              <Row label="Dates" value={`${checkIn} → ${checkOut} (${nights}n)`} />
              <Row label="Room Type" value={roomType ?? "—"} />
              <Row label="Rate" value={selectedOption ? `$${selectedOption.rate}/night` : "—"} />
              <Row label="Estimated Total" value={selectedOption ? `$${selectedOption.rate * nights}` : "—"} />
              <Row label="Guest" value={guest.name || "—"} />
              <Row label="Contact" value={[guest.email, guest.phone].filter(Boolean).join(" · ") || "—"} />
              {guest.notes && <div className="sm:col-span-2"><Row label="Notes" value={guest.notes} /></div>}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <Icon name="arrow-left" className="h-4 w-4" />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            disabled={!canContinue}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Continue
            <Icon name="arrow-right" className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={submit}
            className="flex items-center gap-1.5 rounded-lg bg-tropical-green px-5 py-2.5 text-sm font-semibold text-deep-navy transition hover:brightness-110"
          >
            <Icon name="check" className="h-4 w-4" />
            Submit Request
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-cream/45">{label}</p>
      <p className="font-medium text-cream">{value}</p>
    </div>
  );
}
