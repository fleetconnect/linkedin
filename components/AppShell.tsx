"use client";

import { useState } from "react";
import { Sidebar, SectionKey, sidebarItems } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Icon } from "./Icon";

export interface ToastItem {
  id: number;
  message: string;
}

export function AppShell({
  active,
  onSelect,
  searchQuery,
  onSearchChange,
  roleLabel,
  toasts,
  children,
}: {
  active: SectionKey;
  onSelect: (key: SectionKey) => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  roleLabel: string;
  toasts: ToastItem[];
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const sectionLabel = sidebarItems.find((s) => s.key === active)?.label ?? "Overview";

  return (
    <div className="flex min-h-screen bg-deep-navy">
      <Sidebar active={active} onSelect={onSelect} open={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col lg:w-[calc(100%-18rem)]">
        <TopBar
          onMenuClick={() => setMobileOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          roleLabel={roleLabel}
          sectionLabel={sectionLabel}
        />
        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </main>
        <footer className="border-t border-white/5 px-6 py-4 text-center text-xs text-cream/35">
          Hotel Kaoba Command Center — a proprietary MVP demo. Not affiliated with, and does not connect to, any
          third-party PMS.
        </footer>
      </div>

      {/* Toast stack */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className="pointer-events-auto flex items-start gap-2 rounded-lg border border-gold/30 bg-navy px-4 py-3 text-sm text-cream shadow-panel animate-fadeIn"
          >
            <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-tropical-green" />
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
