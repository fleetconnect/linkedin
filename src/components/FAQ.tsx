import { faqs } from "@/lib/content";

export default function FAQ() {
  return (
    <section id="faq" className="border-t border-border py-24 sm:py-32">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="text-balance text-center text-3xl font-semibold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>

        <div className="mt-12 divide-y divide-border rounded-2xl border border-border bg-surface/40">
          {faqs.map((faq) => (
            <details key={faq.question} className="group p-6 open:bg-surface-2/40">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
                {faq.question}
                <span className="shrink-0 text-muted transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
