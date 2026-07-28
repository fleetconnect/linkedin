# Hero plate sources

All six plates are **Pexels** stock, downloaded via the Pexels image CDN.

**Licence:** [Pexels License](https://www.pexels.com/license/) — free for commercial
use, no attribution required, modification permitted. No licence fee was spent and no
credits were consumed.

| Plate | Pexels ID | Page | Concept |
|---|---|---|---|
| `A08.jpg` | 20333182 | [/photo/20333182](https://www.pexels.com/photo/20333182/) | Somebody should see further than your headlights |
| `A11.jpg` | 29206467 | [/photo/29206467](https://www.pexels.com/photo/29206467/) | The wheel never stops |
| `A12.jpg` | 2348359  | [/photo/2348359](https://www.pexels.com/photo/2348359/)   | Thirty trucks. One light on. |
| `A15.jpg` | 33256290 | [/photo/33256290](https://www.pexels.com/photo/33256290/) | Still moving |
| `A18.jpg` | 27099095 | [/photo/27099095](https://www.pexels.com/photo/27099095/) | Stay driving |
| `A24.jpg` | 33262905 | [/photo/33262905](https://www.pexels.com/photo/33262905/) | Booked |

## Crops are load-bearing — do not reframe without re-checking

Three plates are cropped specifically to remove third-party carrier livery. The
`background-size` / `background-position` values in each layout are not aesthetic
choices; changing them can put a real fleet's brand back in the ad.

- **A08** — `66% 46%` pushes a Turkish trailer ("ÇAĞANLAR") off the left edge.
- **A12** — `185% / 84% 40%` zooms past a readable **SWIFT** trailer.
- **A24** — `225% / 14% 78%` crops out a **HIGH ROAD** trailer.

## Known residual issues

- **A24** has a readable licence plate low in the frame and small illegible lettering
  on the sleeper door. Both are minor at feed size; clone them out before paid spend.
- **A18** is the most conventional frame in the set — bright, clean, midday. It is the
  weakest against the "doesn't look like an ad" test and should be the first replaced
  when better iron is shot or licensed.
- **A15** is a tarped flatbed of non-US origin, but is abstract enough at this crop
  that it reads as universal.

## Rejected during selection

Smiling/waving driver (breaks the brief's ban), DAF and Vietnamese cab-overs, an
Australian road train, a mining tyre, and a night fuel station carrying **BHPetrol**
branding — all failed the livery or non-US-cab rules in `campaign/CINEMATIC.md`.
