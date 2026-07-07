import Link from "next/link";
import { nav, site } from "@/lib/content";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="#top" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-sm font-bold text-background">
            A
          </span>
          {site.name}
        </Link>

        <nav className="hidden items-center gap-8 text-sm text-muted md:flex">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="#pricing"
            className="hidden text-sm text-muted transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </a>
          <a
            href="#cta"
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-transform hover:scale-[1.03]"
          >
            Start free trial
          </a>
        </div>
      </div>
    </header>
  );
}
