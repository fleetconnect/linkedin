# FLEETCONNECT — COPY DECK

Six single ads and three carousels. All 1080 × 1350 (4:5), exported at 2× → 2160 × 2700.
Renders in [`../out/fc/`](../out/fc/) · source in [`../build/fc/`](../build/fc/) ·
rebuild with `python3 build/fc/gen.py && ./build/render-fc.sh`

> **Before anything runs:** no creative carries a URL, because `fleetconnect.pro` has
> expired and is on a Porkbun auction page. Put the live domain in `FOOT_R` at the top
> of `build/fc/gen.py`, regenerate, re-render. Do not ship these pointing at a dead
> domain.

---

## The argument the whole set makes

Fleet owners think they have a **volume** problem — not enough applicants. They have a
**latency** problem. A driver applies to five or six carriers in one sitting, usually
at night, and signs with whoever calls back first. Not the best offer. The first one.

Every piece below resolves to that and nothing else.

---

# SINGLE ADS

## FC01 · GHOST — *the hero line, lead with this*
**On-image:** They didn't ghost you. **Somebody called first.**
**Sub:** A driver applies to five carriers in one sitting, usually at night, and signs
with whoever answers. Not the best offer. The first one.

> Every fleet owner I talk to says the same thing: "drivers ghost."
>
> They don't. They apply to five or six carriers in one sitting, usually after they
> shut down for the night, and they take the first callback. Not the best pay package.
> Not the newest equipment. The first phone call.
>
> Your applicant didn't disappear. He got hired on Tuesday by somebody who answered on
> Monday.

## FC02 · EMPTY
**On-image:** EMPTY (outlined, alert red) · 19 days parked / 0 loads hauled / 0 costs paused
**Sub:** A truck with nobody in it still makes a payment, still carries plates, still
insures, still depreciates. It just doesn't earn.

> The cost of an open seat isn't the recruiting spend. It's the unit sitting in your
> yard with a payment, plates, insurance and depreciation all running at full speed and
> nothing coming the other way.
>
> Nineteen days is a long time to pay for a truck that hasn't moved.

## FC03 · 03:47
**On-image:** 03:47 (lime) · "When your best applicant applied"
Log: He applies Sat 3:47am → ANSWERED · Your recruiter opens the inbox Mon 8:00am →
+52 HRS · He started somewhere else Mon 6:00am → GONE

> Your best applicants apply at 3am, because that's when they shut down.
>
> Your office opens at eight, on Monday. By then he's fifty-two hours into somebody
> else's onboarding.
>
> The gap between when drivers apply and when fleets answer is where most of the
> recruiting budget actually goes.

## FC04 · SIX CARRIERS
**On-image:** He applied to six carriers before lunch. **You were fourth to call.**
Race log ending: HE SIGNED WITH CARRIER B — 12:00

> Carrier B didn't beat you on pay. They beat you by seven hours.
>
> This is the whole game and almost nobody scores it this way. You are not competing on
> your package. You are competing on your response time, against five other fleets
> looking at the same application.

## FC05 · SECONDS
**On-image:** A driver applied on Saturday night. → Your inbox: **Monday 8:00am** /
Answered in: **Seconds**
**Tail:** Recruiting is not a volume problem. It is a latency problem.

> Two fleets got the same application at 11:41 on a Saturday night.
>
> One answered in seconds. One answered in fifty-six hours.
>
> Only one of them is running that truck this week, and it had nothing to do with the
> quality of the offer.

## FC06 · THE OFFER
**On-image:** Fill the seat. **Then keep it filled.** · 01 Emergency driver ·
02 Owner-operator recruitment · 03 Full recruiting system

> Three ways in, depending on how bad it is right now:
>
> **Emergency driver** — one fully vetted CDL driver for a seat that cannot stay empty
> another week.
> **Owner-operator recruitment** — verified O/Os ready to lease on and run revenue.
> **Full recruiting system** — an end-to-end engine, a predictable flow of pre-qualified
> drivers.

---

# CAROUSELS

## C1 · THE RACE — 6 slides
The flagship. A single applicant, told as a stopwatch.

| # | Slide |
|---|---|
| 1 | A driver applied to your fleet at **9:14 this morning.** Right now it is a fair fight. |
| 2 | By eleven o'clock he had applied to **5 more.** |
| 3 | Carrier number two called him back at **09:21.** Not a better offer. Just first. |
| 4 | Your recruiter got to him at **16:30.** Nothing about your fleet had changed. Only the clock. |
| 5 | **He'd already signed. At noon.** |
| 6 | **You didn't lose a driver. You lost a race.** |

> A driver applied to your fleet at 9:14 this morning. Here's what happened to him by
> lunch. → *(swipe)*
>
> Nothing in this story is about your pay package.

## C2 · WHAT AN EMPTY SEAT COSTS — 6 slides
The arithmetic. Best for retargeting owners who already know they have a problem.

| # | Slide |
|---|---|
| 1 | An empty truck **doesn't stop costing money.** It stops earning. Not the same thing. |
| 2 | Line item 01 — The payment. **Due.** |
| 3 | Line item 02 — Plates, permits, insurance. **Paid.** |
| 4 | Line item 03 — The freight you turned down. **Gone.** |
| 5 | **Charged daily. Never invoiced.** *(labelled illustrative on-slide)* |
| 6 | **The fastest way to cut that bill is to answer faster.** |

> Nobody sends you an invoice for an open seat. That's exactly why it's the most
> expensive line in the business.

## C3 · FOUR REASONS YOUR TRUCKS ARE STILL EMPTY — 6 slides
The diagnostic. Highest save/share rate of the three — it reads as advice, not an ad.

| # | Slide |
|---|---|
| 1 | Four reasons your trucks are **still empty.** None of them is a driver shortage. |
| 2 | **01** You're not slow. You're slower than whoever called first. |
| 3 | **02** Your best applicants apply at 11pm. You open at eight. |
| 4 | **03** You pay for leads, then let them go cold. |
| 5 | **04** Everyone works the same twenty names. Nobody works the other hundred and eighty. |
| 6 | **All four are the same problem. Nobody answered.** |

> There is no driver shortage in your market. There is a response-time shortage in your
> office. → *(swipe)*

---

# RUN ORDER

**Cold / prospecting:** `FC01 GHOST`, `C3 FOUR REASONS` — both read as insight, not offer.
**Problem-aware:** `FC03 03:47`, `FC04 SIX CARRIERS`, `C1 THE RACE`
**Cost-aware / retarget:** `FC02 EMPTY`, `C2 EMPTY SEAT COSTS`
**Hot / close:** `FC05 SECONDS`, `FC06 OFFER`

**First test — four creatives:** `FC01` (hook) · `C1` (story) · `FC02` (cost) · `FC06` (offer).

**Platform notes.** Carousels are the strongest asset here — LinkedIn and Instagram both
reward completion, and all three are built so slide 1 works alone as a static if a
carousel underdelivers. `FC01` is the single best static in the set.

---

# CLAIMS DISCIPLINE

Every number in this set is **structural or illustrative**, not measured:

- Timestamps (`09:14`, `03:47`, `16:30`, `12:00`) are narrative devices in a scenario,
  not logged data. They are presented as a story, never as a case study.
- `19 days parked` on FC02 and the C2 totals slide are illustrative; C2-05 says so
  on the slide itself. Keep that label.
- **Not used anywhere:** the Faith In Transit "40% reduction in hiring waste" and Freight
  X Core figures found in search cache. They are attributable to FleetConnect's own
  marketing, but I could not verify them against a live site, so they are deliberately
  absent. Add them only once confirmed, with the client name attached.
- No testimonials, no named customers, no guarantees, no invented averages.
