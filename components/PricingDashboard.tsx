"use client";

import { Icon } from "./Icon";
import { StatCard } from "./StatCard";
import { RoomTypeOption, aiPricingNotes, competitors, pricingSnapshot } from "@/lib/mockData";
import { formatCurrency, timeAgo } from "@/lib/utils";

export function PricingDashboard({
  roomTypeOptions,
  onUpdateRate,
}: {
  roomTypeOptions: RoomTypeOption[];
  onUpdateRate: (type: RoomTypeOption["type"], rate: number) => void;
}) {
  const maxRate = Math.max(pricingSnapshot.todayADR, pricingSnapshot.competitorAvg, pricingSnapshot.suggestedRate) * 1.1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-cream">Pricing Intelligence</h2>
        <p className="mt-1 max-w-2xl text-sm text-cream/60">
          Help Hotel Kaoba compare local rates, monitor demand, and make better pricing decisions.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Today's ADR" value={`$${pricingSnapshot.todayADR}`} icon="dollar" accent="teal" />
        <StatCard label="Competitor Avg" value={`$${pricingSnapshot.competitorAvg}`} icon="chart" accent="coral" />
        <StatCard label="Suggested Rate" value={`$${pricingSnapshot.suggestedRate}`} icon="trending-up" accent="gold" />
        <StatCard label="Weekend Demand" value={pricingSnapshot.weekendDemand} icon="sparkles" accent="green" />
        <StatCard label="Occupancy Trend" value={`+${pricingSnapshot.occupancyTrend}%`} icon="trending-up" accent="green" />
      </div>

      {/* Mock rate comparison chart */}
      <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card">
        <p className="text-sm font-semibold text-cream">Rate Comparison</p>
        <div className="mt-4 space-y-3">
          <RateBar label="Today's ADR" value={pricingSnapshot.todayADR} max={maxRate} color="bg-teal" />
          <RateBar label="Suggested Rate" value={pricingSnapshot.suggestedRate} max={maxRate} color="bg-gold" />
          <RateBar label="Competitor Avg" value={pricingSnapshot.competitorAvg} max={maxRate} color="bg-coral" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="overflow-x-auto rounded-xl2 border border-white/5 bg-navy/60 shadow-card lg:col-span-2">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-cream/45">
                <th className="px-4 py-3 font-semibold">Hotel</th>
                <th className="px-4 py-3 font-semibold">Room Type</th>
                <th className="px-4 py-3 font-semibold">Public Rate</th>
                <th className="px-4 py-3 font-semibold">Availability</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Last Checked</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.id} className="border-b border-white/5 transition hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-cream">{c.name}</td>
                  <td className="px-4 py-3 text-cream/65">{c.roomType}</td>
                  <td className="px-4 py-3 font-semibold text-gold">${c.publicRate}</td>
                  <td className="px-4 py-3 text-cream/65">{c.availability}</td>
                  <td className="px-4 py-3 text-cream/55">{c.source}</td>
                  <td className="px-4 py-3 text-cream/45">{timeAgo(c.lastCheckedHoursAgo * 60)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl2 border border-gold/20 bg-gold/5 p-5 shadow-card">
          <p className="flex items-center gap-2 text-sm font-semibold text-gold">
            <Icon name="sparkles" className="h-4 w-4" />
            AI Pricing Notes
          </p>
          <ul className="mt-3 space-y-3">
            {aiPricingNotes.map((note, i) => (
              <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-cream/75">
                <Icon name="chevron-right" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold/70" />
                {note}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Editable base rates */}
      <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card">
        <p className="flex items-center gap-2 text-sm font-semibold text-cream">
          <Icon name="tag" className="h-4 w-4 text-gold" />
          Kaoba Base Rates
        </p>
        <p className="mt-1 text-xs text-cream/50">
          Set Hotel Kaoba's own nightly rate by room type — separate from the competitor rates above.
        </p>
        <div className="mt-4 divide-y divide-white/5">
          {roomTypeOptions.map((opt) => (
            <div key={opt.type} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-[160px] flex-1">
                <p className="text-sm font-medium text-cream">{opt.type}</p>
                <p className="text-xs text-cream/45">{opt.description}</p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-cream/50">$</span>
                <input
                  type="number"
                  min={0}
                  value={opt.rate}
                  onChange={(e) => onUpdateRate(opt.type, Math.max(0, Number(e.target.value) || 0))}
                  className="w-24 rounded-lg border border-white/10 bg-deep-navy/60 px-3 py-2 text-right font-mono text-cream focus:border-gold/50 focus:outline-none"
                  aria-label={`${opt.type} nightly rate`}
                />
                <span className="text-cream/45">/night</span>
              </label>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-cream/45">
          Rates apply to new bookings going forward. Existing reservations keep the rate they were booked at. ITBIS{" "}
          18% is added at the folio.
        </p>
      </div>

      <div className="rounded-xl2 border border-white/10 bg-navy/40 px-4 py-3 text-xs text-cream/45">
        <span className="font-semibold text-cream/60">Disclaimer:</span> Pricing data in this MVP is mock data for
        demonstration. A production version would require approved data sources, integrations, or manual/automated
        rate checks.
      </div>
    </div>
  );
}

function RateBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-cream/60">
        <span>{label}</span>
        <span className="font-semibold text-cream">{formatCurrency(value)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
