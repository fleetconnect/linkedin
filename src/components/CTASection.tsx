export default function CTASection() {
  return (
    <section id="cta" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          Stop losing bids to slow estimates
        </h2>
        <p className="text-balance mx-auto mt-4 max-w-xl text-muted">
          Get your first AI-generated estimate in the next ten minutes. No
          credit card required to start.
        </p>

        <form className="mx-auto mt-8 flex max-w-md flex-col gap-3 sm:flex-row" action="#">
          <label htmlFor="work-email" className="sr-only">
            Work email
          </label>
          <input
            id="work-email"
            type="email"
            required
            placeholder="you@company.com"
            className="w-full rounded-full border border-border bg-surface px-5 py-3 text-sm outline-none placeholder:text-muted focus:border-accent"
          />
          <button
            type="submit"
            className="shrink-0 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.03]"
          >
            Start free trial
          </button>
        </form>
        <p className="mt-4 text-xs text-muted">
          14-day free trial &middot; No credit card required &middot; Cancel anytime
        </p>
      </div>
    </section>
  );
}
