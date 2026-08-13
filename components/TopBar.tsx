"use client";

import { Icon } from "./Icon";
import { formatDateLong } from "@/lib/utils";

export function TopBar({
  onMenuClick,
  searchQuery,
  onSearchChange,
  roleLabel,
  sectionLabel,
}: {
  onMenuClick: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleLabel: string;
  sectionLabel: string;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/5 bg-deep-navy/90 backdrop-blur">
      <div className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onMenuClick}
          aria-label="Open navigation"
          className="rounded-md p-2 text-cream/70 hover:bg-white/5 hover:text-cream lg:hidden"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-cream sm:text-base">
            Hotel Kaoba Command Center
            <span className="ml-2 hidden text-cream/35 sm:inline">/ {sectionLabel}</span>
          </p>
          <p className="text-xs text-cream/45">{formatDateLong(new Date())}</p>
        </div>

        <div className="relative ml-0 flex-1 sm:ml-4 sm:max-w-sm">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/35" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search guest, room, or reservation"
            aria-label="Search guest, room, or reservation"
            className="w-full rounded-lg border border-white/10 bg-navy/60 py-2 pl-9 pr-3 text-sm text-cream placeholder:text-cream/35 focus:border-gold/50 focus:outline-none"
          />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full bg-tropical-green/15 px-3 py-1.5 text-xs font-semibold text-tropical-green ring-1 ring-tropical-green/30 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-tropical-green" />
            Demo Mode
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-navy/70 px-3 py-1.5 text-xs font-medium text-cream/70 ring-1 ring-white/10">
            <Icon name="crown" className="h-3.5 w-3.5 text-gold" />
            {roleLabel}
          </span>
        </div>
      </div>
    </header>
  );
}
