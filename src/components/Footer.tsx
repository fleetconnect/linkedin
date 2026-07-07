import { nav, site } from "@/lib/content";

export default function Footer() {
  return (
    <footer className="border-t border-border py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-sm text-muted sm:flex-row">
        <div className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-accent to-accent-2 text-xs font-bold text-background">
            A
          </span>
          {site.name}
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-6">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-foreground">
              {item.label}
            </a>
          ))}
        </nav>

        <p>&copy; {new Date().getFullYear()} {site.name}. All rights reserved.</p>
      </div>
    </footer>
  );
}
