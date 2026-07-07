import { pricing } from "@/lib/content";

export default function Pricing() {
  return (
    <section id="pricing" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Simple pricing, built to pay for itself on the first job
          </h2>
          <p className="mt-4 text-balance text-muted">
            Every plan includes a 14-day free trial. Cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {pricing.map((tier) => (
            <div
              key={tier.name}
              className={`flex flex-col rounded-2xl border p-8 ${
                tier.highlighted
                  ? "border-accent bg-surface-2 shadow-[0_0_0_1px_rgba(56,189,248,0.3)]"
                  : "border-border bg-surface/40"
              }`}
            >
              {tier.highlighted && (
                <span className="mb-4 w-fit rounded-full bg-accent/15 px-3 py-1 text-xs font-medium text-accent">
                  Most popular
                </span>
              )}
              <h3 className="font-semibold">{tier.name}</h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-3xl font-semibold">{tier.price}</span>
                <span className="text-sm text-muted">{tier.period}</span>
              </div>
              <p className="mt-3 text-sm text-muted">{tier.description}</p>

              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <span className="text-foreground/90">{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href="#cta"
                className={`mt-8 rounded-full px-5 py-3 text-center text-sm font-semibold transition-transform hover:scale-[1.03] ${
                  tier.highlighted
                    ? "bg-foreground text-background"
                    : "border border-border bg-surface text-foreground"
                }`}
              >
                {tier.cta}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
