"use client";

import { Icon } from "./Icon";
import { channels } from "@/lib/mockData";
import { channelStatusStyles, cn } from "@/lib/utils";

const PRIORITIES = [
  "Direct website booking/request flow",
  "Manual source tracking",
  "Airbnb/Booking.com import planning",
  "Channel sync feasibility review",
  "OTA integration roadmap",
];

export function ChannelMap() {
  const radius = 42; // percent
  const nodes = channels.map((channel, i) => {
    const angle = (i / channels.length) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    return { channel, x, y };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-xl2 border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-cream/70">
        A full production version would need real channel manager integrations or approved API/partner connections.
        MVP focuses on mapping reservations and sources before automating distribution.
      </div>

      {/* Radial map — desktop/tablet */}
      <div className="relative mx-auto hidden aspect-square max-w-2xl rounded-xl2 border border-white/5 bg-navy/50 shadow-card md:block">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.map(({ x, y }, i) => (
            <line key={i} x1={50} y1={50} x2={x} y2={y} stroke="rgba(217,164,65,0.25)" strokeWidth={0.4} />
          ))}
        </svg>

        {/* Center node */}
        <div className="absolute left-1/2 top-1/2 flex w-40 -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1.5 rounded-xl2 border border-gold/40 bg-deep-navy px-4 py-4 text-center shadow-panel">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/20 ring-1 ring-gold/40">
            <span className="text-sm font-serif font-semibold text-gold">HK</span>
          </div>
          <p className="text-xs font-semibold leading-tight text-cream">Hotel Kaoba Command Center</p>
        </div>

        {nodes.map(({ channel, x, y }) => {
          const styles = channelStatusStyles[channel.status];
          return (
            <div
              key={channel.id}
              style={{ left: `${x}%`, top: `${y}%` }}
              className="absolute w-36 -translate-x-1/2 -translate-y-1/2 rounded-xl2 border border-white/10 bg-navy/90 p-3 text-center shadow-card transition hover:-translate-y-[calc(50%+2px)] hover:border-gold/30"
            >
              <p className="text-xs font-semibold text-cream">{channel.name}</p>
              <span className={cn("mt-1.5 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold", styles.bg, styles.text)}>
                {channel.status}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stacked list — mobile */}
      <div className="space-y-3 md:hidden">
        <div className="flex items-center gap-2 rounded-xl2 border border-gold/40 bg-deep-navy px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/20 ring-1 ring-gold/40">
            <span className="text-xs font-serif font-semibold text-gold">HK</span>
          </div>
          <p className="text-sm font-semibold text-cream">Hotel Kaoba Command Center</p>
        </div>
        {channels.map((channel) => {
          const styles = channelStatusStyles[channel.status];
          return (
            <div key={channel.id} className="ml-4 flex items-center justify-between gap-2 rounded-xl2 border border-white/10 bg-navy/70 px-4 py-3">
              <span className="text-sm text-cream">{channel.name}</span>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", styles.bg, styles.text)}>{channel.status}</span>
            </div>
          );
        })}
      </div>

      {/* Channel descriptions */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {channels.map((channel) => {
          const styles = channelStatusStyles[channel.status];
          return (
            <div key={channel.id} className="rounded-xl2 border border-white/5 bg-navy/60 p-4 shadow-card">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-cream">{channel.name}</p>
                <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", styles.bg, styles.text)}>
                  {channel.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-cream/55">{channel.description}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card">
        <p className="flex items-center gap-2 text-sm font-semibold text-gold">
          <Icon name="target" className="h-4 w-4" />
          Distribution Priorities
        </p>
        <ol className="mt-3 space-y-2">
          {PRIORITIES.map((p, i) => (
            <li key={p} className="flex items-start gap-3 text-sm text-cream/75">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold/15 text-[11px] font-semibold text-gold ring-1 ring-gold/30">
                {i + 1}
              </span>
              {p}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
