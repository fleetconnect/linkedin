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
  img/logo.jpg          Brand mark, 640px — used for Open Graph/Twitter cards
  img/logo-sm.jpg       Brand mark, 320px — used in the header and footer
  img/favicon.svg       Tab icon
  img/fleet/*.svg       Vehicle artwork (placeholders — see "Vehicle photography")
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

The two fleet cards and the hero currently use **original SVG illustrations** — stylised black
vehicles on a lit studio floor, drawn to match the brand palette. They are placeholders standing in
for real photography, not photos of actual vehicles.

To swap in real photos:

1. Shoot or license images of *your* vehicles. Don't pull manufacturer press photos or stock images
   off the web — they're copyrighted, and a rental company advertising cars it doesn't own creates a
   real problem.
2. Export at **1600×1000** (16:10), then compress — WebP at quality ~80 usually lands under 150 KB.
3. Replace the `src` on each card in `index.html`:

```html
<!-- assets/img/fleet/urus.svg  →  your photo -->
<img src="assets/img/fleet/urus.webp" alt="Lamborghini Urus" width="1600" height="1000"
     loading="lazy" decoding="async">
```

Keep the `width`/`height` attributes — they reserve layout space and prevent the page from jumping
as images load.

For the hero, replace the inline `<svg>` inside `.hero-bg` with an `<img>` or a muted, looping
`<video>`. Keep `.hero-veil` above it so the headline stays readable.

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
- Fleet artwork is illustration, not photography (see §4).
