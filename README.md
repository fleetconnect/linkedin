# Hotel Kaoba Command Center

A proprietary hotel operations dashboard MVP for **Hotel Kaoba** — Cabarete, Dominican Republic.

> Own the guest journey from booking to checkout.

This is a Cloudbeds-inspired, demo-ready MVP that shows the Hotel Kaoba / I Love DR Realty
team how they could begin building their own internal hotel operating system in phases —
starting with rooms, guests, reservations, pricing visibility, direct booking, and CRM
follow-up — before ever touching anything mission-critical.

This MVP does **not** connect to, scrape, or clone Cloudbeds. It is fully branded as Hotel
Kaoba Command Center and uses local mock data only.

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- No backend, no database — local mock data in `lib/mockData.ts`
- Deploys cleanly to Vercel as a static-friendly client app

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Build

```bash
npm run build
npm run start
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo in [Vercel](https://vercel.com/new).
3. Framework preset: **Next.js** (auto-detected). No environment variables required.
4. Deploy — no backend or database configuration needed.

## Project structure

```
app/               Root layout, global styles, single-page app shell
components/        Reusable dashboard components (calendar, rooms, CRM, pricing, etc.)
lib/                Mock data + shared utilities
```

## Product scope

This MVP simulates the first operational layer of a hotel PMS: room + guest management,
a reservation calendar, a basic direct booking request flow, guest CRM, housekeeping status,
a pricing intelligence mockup, and a channel distribution planning mockup. Everything is
seeded, local, and clickable — built to demo on a Zoom call, not to process real
reservations or payments.
