import { Icon, type IconName } from "@/components/icons";
import { features } from "@/lib/content";

export default function Features() {
  return (
    <section id="features" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Everything an estimator does manually — done in minutes
          </h2>
          <p className="mt-4 text-balance text-muted">
            AIEstimate doesn&apos;t just spit out a number. It runs the full
            takeoff-to-proposal workflow your best estimator already does — just faster.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:border-accent/40 hover:bg-surface"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-accent/20 to-accent-2/20 text-accent">
                <Icon name={feature.icon as IconName} className="h-5 w-5" />
              </div>
              <h3 className="mt-5 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
