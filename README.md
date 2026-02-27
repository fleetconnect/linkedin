# LinkedIn Outreach Tracker

An AI-powered LinkedIn outreach tracking app built with Next.js, TypeScript, Tailwind CSS, Prisma (SQLite), and the Anthropic Claude API.

## Features

- **Contact Management** — Track contacts with name, company, role, LinkedIn URL, email, and notes
- **Status Pipeline** — Move contacts through: Not Contacted → Sent → Replied → Connected → Meeting
- **Message Templates** — Create and reuse outreach message templates with tag organization
- **AI Message Generation** — Generate personalized LinkedIn messages using Claude
- **Dashboard** — Kanban pipeline view with reply rate and meeting stats

## Getting Started

### 1. Set your Anthropic API key

```bash
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env.local
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The SQLite database is created automatically at `prisma/dev.db` on first run.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database:** SQLite via Prisma 7 + libsql adapter
- **AI:** Anthropic Claude API (`claude-sonnet-4-6`)
