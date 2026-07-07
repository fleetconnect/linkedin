import HeroCanvas from "@/components/three/HeroCanvas";
import { heroStats } from "@/lib/content";

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,black,transparent)]" />
      <HeroCanvas />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-background/20 via-background/40 to-background" />

      <div className="mx-auto flex max-w-6xl flex-col items-center px-6 pt-28 pb-24 text-center sm:pt-36 sm:pb-32">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-4 py-1.5 text-xs font-medium text-muted backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Now estimating renovations, remodels & new builds
        </div>

        <h1 className="text-balance max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
          Turn blueprints into{" "}
          <span className="gradient-text">bulletproof estimates</span> in minutes
        </h1>

        <p className="text-balance mt-6 max-w-2xl text-lg text-muted sm:text-xl">
          AIEstimate reads your plans, photos, and scope of work, then generates
          line-item labor and material costs you can trust — so you bid faster
          and win more jobs.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="#cta"
            className="w-full rounded-full bg-foreground px-7 py-3.5 text-center text-sm font-semibold text-background transition-transform hover:scale-[1.03] sm:w-auto"
          >
            Start estimating free
          </a>
          <a
            href="#how-it-works"
            className="w-full rounded-full border border-border bg-surface/60 px-7 py-3.5 text-center text-sm font-semibold text-foreground backdrop-blur transition-colors hover:bg-surface-2 sm:w-auto"
          >
            See how it works
          </a>
        </div>

        <dl className="mt-20 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-border pt-10">
          {heroStats.map((stat) => (
            <div key={stat.label}>
              <dt className="sr-only">{stat.label}</dt>
              <dd className="text-2xl font-semibold sm:text-3xl">{stat.value}</dd>
              <p className="mt-1 text-xs text-muted sm:text-sm">{stat.label}</p>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
