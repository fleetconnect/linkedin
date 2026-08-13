import { Icon, IconName } from "./Icon";
import { ActivityLogItem } from "@/lib/mockData";
import { timeAgo } from "@/lib/utils";

const iconColor: Record<string, string> = {
  "calendar-plus": "text-teal",
  "check-in": "text-tropical-green",
  sparkles: "text-gold",
  whatsapp: "text-tropical-green",
  "trending-up": "text-teal",
  booking: "text-gold",
  wrench: "text-coral",
  note: "text-cream/60",
};

export function ActivityLog({ items }: { items: ActivityLogItem[] }) {
  return (
    <div className="rounded-xl2 border border-white/5 bg-navy/60 p-5 shadow-card">
      <p className="flex items-center gap-2 text-sm font-semibold text-cream">
        <Icon name="history" className="h-4 w-4 text-gold" />
        Activity Log
      </p>
      <ul className="mt-4 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 ring-1 ring-white/10">
              <Icon name={item.icon as IconName} className={`h-4 w-4 ${iconColor[item.icon] ?? "text-cream/60"}`} />
            </span>
            <div className="min-w-0">
              <p className="text-sm text-cream/85">{item.description}</p>
              <p className="mt-0.5 text-xs text-cream/40">
                {item.staff} · {timeAgo(item.minutesAgo)}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
