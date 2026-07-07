# AIestimate

Landing page for [www.aiestimate.org](https://www.aiestimate.org) — AI
takeoff-to-proposal software for roofing and siding contractors.

Single self-contained `index.html`. No build step, no dependencies to
install — just open the file or serve the directory.

## Stack notes

- Hero includes a self-assembling wireframe house built with three.js r128
  (loaded from the cdnjs CDN as a classic `<script>`, no bundler).
  Vertices scatter in and converge with a cubic ease-out, dimension
  callouts are projected from 3D anchor points onto HTML overlays each
  frame, and the render loop pauses via `IntersectionObserver` when the
  panel scrolls offscreen.
- `prefers-reduced-motion` skips the animation entirely and renders the
  final assembled state.
- If WebGL is unavailable, the panel falls back to a static grid of the
  same measurement callouts (see `.no-webgl` in the CSS / `showFallback()`
  in the script).
- Fonts (Barlow Condensed, IBM Plex Sans, IBM Plex Mono) load from Google
  Fonts with `display=swap`. Those two requests plus the three.js CDN
  script are the only external requests the page makes.

## Local preview

```bash
python3 -m http.server 8000
```

Open [http://localhost:8000/index.html](http://localhost:8000/index.html).

## Deploy

Connected to Vercel via Git integration. Because this is a plain static
file with no `package.json`, make sure the Vercel project's Framework
Preset is set to **Other** (no build command, output directory `.`) —
pushes to the tracked branch then produce a preview deployment, and
merges to `main` deploy to production.
