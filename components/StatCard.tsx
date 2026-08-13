import { Icon, IconName } from "./Icon";
import { cn } from "@/lib/utils";

type Accent = "gold" | "green" | "teal" | "coral";

const accentStyles: Record<Accent, { bg: string; text: string; ring: string }> = {
  gold: { bg: "bg-gold/15", text: "text-gold", ring: "ring-gold/30" },
  green: { bg: "bg-tropical-green/15", text: "text-tropical-green", ring: "ring-tropical-green/30" },
  teal: { bg: "bg-teal/15", text: "text-teal", ring: "ring-teal/30" },
  coral: { bg: "bg-coral/15", text: "text-coral", ring: "ring-coral/30" },
};

export function StatCard({
  label,
  value,
  icon,
  accent = "teal",
  sublabel,
}: {
  label: string;
  value: string;
  icon: IconName;
  accent?: Accent;
  sublabel?: string;
}) {
  const styles = accentStyles[accent];
  return (
    <div className="group relative overflow-hidden rounded-xl2 border border-white/5 bg-navy/70 p-5 shadow-card transition hover:-translate-y-0.5 hover:border-gold/30">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-cream/50">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-cream">{value}</p>
          {sublabel && <p className="mt-1 text-xs text-cream/45">{sublabel}</p>}
        </div>
        <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1", styles.bg, styles.ring)}>
          <Icon name={icon} className={cn("h-5 w-5", styles.text)} />
        </div>
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-gold/5 opacity-0 transition group-hover:opacity-100" />
    </div>
  );
}
