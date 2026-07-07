# AIEstimate

Landing page for [www.aiestimate.org](https://www.aiestimate.org) — an
AI-powered construction & renovation estimating product.

Built with Next.js (App Router), TypeScript, Tailwind CSS, and a
[react-three-fiber](https://docs.pmnd.rs/react-three-fiber)/three.js hero
scene.

## Stack notes

- The 3D hero (`src/components/three/`) is code-split and loaded client-only
  (`next/dynamic` with `ssr: false`), and pauses automatically when the tab
  is hidden or the visitor has `prefers-reduced-motion` set.
- OG image, favicon, and apple touch icon are generated at build time via
  `next/og` (`src/app/opengraph-image.tsx`, `icon.tsx`, `apple-icon.tsx`).
- `robots.ts` / `sitemap.ts` use the Next.js Metadata Route conventions.
- All copy lives in `src/lib/content.ts`. The testimonials there are
  illustrative placeholders — swap in real customer quotes before launch.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm run build   # production build
npm run lint    # eslint
```

## Deploy

Connected to Vercel via Git integration — pushes to the tracked branch
produce a preview deployment, and merges to `main` deploy to production.
