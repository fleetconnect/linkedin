import { steps } from "@/lib/content";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            From scope to signed job, in four steps
          </h2>
          <p className="mt-4 text-balance text-muted">
            No new software to learn on the jobsite — just upload what you have.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <div key={step.step} className="relative">
              <div className="text-sm font-mono text-accent">{step.step}</div>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{step.description}</p>
              {i < steps.length - 1 && (
                <div
                  className="absolute right-[-1rem] top-2 hidden h-px w-8 bg-gradient-to-r from-border to-transparent lg:block"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
