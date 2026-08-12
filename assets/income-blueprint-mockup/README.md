# Income Blueprint — Box Mockup

Premium 3D digital-product box mockup for **"THE ONLINE INCOME BLUEPRINT"** by Income Architecture™.

- `income-blueprint-box-mockup.png` — final render, 2400×1350 (16:9), ready for a website product carousel.
- `source.html` — self-contained HTML/CSS source (no build step). Open in a browser to preview, or re-render at higher resolution with a headless browser screenshot.
- `fonts/` — Big Shoulders (Google Fonts, SIL Open Font License), used for the cover/spine typography.

## Regenerating the PNG

```bash
npx playwright screenshot --viewport-size=2400,1350 source.html income-blueprint-box-mockup.png
```

(or drive Chromium/Playwright directly and screenshot the `2400×1350` page — the HTML sizes itself to that canvas.)
