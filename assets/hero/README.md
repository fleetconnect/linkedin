# Hero plates

Drop the hero photographs here, then run:

    ./build/place-hero.sh A03 assets/hero/A03.jpg

## Assignments for the five supplied frames

| File to save as | Frame | Concept | Lockup |
|---|---|---|---|
| `A03.jpg` | Driver walking away from blue Peterbilt, sunrise, open road | **NEVER NEGOTIATE ALONE** | Lower third |
| `A11.jpg` | Drive tyres on wet asphalt, storm light, low macro | **THE WHEEL NEVER STOPS** | Corner plate |
| `A18.jpg` | Peterbilt head-on, interstate, motion | **STAY DRIVING** | Letterbox |
| `A24.jpg` | Black long-hood Peterbilt 389, side profile | **BOOKED** | Corner plate |
| `A01.jpg` | Blue Peterbilt + reefer at loading docks, golden light | **THE OFFICE** | Lower third |

All five layouts already carry `.crop-wm`, which zooms 116% and shifts the frame up
so the bottom-right AI sparkle watermark falls outside the canvas. Check each render
and adjust `background-position` in `_cinematic.css` if a watermark survives.
