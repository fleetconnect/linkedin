"use client";

import { Icon, IconName } from "./Icon";
import { cn } from "@/lib/utils";

export type SectionKey =
  | "overview"
  | "calendar"
  | "rooms"
  | "guests"
  | "pricing"
  | "booking"
  | "channels"
  | "housekeeping"
  | "roadmap";

export const sidebarItems: { key: SectionKey; label: string; icon: IconName }[] = [
  { key: "overview", label: "Overview", icon: "home" },
  { key: "calendar", label: "Calendar", icon: "calendar" },
  { key: "rooms", label: "Rooms", icon: "bed" },
  { key: "guests", label: "Guests", icon: "users" },
  { key: "pricing", label: "Pricing", icon: "chart" },
  { key: "booking", label: "Booking Flow", icon: "booking" },
  { key: "channels", label: "Channels", icon: "map" },
  { key: "housekeeping", label: "Housekeeping", icon: "sparkles" },
  { key: "roadmap", label: "Roadmap", icon: "route" },
];

export function Sidebar({
  active,
  onSelect,
  open,
  onClose,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-deep-navy/70 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-white/5 bg-deep-navy transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/15 ring-1 ring-gold/30">
            <span className="text-lg font-serif font-semibold text-gold">HK</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-cream leading-tight">Hotel Kaoba</p>
            <p className="text-[11px] uppercase tracking-wide text-cream/45">Command Center</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close navigation"
            className="ml-auto rounded-md p-1 text-cream/50 hover:bg-white/5 hover:text-cream lg:hidden"
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="Dashboard sections">
          {sidebarItems.map((item) => {
            const isActive = item.key === active;
            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
                  isActive
                    ? "bg-gold/15 text-gold ring-1 ring-gold/30"
                    : "text-cream/65 hover:bg-white/5 hover:text-cream"
                )}
              >
                <Icon
                  name={item.icon}
                  className={cn("h-[18px] w-[18px]", isActive ? "text-gold" : "text-cream/40 group-hover:text-cream/70")}
                />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/5 px-4 py-4">
          <div className="rounded-lg bg-tropical-green/10 p-3 ring-1 ring-tropical-green/20">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-tropical-green">
              <Icon name="sparkles" className="h-3.5 w-3.5" />
              Demo Mode
            </p>
            <p className="mt-1 text-xs leading-snug text-cream/55">
              All data is seeded locally. No live PMS, OTA, or payment connection.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
