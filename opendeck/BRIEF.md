# OPEN DECK — flatbed · step deck · heavy haul
### One audience, three brands, and a positioning conflict to resolve

---

## The conflict, stated plainly

**Linx Dispatch and Final 4 Logistics are both dispatch companies, and this brief points
both of them at the same owner-operator.** If they run to the same audience they compete
for the same click, bid each other's costs up, and split a market neither one wins
outright.

Final 4 is the natural winner here and it isn't close:

| | Final 4 Logistics | Linx Dispatch |
|---|---|---|
| Positioning | **"We move oversize loads, the right way."** Open deck is the entire company | Generalist — dry van, reefer, flatbed, hotshot, box, tanker |
| Equipment depth | Flatbed, step deck, RGN, oversize; permits and route planning as a named service | Flatbed listed among six equipment types |
| Proof | Four named testimonials with company names; 25+ years | 100+ carriers; founder with 20+ years |
| Credibility to this buyer | Specialist | Competent generalist |

**Recommendation:** run **Final 4 as the specialist play** to flatbed / step deck /
heavy haul, and point **Linx at the mixed-equipment operator** — the owner running a
flatbed *and* a van, or a small fleet with two equipment types who wants one dispatcher
across all of it. That is a real, defensible segment Final 4 doesn't serve, and it stops
the two brands bidding against each other.

**FleetConnect doesn't conflict at all.** It sells B2B. Against this audience its job is
recruiting open-deck operators *for* carriers — a genuinely harder problem, because the
qualified pool is tiny.

---

## What is actually true about this audience

Open deck operators are not dry van drivers with a different trailer. The work is
different, the money is different, and the failure modes are different. Everything in
these creatives comes from that.

**The work you don't get paid for.** Tarping is the most hated job in trucking. Chains,
binders, straps, corner protectors, and forty-five minutes on the shoulder in the rain
before you turn a wheel. Tarp pay and securement time are real line items and most
operators never negotiate them.

**Permits are a second job.** Oversize means state-by-state permits, route surveys,
escort/pilot car coordination, curfew windows, bridge restrictions, and states that
don't allow oversize movement on Sundays or holidays. Getting this wrong doesn't cost
you time — it costs you a ticket and a shut-down load.

**The numbers everyone in this segment knows by heart.** 8'6" legal width. 13'6" legal
height. 80,000 lb gross. Anything past that changes the rules.

**The equipment vocabulary is a credibility test.** Flatbed, step deck, double drop,
RGN, lowboy, stretch. A dispatcher who books an RGN load onto a step deck has just cost
the operator a day, and everyone in the segment has a story about it.

**Deadhead is worse.** Open deck freight is lumpier than van freight. Backhauls are
harder to find and cost more to miss.

**The single strongest insight for the dispatch brands:**

> A dispatcher who doesn't know open deck is worse than no dispatcher at all.
> They will book you something that cannot legally move.

That is the wedge. Every Final 4 creative in this set turns on it.

---

## Brand systems

Three brands must not look related. They already differ on the two Linx/FleetConnect
axes; Final 4 gets a third, distinct one.

| | Linx Dispatch | FleetConnect | Final 4 Logistics |
|---|---|---|---|
| System | *Freight Ledger* | *Signal* | *Load Board* |
| Ground | asphalt `#0A0F1A` | violet-black `#08060f` | navy `#0E1018` |
| Accent | amber `#FFB020` | champagne gold `#d4b678` | safety green `#3DBE6E` |
| Display | Big Shoulders (condensed industrial) | Sora (geometric premium) | National Park (US highway signage) |
| Signature device | credit block | status line + violet bloom | the black-and-yellow **OVERSIZE LOAD** banner |

**On the Final 4 palette:** their site is client-rendered, so the only colour I could
extract from source is `rgb(24,25,39)`. Navy + green + white is from their site
description, and the exact green `#3DBE6E` is my approximation — swap it for the real
brand green in `build/opendeck/_od.css` (`--f4-green`) and re-render.

---

## Claims

- Final 4's four testimonials are real, named, and quoted verbatim from their site
  (Jerod / Lacy & Bros Hauling · John / Blu Mule Transport · Nicholas / N Leiba
  Transportation · Jims / IP-Diamond). **Confirm they are cleared for paid media**
  before spending — site testimonials and ad testimonials are different consent bars.
- "25+ years experience," the flatbed/step deck/RGN/oversize specialisms, permit and
  route-planning support, nationwide coverage, no forced dispatch, and 24/7 access are
  all Final 4's own published claims.
- 8'6", 13'6" and 80,000 lb are federal legal limits, not performance claims.
- No rate figures, no income claims, no invented averages anywhere in this set.

---

# THE CREATIVES

20 pieces, all 1080 × 1350 (4:5) at 2×. Renders in [`../out/opendeck/`](../out/opendeck/),
source in [`../build/opendeck/`](../build/opendeck/).
Rebuild: `python3 build/opendeck/gen.py && ./build/render-od.sh`

## Final 4 — the specialist play (6 singles + 6-slide carousel)

| File | Line |
|---|---|
| `F4-01-cant-move` | Ever been booked on a load that **couldn't legally move?** |
| `F4-02-136` | **13'6"** — everything over that line is a permit, a survey, an escort and a curfew |
| `F4-03-chains` | **Nobody pays you to throw chains** — four unpaid line items |
| `F4-04-oversize` | OVERSIZE LOAD banner → **It isn't a checkbox. It's a second job.** |
| `F4-05-vocabulary` | Step deck / double drop / RGN — **know the difference before you book me** |
| `F4-06-offer` | **We move oversize loads, the right way** — 25+ yrs · 24/7 · no forced dispatch |
| `F4-C1-01…06` | *Four numbers your dispatcher has to know* — 8'6" → 13'6" → 80,000 lb → permits |

**Caption for F4-01:**
> Every open deck operator has a story about a dispatcher who booked them something that
> couldn't legally move. Wrong trailer. No permit. A state that doesn't allow the move on
> a Sunday.
>
> That's not a bad day. That's a dispatcher who doesn't know the equipment — which is
> worse than not having one.

**Caption for F4-03:**
> The rate covers the miles. It doesn't cover the forty-five minutes you spent throwing
> chains on the shoulder, or the tarp you fought in the rain, or the crane you waited on
> at a jobsite with no dock.
>
> Tarp pay and securement time are line items. Most operators never ask for them.

## Linx — the mixed-equipment operator (4 singles)

`LX-01` you run a flatbed *and* a van *and* sometimes a hotshot · `LX-02` two trailers,
two rate structures, one person who knows both · `LX-03` some weeks the flatbed pays,
some weeks the van does · `LX-04` one dispatcher, all six equipment types

Deliberately does **not** compete with Final 4 on heavy haul or permits.

## FleetConnect — recruiting open-deck operators (4 singles)

`FCO-01` you can't post your way to a heavy haul driver · `FCO-02` every open deck
carrier is recruiting from the same short list · `FCO-03` the same eleven-part install,
configured for open deck · `FCO-04` the offer, guarantee caveat included

## Run order

Final 4 leads. `F4-01` and the `F4-C1` carousel for cold; `F4-03` and `F4-04` for
problem-aware; `F4-06` to close. Linx runs only to mixed-equipment targeting.
FleetConnect runs to carriers and fleets, never to owner-operators.
