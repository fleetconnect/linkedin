# Linx Dispatch — LinkedIn Creative Set

Ten conversion-oriented creatives targeting truck owners (owner-operators and
small fleets, 1–10 trucks) for **Linx Dispatch**'s Free Dispatch Fit Review offer.

| | |
|---|---|
| **Format** | 1080 × 1350 (LinkedIn 4:5), exported at 2× → 2160 × 2700 PNG |
| **Design system** | [`DESIGN-PHILOSOPHY.md`](DESIGN-PHILOSOPHY.md) — *Freight Ledger* |
| **Copy + post captions** | [`COPY-DECK.md`](COPY-DECK.md) |
| **Exports** | [`out/`](out/) |
| **Source** | [`build/creatives/`](build/creatives/) |

## The ten

| # | Creative | Angle |
|---|----------|-------|
| 01 | One-Man Call Center | Identity gap |
| 02 | 11:47 PM | Validation — the exact moment |
| 03 | $1.80 | Reframe — structural, not personal, failure |
| 04 | The Revenue Swing | Volatility as the enemy (chart) |
| 05 | "That's the best I can do." | Villain + `+$440/load` proof |
| 06 | Before / After | Direct comparison |
| 07 | The Invisible Invoice | Cost of inaction — `$2,000–$4,000/mo` |
| 08 | The Truck Owns Me | Emotional reversal |
| 09 | Meet Your Dispatcher | Authority and trust |
| 10 | Free Dispatch Fit Review | The offer |

## Rebuilding

```bash
./build/render.sh                       # all ten
./build/render.sh 04-revenue-swing.html # one
```

Renders with the bundled Chromium `headless_shell` at `--force-device-scale-factor=2`.
Note: full `chrome --headless=new` does **not** honour `--window-size` exactly and
crops the canvas — use the script.

Fonts (Big Shoulders, Geist Mono, Instrument Sans/Serif, Young Serif — all OFL) are
vendored in [`assets/fonts/`](assets/fonts/) and referenced by relative path, so the
HTML renders identically offline.

## Resizing for other placements

Each creative is a self-contained HTML file with a fixed `.canvas`. For a 1:1 or
16:9 variant, change `--window-size` in `build/render.sh` and the `html,body`/
`.canvas` dimensions in `build/creatives/base.css`; the layouts are flex-based and
reflow, though headline sizes will want a pass by eye.

## Before running paid media

`COPY-DECK.md` ends with a claims checklist. In short: the chart in creative 04 is
labelled illustrative on the image itself, the invoice line items in creative 07 are
an illustrative split of the site's published `$2,000–$4,000` figure, and the named
testimonial in creative 05 should be confirmed as cleared for paid use.
