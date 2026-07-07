import { testimonials } from "@/lib/content";

export default function SocialProof() {
  return (
    <section id="results" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for the way estimators actually work
          </h2>
          <p className="mt-4 text-balance text-muted">
            Illustrative examples of the outcomes AIEstimate is designed to deliver.
          </p>
        </div>

        <div className="mt-16 grid gap-6 lg:grid-cols-3">
          {testimonials.map((t) => (
            <figure
              key={t.role}
              className="flex flex-col justify-between rounded-2xl border border-border bg-surface/40 p-6"
            >
              <blockquote className="text-sm leading-relaxed text-foreground/90">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 text-xs font-medium text-muted">
                {t.role}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
