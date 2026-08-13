/**
 * Shared helpers for Hotel Kaoba Command Center.
 * No backend, no external calls — pure formatting / mock-data utilities.
 */

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number) {
  return `$${amount.toLocaleString("en-US")}`;
}

export function formatCurrencyPrecise(amount: number) {
  return `$${amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Returns today's date shifted by `offset` days (can be negative). */
export function dateFromOffset(offset: number, base: Date = new Date()): Date {
  const d = new Date(base);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function formatDateShort(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export function formatDateLong(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatMonthDay(d: Date): string {
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Builds a rolling N-day window of Date objects starting today. */
export function getDateWindow(days: number, base: Date = new Date()): Date[] {
  return Array.from({ length: days }, (_, i) => dateFromOffset(i, base));
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function timeAgo(minutesAgo: number): string {
  if (minutesAgo < 1) return "Just now";
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const hours = Math.floor(minutesAgo / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Tailwind class bundles keyed by status, used across the app for consistent badges. */
export const reservationStatusStyles: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  Confirmed: {
    bg: "bg-teal/15",
    text: "text-teal",
    border: "border-teal/40",
    dot: "bg-teal",
  },
  "Checked In": {
    bg: "bg-tropical-green/20",
    text: "text-tropical-green",
    border: "border-tropical-green/40",
    dot: "bg-tropical-green",
  },
  Pending: {
    bg: "bg-gold/15",
    text: "text-gold",
    border: "border-gold/40",
    dot: "bg-gold",
  },
  "Maintenance Block": {
    bg: "bg-coral/15",
    text: "text-coral",
    border: "border-coral/40",
    dot: "bg-coral",
  },
  "Courtesy Hold": {
    bg: "bg-muted/20",
    text: "text-cream/80",
    border: "border-muted/40",
    dot: "bg-muted",
  },
};

export const roomStatusStyles: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  Available: {
    bg: "bg-tropical-green/15",
    text: "text-tropical-green",
    border: "border-tropical-green/40",
    dot: "bg-tropical-green",
  },
  Occupied: {
    bg: "bg-teal/15",
    text: "text-teal",
    border: "border-teal/40",
    dot: "bg-teal",
  },
  Dirty: {
    bg: "bg-coral/15",
    text: "text-coral",
    border: "border-coral/40",
    dot: "bg-coral",
  },
  Maintenance: {
    bg: "bg-muted/20",
    text: "text-cream/80",
    border: "border-muted/50",
    dot: "bg-muted",
  },
  Reserved: {
    bg: "bg-gold/15",
    text: "text-gold",
    border: "border-gold/40",
    dot: "bg-gold",
  },
};

export const paymentStatusStyles: Record<string, { bg: string; text: string }> = {
  Paid: { bg: "bg-tropical-green/15", text: "text-tropical-green" },
  Partial: { bg: "bg-gold/15", text: "text-gold" },
  Unpaid: { bg: "bg-coral/15", text: "text-coral" },
};

export const followUpStatusStyles: Record<string, { bg: string; text: string }> = {
  None: { bg: "bg-muted/15", text: "text-cream/60" },
  Due: { bg: "bg-coral/15", text: "text-coral" },
  Scheduled: { bg: "bg-gold/15", text: "text-gold" },
  Completed: { bg: "bg-tropical-green/15", text: "text-tropical-green" },
};

export const channelStatusStyles: Record<string, { bg: string; text: string }> = {
  "Connected Mock": { bg: "bg-tropical-green/15", text: "text-tropical-green" },
  Planned: { bg: "bg-gold/15", text: "text-gold" },
  "Future Integration": { bg: "bg-teal/15", text: "text-teal" },
  "Manual Import": { bg: "bg-muted/20", text: "text-cream/70" },
};

export const housekeepingStatusStyles: Record<string, { bg: string; text: string; border: string }> = {
  Dirty: { bg: "bg-coral/15", text: "text-coral", border: "border-coral/40" },
  Cleaning: { bg: "bg-gold/15", text: "text-gold", border: "border-gold/40" },
  Inspection: { bg: "bg-teal/15", text: "text-teal", border: "border-teal/40" },
  Ready: { bg: "bg-tropical-green/15", text: "text-tropical-green", border: "border-tropical-green/40" },
  Maintenance: { bg: "bg-muted/20", text: "text-cream/80", border: "border-muted/50" },
};
