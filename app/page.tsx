"use client";

import { useState } from "react";
import { AppShell, ToastItem } from "@/components/AppShell";
import { SectionKey } from "@/components/Sidebar";
import { StatCard } from "@/components/StatCard";
import { ReservationCalendar } from "@/components/ReservationCalendar";
import { RoomGrid } from "@/components/RoomGrid";
import { GuestTable } from "@/components/GuestTable";
import { PricingDashboard } from "@/components/PricingDashboard";
import { ChannelMap } from "@/components/ChannelMap";
import { BookingFlowDemo } from "@/components/BookingFlowDemo";
import { HousekeepingBoard } from "@/components/HousekeepingBoard";
import { ActivityLog } from "@/components/ActivityLog";
import { RoadmapPanel } from "@/components/RoadmapPanel";
import { Icon } from "@/components/Icon";
import {
  ActivityLogItem,
  Guest,
  HousekeepingTask,
  Reservation,
  Room,
  activityLogSeed,
  demoRoles,
  guests as guestsSeed,
  housekeepingTasksSeed,
  overviewStats,
  reservations as reservationsSeed,
  rooms as roomsSeed,
  todaysPulse,
} from "@/lib/mockData";
import { formatCurrency } from "@/lib/utils";

let toastId = 0;

export default function HomePage() {
  const [view, setView] = useState<"landing" | "dashboard">("landing");
  const [roleId, setRoleId] = useState<string>("owner");
  const [activeSection, setActiveSection] = useState<SectionKey>("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);

  const [rooms, setRooms] = useState<Room[]>(roomsSeed);
  const [reservations, setReservations] = useState<Reservation[]>(reservationsSeed);
  const [guests, setGuests] = useState<Guest[]>(guestsSeed);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>(housekeepingTasksSeed);
  const [activityLog, setActivityLog] = useState<ActivityLogItem[]>(activityLogSeed);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const roleLabel = demoRoles.find((r) => r.id === roleId)?.label ?? "Owner / Admin";

  function pushToast(message: string) {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }

  function logActivity(description: string, icon: string = "note") {
    setActivityLog((prev) => [
      { id: `live-${Date.now()}`, icon, minutesAgo: 0, staff: roleLabel, description },
      ...prev,
    ]);
  }

  function notify(message: string, icon?: string) {
    pushToast(message);
    logActivity(message, icon);
  }

  function enterDashboard(nextRoleId: string) {
    setRoleId(nextRoleId);
    setView("dashboard");
  }

  function updateRoom(roomId: string, patch: Partial<Room>) {
    setRooms((prev) => prev.map((r) => (r.id === roomId ? { ...r, ...patch } : r)));
  }

  function updateHousekeepingTask(taskId: string, patch: Partial<HousekeepingTask>) {
    setHousekeepingTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t)));
  }

  function handleCheckIn(reservationId: string) {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;
    setReservations((prev) => prev.map((r) => (r.id === reservationId ? { ...r, status: "Checked In" } : r)));
    notify(`Checked in ${res.guestName} to ${res.roomNumber}.`, "check-in");
  }

  function handleAddNote(reservationId: string) {
    const res = reservations.find((r) => r.id === reservationId);
    if (!res) return;
    setReservations((prev) =>
      prev.map((r) => (r.id === reservationId ? { ...r, notes: `${r.notes} — Note added by ${roleLabel}.` } : r))
    );
    notify(`Note added to ${res.guestName}'s reservation.`, "note");
  }

  function handleSendWhatsApp(guestName: string) {
    notify(`WhatsApp message sent to ${guestName} (simulated).`, "whatsapp");
  }

  function handleViewGuestProfile(guestId: string | undefined, guestName: string) {
    const found = guests.find((g) => g.id === guestId) ?? guests.find((g) => g.name === guestName);
    if (found) {
      setActiveSection("guests");
      setSelectedGuestId(found.id);
    } else {
      notify(`${guestName} does not have a CRM profile yet.`, "alert");
    }
  }

  function handleScheduleFollowUp(guestId: string) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, followUpStatus: "Scheduled" } : g)));
    notify(`Follow-up scheduled for ${guest.name}.`, "calendar");
  }

  function handleCompleteFollowUp(guestId: string) {
    const guest = guests.find((g) => g.id === guestId);
    if (!guest) return;
    setGuests((prev) => prev.map((g) => (g.id === guestId ? { ...g, followUpStatus: "Completed" } : g)));
    notify(`Follow-up marked completed for ${guest.name}.`, "check");
  }

  if (view === "landing") {
    return <LandingScreen onEnter={enterDashboard} />;
  }

  return (
    <AppShell
      active={activeSection}
      onSelect={setActiveSection}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      roleLabel={roleLabel}
      toasts={toasts}
    >
      {activeSection === "overview" && (
        <OverviewSection activityLog={activityLog} />
      )}
      {activeSection === "calendar" && (
        <ReservationCalendar
          rooms={rooms}
          reservations={reservations}
          searchQuery={searchQuery}
          onCheckIn={handleCheckIn}
          onAddNote={handleAddNote}
          onSendWhatsApp={handleSendWhatsApp}
          onViewGuestProfile={handleViewGuestProfile}
        />
      )}
      {activeSection === "rooms" && (
        <RoomGrid rooms={rooms} guests={guests} searchQuery={searchQuery} onUpdateRoom={updateRoom} notify={notify} />
      )}
      {activeSection === "guests" && (
        <GuestTable
          guests={guests}
          searchQuery={searchQuery}
          selectedGuestId={selectedGuestId}
          onSelectGuest={setSelectedGuestId}
          notify={notify}
          onScheduleFollowUp={handleScheduleFollowUp}
          onCompleteFollowUp={handleCompleteFollowUp}
        />
      )}
      {activeSection === "pricing" && <PricingDashboard />}
      {activeSection === "booking" && <BookingFlowDemo notify={notify} />}
      {activeSection === "channels" && <ChannelMap />}
      {activeSection === "housekeeping" && (
        <HousekeepingBoard tasks={housekeepingTasks} onUpdateTask={updateHousekeepingTask} notify={notify} />
      )}
      {activeSection === "roadmap" && <RoadmapPanel notify={notify} />}
    </AppShell>
  );
}

function OverviewSection({ activityLog }: { activityLog: ActivityLogItem[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-cream">Overview</h2>
        <p className="mt-1 text-sm text-cream/60">Today's snapshot across rooms, guests, and revenue.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="Occupancy Today" value={`${overviewStats.occupancyToday}%`} icon="chart" accent="teal" />
        <StatCard label="Arrivals Today" value={String(overviewStats.arrivalsToday)} icon="calendar-plus" accent="green" />
        <StatCard label="Departures Today" value={String(overviewStats.departuresToday)} icon="calendar" accent="coral" />
        <StatCard label="Available Rooms" value={String(overviewStats.availableRooms)} icon="bed" accent="teal" />
        <StatCard label="In-House Guests" value={String(overviewStats.inHouseGuests)} icon="users" accent="green" />
        <StatCard label="Open Follow-Ups" value={String(overviewStats.openFollowUps)} icon="whatsapp" accent="gold" />
        <StatCard
          label="Est. Revenue Today"
          value={formatCurrency(overviewStats.estimatedRevenueToday)}
          icon="dollar"
          accent="gold"
        />
        <StatCard label="Average Daily Rate" value={`$${overviewStats.adr}`} icon="trending-up" accent="teal" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card lg:col-span-2">
          <p className="flex items-center gap-2 text-sm font-semibold text-cream">
            <Icon name="sparkles" className="h-4 w-4 text-gold" />
            Today's Pulse
          </p>
          <ul className="mt-3 space-y-2.5">
            {todaysPulse.map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-cream/75">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl2 border border-teal/20 bg-teal/5 p-5 shadow-card">
          <p className="flex items-center gap-2 text-sm font-semibold text-teal">
            <Icon name="target" className="h-4 w-4" />
            Why This Matters
          </p>
          <p className="mt-3 text-sm leading-relaxed text-cream/75">
            This MVP shows the first operational layer Hotel Kaoba could own: rooms, guests, reservations, pricing
            visibility, and follow-up. The goal is to test the workflow beside existing systems before replacing
            anything critical.
          </p>
        </div>
      </div>

      <ActivityLog items={activityLog} />
    </div>
  );
}

function LandingScreen({ onEnter }: { onEnter: (roleId: string) => void }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-deep-navy">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-tropical-green/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-teal/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col items-center px-6 py-16 text-center sm:py-24">
        <div className="flex items-center gap-2.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/15 ring-1 ring-gold/30">
            <span className="text-lg font-serif font-semibold text-gold">HK</span>
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-cream">Hotel Kaoba</p>
            <p className="text-[11px] uppercase tracking-wide text-cream/45">Cabarete, Dominican Republic</p>
          </div>
        </div>

        <h1 className="mt-10 text-4xl font-semibold leading-tight text-cream sm:text-5xl">
          Hotel Kaoba Command Center
        </h1>
        <p className="mt-3 text-base font-medium text-gold sm:text-lg">
          Own the guest journey from booking to checkout.
        </p>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-cream/65 sm:text-base">
          A proprietary hotel operations MVP for managing rooms, guests, bookings, pricing visibility, and follow-up
          from one place.
        </p>

        <button
          onClick={() => onEnter("owner")}
          className="mt-8 flex items-center gap-2 rounded-lg bg-gold px-6 py-3.5 text-sm font-semibold text-deep-navy shadow-card transition hover:brightness-110 sm:text-base"
        >
          Enter Demo Dashboard
          <Icon name="arrow-right" className="h-4 w-4" />
        </button>

        <p className="mt-12 text-xs font-semibold uppercase tracking-wide text-cream/40">Or continue as</p>

        <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
          {demoRoles.map((role) => (
            <button
              key={role.id}
              onClick={() => onEnter(role.id)}
              className="group flex items-start gap-3 rounded-xl2 border border-white/10 bg-navy/60 p-5 text-left shadow-card transition hover:-translate-y-0.5 hover:border-gold/40"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/30 transition group-hover:bg-gold/25">
                <Icon name={role.icon as Parameters<typeof Icon>[0]["name"]} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-cream">{role.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-cream/55">{role.description}</span>
              </span>
            </button>
          ))}
        </div>

        <p className="mt-12 max-w-md text-xs leading-relaxed text-cream/35">
          Demo mode — no real login required. All data shown is local and fabricated for demonstration purposes
          only.
        </p>
      </div>
    </div>
  );
}
