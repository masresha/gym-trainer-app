# CoachDeck — Personal Trainer Platform

A web app for gym personal trainers to set client goals, send workouts when clients can't make it to
the gym, and track daily / weekly / monthly progress. Trainers and clients each get their own login.

## Features

- **Trainer & client accounts** — trainers self-sign-up; they create logins for their clients.
- **Goals** — bodyweight, strength, endurance, habit or custom goals with a live progress bar.
- **Workout programming** — build plans with multiple exercises (sets, reps, load, rest) and "send"
  them to a client for a specific day — perfect for at-home sessions.
- **Progress tracking** — log bodyweight & body-fat measurements; view trends with a daily / weekly /
  monthly chart toggle. Weigh-ins auto-update the matching bodyweight goal.
- **Client portal** — clients see assigned workouts, mark them complete (with RPE + notes), review
  goals, and log their own measurements.

### Premium features

- **In-app messaging** — a per-client trainer⇄client chat thread (lightweight polling).
- **Exercise library** — reusable, per-trainer exercises with demo video links; names auto-suggest
  in the workout builder.
- **Workout templates & program builder** — build a workout once, then assign it to any client across
  one or more dates to create a multi-session program.
- **Nutrition / macro logging** — trainers set daily calorie/protein/carb/fat targets; clients log
  meals and see live totals vs. targets.
- **Reminders (email + in-app)** — trainers schedule reminders; a cron-callable dispatch endpoint sends
  email (via nodemailer, console fallback in dev) and surfaces in-app reminders in the portal.
- **Progress photos** — clients/trainers upload dated photos to a gallery (stored under
  `public/uploads`; swap for S3/Cloud storage in production).
- **Apple Watch / wearable sync** — clients self-connect from the portal's **Health → Connect Apple
  Watch** screen: they generate a private sync token and get step-by-step setup for the *Health Auto
  Export* iOS app, which reads Apple Watch/HealthKit data and auto-POSTs it to `POST /api/sync/health`.
  The endpoint parses Health Auto Export's native JSON (`step_count`, `resting_heart_rate`,
  `sleep_analysis`, `active_energy`), upserts one row per day non-destructively, and the portal shows a
  live "connected / last synced" status. Manual entry and a simple `{ samples: [...] }` format are also
  supported.

  > **Why a bridge app?** A web app (even a PWA) cannot read Apple HealthKit directly — only an app on
  > the user's iPhone can. *Health Auto Export* is that on-device bridge. For a fully branded experience
  > you'd ship a native companion app (HealthKit → this same endpoint) or use an aggregator like Terra/Vital.

## Tech stack

Next.js 14 (App Router, TypeScript) · Prisma + PostgreSQL · Tailwind CSS · Recharts · JWT cookie auth
(bcrypt-hashed passwords, `jose`-signed sessions).

## Getting started

Prerequisites: **Node 18+**, **Docker** (for the local Postgres), npm.

```bash
npm install

# 1. Start Postgres (Docker), run migrations, and seed demo data — all in one:
npm run setup

# 2. Run the app
npm run dev
```

Open http://localhost:3000.

> **Note on the DB port:** this machine already had native PostgreSQL clusters on 5432 and 5433, so
> the Docker Postgres is published on host port **55432** (see `docker-compose.yml` / `.env`). On a
> machine with a free 5432 you can change both back to 5432 if you prefer.

If you prefer to run the steps individually:

```bash
npm run db:up            # start postgres in docker
npm run prisma:migrate   # create tables
npm run db:seed          # load demo data
npm run dev
```

### Demo logins (after seeding)

| Role    | Email            | Password      |
| ------- | ---------------- | ------------- |
| Trainer | coach@demo.com   | password123   |
| Client  | maria@demo.com   | password123   |
| Client  | james@demo.com   | password123   |

## Configuration

Environment variables live in `.env`:

- `DATABASE_URL` — Postgres connection string (defaults to the bundled Docker instance).
- `AUTH_SECRET` — secret used to sign session JWTs. **Change this to a long random value** before
  deploying anywhere real.

To use a hosted Postgres (e.g. Neon, Supabase, Railway) instead of Docker, just point `DATABASE_URL`
at it and run `npm run prisma:migrate`.

## Project layout

```
app/
  api/            REST route handlers (auth, clients, goals, workouts, progress)
  dashboard/      Trainer dashboard (client list)
  clients/[id]/   Trainer's view of one client
  me/             Client portal
  login, signup   Auth pages
components/        UI + interactive client components
lib/              prisma client, auth/session, guards, validation, data helpers
prisma/           schema + seed
```

## Useful scripts

| Script                   | What it does                              |
| ------------------------ | ----------------------------------------- |
| `npm run dev`            | Start the dev server                      |
| `npm run build`          | Production build                          |
| `npm run db:up` / `:down`| Start / stop the Docker Postgres          |
| `npm run prisma:migrate` | Run Prisma migrations                     |
| `npm run prisma:studio`  | Browse the database in Prisma Studio      |
| `npm run db:seed`        | Reset & load demo data                    |

## Scheduling reminder dispatch

Reminders are stored when scheduled; a separate endpoint actually sends/surfaces them when due. Call it
on a schedule (cron, Vercel Cron, GitHub Actions, etc.):

```bash
curl -X POST -H "x-cron-secret: $CRON_SECRET" https://your-host/api/sync/reminders/dispatch
```

In development (no `CRON_SECRET`) you can call it without the header, and emails are printed to the
server console.

## Roadmap ideas (still to add)

Payments & subscriptions (Stripe), a multi-trainer gym/admin role (multi-tenant), real web-push
notifications (VAPID + service worker), native Apple Health companion exporter, and richer analytics.
