"use client";

import { Icon, IconName } from "./Icon";

interface Phase {
  id: string;
  title: string;
  subtitle: string;
  icon: IconName;
  items: string[];
}

const PHASES: Phase[] = [
  {
    id: "phase-1",
    title: "Phase 1",
    subtitle: "2-Week Pilot MVP",
    icon: "sparkles",
    items: [
      "Room + guest management",
      "Reservation calendar",
      "Guest CRM",
      "Housekeeping board",
      "Pricing visibility mockup",
      "Booking flow demo",
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2",
    subtitle: "Operational MVP",
    icon: "layers",
    items: [
      "Real staff accounts",
      "Real reservation data",
      "Real room inventory",
      "Basic reporting",
      "Guest communication workflows",
      "Live direct booking request flow",
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3",
    subtitle: "Cloudbeds Parallel Testing",
    icon: "history",
    items: [
      "Run side-by-side with Cloudbeds",
      "Compare workflows",
      "Identify missing features",
      "Train staff",
      "Document issues",
      "Improve system speed and accuracy",
    ],
  },
  {
    id: "phase-4",
    title: "Phase 4",
    subtitle: "Revenue + Channel Expansion",
    icon: "trending-up",
    items: [
      "Competitor pricing workflow",
      "OTA import/export planning",
      "Channel sync feasibility",
      "Direct booking optimization",
      "Payment workflow planning",
    ],
  },
  {
    id: "phase-5",
    title: "Phase 5",
    subtitle: "Multi-Hotel SaaS Potential",
    icon: "map",
    items: [
      "Hotel owner dashboard",
      "Multi-property support",
      "Subscription model",
      "White-label onboarding",
      "Resell to other hotels in DR",
    ],
  },
];

const WEEK_ONE = [
  "Review current Cloudbeds workflow",
  "Sit with reception/front desk",
  "Map room and guest processes",
  "Identify key data fields",
  "Define MVP reservations workflow",
  "Confirm top 3 Cloudbeds replacement priorities",
  "Build dashboard foundation",
];

const WEEK_TWO = [
  "Build room/guest management pilot",
  "Build calendar view",
  "Build guest CRM",
  "Build housekeeping board",
  "Add pricing visibility mockup",
  "Test with sample guest workflows",
  "Review with Hotel Kaoba team",
  "Document full replacement roadmap",
];

const DATA_REQUIREMENTS = [
  "Room list",
  "Room types",
  "Rates",
  "Existing reservation export",
  "Guest data export if available",
  "Staff roles",
  "Housekeeping process",
  "Cloudbeds feature priorities",
  "OTA/channel priorities",
  "Payment process",
  "WhatsApp/contact workflow",
];

export function RoadmapPanel({ notify }: { notify: (message: string) => void }) {
  return (
    <div id="roadmap-top" className="space-y-12">
      {/* Phases */}
      <section>
        <h2 className="text-xl font-semibold text-cream">From MVP Pilot to Proprietary Hotel Operating System</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream/60">
          A phased build path — starting with a low-risk pilot alongside existing systems, and ending with the option
          to own a full hotel operating platform.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
          {PHASES.map((phase, i) => (
            <div
              key={phase.id}
              id={phase.id}
              className="relative flex flex-col rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card"
            >
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/15 text-gold ring-1 ring-gold/30">
                  <Icon name={phase.icon} className="h-[18px] w-[18px]" />
                </span>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gold/80">{phase.title}</p>
                  <p className="text-sm font-semibold text-cream">{phase.subtitle}</p>
                </div>
              </div>
              <ul className="mt-4 space-y-2">
                {phase.items.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-xs leading-relaxed text-cream/65">
                    <Icon name="check" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-tropical-green" />
                    {item}
                  </li>
                ))}
              </ul>
              {i < PHASES.length - 1 && (
                <Icon
                  name="chevron-right"
                  className="absolute -right-3 top-1/2 hidden h-5 w-5 -translate-y-1/2 text-cream/20 lg:block"
                />
              )}
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-xl2 border border-teal/20 bg-teal/5 px-5 py-4 text-sm leading-relaxed text-cream/75">
          The long-term opportunity is not just saving monthly software costs. The bigger opportunity is owning a
          hotel operating platform that could eventually serve Hotel Kaoba and other boutique hotels in the
          Dominican Republic.
        </div>
      </section>

      {/* Two-week plan */}
      <section>
        <h2 className="text-xl font-semibold text-cream">Two-Week Implementation Plan</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream/60">
          A tactical, sprint-friendly plan to get from kickoff to a reviewable pilot in fourteen days.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <WeekCard title="Week 1" subtitle="Discovery + Foundation" items={WEEK_ONE} />
          <WeekCard title="Week 2" subtitle="Build + Review" items={WEEK_TWO} />
        </div>
      </section>

      {/* Demo data requirements */}
      <section>
        <h2 className="text-xl font-semibold text-cream">Demo Data Requirements</h2>
        <p className="mt-2 max-w-2xl text-sm text-cream/60">
          What Hotel Kaoba would need to gather for a real, non-mock implementation.
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2 rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card sm:grid-cols-2 lg:grid-cols-3">
          {DATA_REQUIREMENTS.map((item) => (
            <div key={item} className="flex items-center gap-2 rounded-lg bg-deep-navy/50 px-3 py-2.5 text-sm text-cream/75">
              <Icon name="clipboard" className="h-4 w-4 shrink-0 text-teal" />
              {item}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="rounded-xl2 border border-gold/30 bg-gradient-to-br from-navy via-navy to-deep-navy p-8 text-center shadow-panel sm:p-10">
        <h2 className="text-2xl font-semibold text-cream sm:text-3xl">
          Start with the pilot. Prove the workflow. Then build the operating system.
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-cream/65 sm:text-base">
          This MVP gives Hotel Kaoba a clear first step toward owning its booking, guest, pricing, and follow-up
          infrastructure.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => notify("Interest in the 2-week pilot noted. A real CTA would open a scheduling flow here.")}
            className="flex items-center gap-1.5 rounded-lg bg-gold px-5 py-3 text-sm font-semibold text-deep-navy transition hover:brightness-110"
          >
            <Icon name="arrow-right" className="h-4 w-4" />
            Start 2-Week Pilot
          </button>
          <a
            href="#roadmap-top"
            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-5 py-3 text-sm font-semibold text-cream ring-1 ring-white/10 transition hover:bg-white/10"
          >
            <Icon name="route" className="h-4 w-4" />
            Review Roadmap
          </a>
        </div>

        <div className="mx-auto mt-8 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
          <PricingPill label="Recommended Pilot Sprint" value="$7,500" />
          <PricingPill label="Discovery-Only Option" value="$2,500" />
          <PricingPill label="Full Production Roadmap" value="Scoped after pilot" />
        </div>
      </section>
    </div>
  );
}

function WeekCard({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  return (
    <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-wide text-gold/80">{title}</p>
      <p className="text-sm font-semibold text-cream">{subtitle}</p>
      <ul className="mt-4 space-y-2.5">
        {items.map((item, i) => (
          <li key={item} className="flex items-start gap-2.5 text-sm text-cream/70">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-teal/15 text-[10px] font-semibold text-teal ring-1 ring-teal/30">
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PricingPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 border border-white/10 bg-deep-navy/60 px-4 py-3.5">
      <p className="text-[11px] uppercase tracking-wide text-cream/45">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gold">{value}</p>
    </div>
  );
}
