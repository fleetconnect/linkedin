# Rich Exotic Rentals — Landing Page

A mobile-first, conversion-focused landing page for a luxury and exotic vehicle rental company.
Static HTML/CSS/JS with no build step — open `index.html` or drop the folder on any host.

```
index.html              Landing page
privacy.html            Privacy policy       (draft outline — see "Legal pages")
rental-terms.html       Rental terms         (draft outline)
refund-policy.html      Refund/cancellation  (draft outline)
assets/
  css/styles.css        Design system + all page styles
  js/config.js          ← the only file you must edit to go live
  js/main.js            Validation, form submission, analytics, motion
  img/logo.jpg          Brand mark, 640px
  img/logo-sm.jpg       Brand mark, 320px — used in the header and footer
  img/favicon.svg       Tab icon
  img/fleet/*.jpg       Hero + fleet photography (PLACEHOLDERS — see §4)
  img/fleet/CREDITS.md  Photo provenance and licensing
```

---

## 1. Quick start

```bash
python3 -m http.server 8000     # then open http://localhost:8000
```

Everything runs client-side. There is no server, database, or build tooling.

---

## 2. Fill in `assets/js/config.js`

This is the **only** file you need to touch for a basic launch. Every value in it is currently a
placeholder. The page reads from it at runtime, so one edit updates the header, hero, footer, sticky
mobile bar, and every click-to-call/click-to-text link at once.

| Key | What it does |
| --- | --- |
| `phoneE164` / `phoneDisplay` | Powers every `tel:` link and the number shown in the footer |
| `smsE164` / `smsBody` | Powers the click-to-text links, with a pre-filled message |
| `email` | Footer email link |
| `serviceArea` | Footer service-area line |
| `instagram` / `facebook` | Footer social links |
| `formEndpoint` | Where booking requests are sent (see §3) |
| `googleAnalyticsId` | GA4 measurement ID, e.g. `G-XXXXXXXXXX` |
| `metaPixelId` | Meta Pixel ID |
| `minimumDriverAge` | Enforced by the form's age validation |
| `minimumLeadTimeDays` | Earliest selectable pickup date |
| `maximumRentalDays` | Longest range the form accepts before asking people to call |

> The phone number currently in the file (`800-555-0123`) is a **fictional placeholder** from the
> reserved 555-01xx range. Replace it before launch or the call buttons go nowhere.

Analytics tags load **only** when an ID is present, so an unconfigured site makes zero third-party
requests.

---

## 3. Wiring up notifications, calendar, and CRM

The booking form POSTs a JSON body to `CFG.formEndpoint`. Email notifications, SMS alerts, the
calendar entry, and the CRM record are all created by whatever you point that at — the page itself
sends no mail. Pick one:

**GoHighLevel** (easiest if you already use it)
1. Automations → create a workflow → trigger **Inbound Webhook**.
2. Copy the webhook URL into `formEndpoint`.
3. Add actions: *Create/Update Contact* → *Send Email* (to you) → *Send SMS* (to you) →
   *Create Opportunity* → *Create Appointment*.

**Zapier / Make**
1. New Zap → trigger **Webhooks by Zapier → Catch Hook**. Copy the URL into `formEndpoint`.
2. Actions: Gmail/SendGrid (email), Twilio (SMS), Google Calendar (hold the dates), your CRM.

**Formspree / Basin / Netlify Forms** — fine for email-only notifications; add SMS separately.

**Your own endpoint** — accept `POST` with `Content-Type: application/json`.

### Payload shape

```json
{
  "fullName":        "Jordan Ellis",
  "phone":           "(555) 123-4567",
  "email":           "jordan@example.com",
  "vehicle":         "Lamborghini Urus",
  "pickupDate":      "2026-08-14",
  "returnDate":      "2026-08-17",
  "fulfilment":      "Delivery to me",
  "deliveryAddress": "123 Ocean Dr, Miami, FL 33139",
  "driverAge":       "31",
  "occasion":        "Birthday",
  "notes":           "Arriving at 4pm, please text on the way.",
  "submittedAt":     "2026-07-27T18:04:11.238Z",
  "source":          "https://richexoticrentals.com/#book",
  "pageTitle":       "Luxury & Exotic Car Rentals | Rich Exotic Rentals"
}
```

`deliveryAddress` is only present when the visitor chose delivery.

**CORS:** your endpoint must allow cross-origin POSTs from your domain. Most hosted webhook services
already do; a custom endpoint needs an `Access-Control-Allow-Origin` header.

### Before `formEndpoint` is set

The form still validates and shows the confirmation panel, but **nothing is transmitted**. A note
appears on the confirmation (and a warning in the browser console) so you don't mistake it for a
working pipeline. Both disappear the moment a real endpoint is configured.

---

## 4. Vehicle photography

> **The photos currently in the repo are interim placeholders showing other people's cars.**
> Replace them before you drive traffic here. Full provenance and licensing is in
> `assets/img/fleet/CREDITS.md`.

The hero and both fleet cards use real photographs sourced under **CC0 1.0** (public domain,
commercial use permitted, no attribution required) from Wikimedia Commons via Openverse. Each one
has had its registration plate blurred and has been cropped and graded toward the dark
gold-on-black treatment.

They are a stopgap, not a finish line. A rental listing implies the customer gets *that* vehicle,
and these are a green Urus photographed in a dealership and a dark green G63 photographed on a
Moscow street. Your own cars are the whole point — it's why the reference sites look credible.

### Swapping in your own

Drop your photos in at these exact filenames and sizes. Nothing else needs to change:

| File | Size | Shot |
| --- | --- | --- |
| `assets/img/fleet/hero-urus.jpg` | 2000 × 1250 | Wide, vehicle right of centre so the headline sits on clear ground |
| `assets/img/fleet/urus.jpg` | 1600 × 1000 | Three-quarter front, whole vehicle |
| `assets/img/fleet/g-wagon.jpg` | 1600 × 1000 | Three-quarter front, whole vehicle |

Keep the `width`/`height` attributes in `index.html` — they reserve layout space so the page
doesn't jump as images load. Compress to roughly 200–300 KB each; WebP at quality ~80 is smaller
still if you'd rather update the `src` extensions.

**What shoots well here:** an underground garage, a covered forecourt, or a clean wall at dusk.
Three-quarter front from a low angle. Avoid midday sun — the dark palette wants soft, directional
light and reflections on the paint. Both reference sites shoot under architectural canopies for
exactly this reason.

If you want a different vehicle in the hero, change the `src` inside `.hero-bg` in `index.html` and
adjust `object-position` in `styles.css` (`.hero-bg img`) so the car sits clear of the headline.

---

## 5. Legal pages

`privacy.html`, `rental-terms.html`, and `refund-policy.html` are **working outlines, not legal
advice**. Each carries a visible draft banner, bracketed placeholders, and a `noindex` tag.

Have counsel and your insurer complete them, replace the placeholders, then remove the banner and the
`noindex` line from each file. Until that's done, leaving the banners visible is the honest state —
they tell visitors the terms aren't final yet.

---

## 6. What's implemented

- Fully responsive: single column on mobile, two-up fleet cards from 900px, full layout on desktop
- Sticky Call / Text / Book Now bar on mobile, appearing after the hero
- Click-to-call and click-to-text, with iOS/Android `sms:` separator handling
- Form validation: required fields, email and phone format, driver-age minimum, return-date-after-
  pickup, maximum rental length, conditional delivery address, honeypot spam trap
- Inline field errors, an error summary, and a confirmation panel with a booking recap
- Analytics events on every CTA and on form submission (`Lead` / `Contact` on Meta, custom events on GA4)
- Scroll-reveal animation, gold shimmer on the headline, hero light sweep, marquee strip — all
  disabled under `prefers-reduced-motion`
- Accessibility: skip link, visible focus rings, `aria-live` status region, `aria-invalid` on failed
  fields, labelled sections, 44px+ tap targets
- SEO: title, description, canonical, Open Graph/Twitter cards, `AutoRental` structured data

## 7. Known limits

- **No backend.** Submissions go wherever `formEndpoint` points. Without it, nothing is sent.
- **No live availability.** The form is a request, not a calendar check — matching the disclaimer
  under the submit button. Real-time availability needs a booking system.
- **Google Fonts is a third-party request.** Self-host Cormorant Garamond and Inter if you'd rather
  avoid it.
- **Fleet photos are placeholders of other people's cars** and must be replaced (see §4).
