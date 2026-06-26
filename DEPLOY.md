# Deploying CoachDeck (free: Vercel + Neon + Vercel Blob)

This app is preconfigured for a $0 personal/test deployment:

- **Vercel** — hosts the Next.js app (Hobby plan, free for non-commercial use)
- **Neon** — free serverless PostgreSQL
- **Vercel Blob** — stores progress photos (free tier)
- **Vercel Cron** — runs the reminder dispatch daily (free on Hobby)

> Going commercial (charging trainers) requires Vercel **Pro** (~$20/mo) per Vercel's terms.

---

## 1. Put the code on GitHub
```bash
cd gym-personal-trainers
git init
git add .
git commit -m "CoachDeck"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/coachdeck.git
git branch -M main
git push -u origin main
```
`.env` is gitignored, so your secrets are not pushed. Good.

## 2. Create the database (Neon)
1. Sign up at https://neon.tech → **New Project**.
2. Open **Connection Details** and copy **two** strings:
   - **Pooled** (host contains `-pooler`) → this becomes `DATABASE_URL`
   - **Direct** (no `-pooler`) → this becomes `DIRECT_URL`
3. Make sure both end with `?sslmode=require`.

## 3. Import the project into Vercel
1. Sign up at https://vercel.com with your GitHub account.
2. **Add New → Project** → import your repo. Framework auto-detects **Next.js**.
   (Don't deploy yet — set env vars first, or redeploy after.)

## 4. Add a Blob store (for photos)
In the Vercel project: **Storage → Create → Blob**. This automatically adds the
`BLOB_READ_WRITE_TOKEN` env var to the project.

## 5. Set Environment Variables (Vercel → Settings → Environment Variables)
| Name | Value |
| --- | --- |
| `DATABASE_URL` | Neon **pooled** string (`...-pooler...?sslmode=require`) |
| `DIRECT_URL` | Neon **direct** string (`...?sslmode=require`) |
| `AUTH_SECRET` | long random string — `openssl rand -base64 48` |
| `CRON_SECRET` | another long random string |
| `BLOB_READ_WRITE_TOKEN` | (added automatically in step 4) |
| `SMTP_HOST/PORT/USER/PASS`, `EMAIL_FROM` | optional — only for real reminder emails |

Add each to **Production** (and Preview if you want).

## 6. Deploy
Click **Deploy** (or push a commit). Vercel runs `vercel-build`, which:
`prisma generate → prisma migrate deploy → next build` — so your tables are created
automatically on first deploy.

## 7. Seed demo data (optional, once)
From your machine, pointing at Neon:
```bash
# temporarily set the Neon URLs in your shell, then:
DATABASE_URL="<neon-pooled>" DIRECT_URL="<neon-direct>" npm run db:seed
```
Or skip this and just sign up a fresh trainer account at `/signup`.

## 8. Done
- Visit `https://<your-project>.vercel.app`
- The reminder cron (in `vercel.json`) runs daily at 09:00 UTC and is authorized via
  `CRON_SECRET` automatically. (Hobby plan = once/day; Pro allows more frequent.)

---

## Notes / limits
- **Photos** require the Blob store (step 4); without it uploads fail on Vercel.
- **Apple Watch sync** works in production as-is: clients connect from the portal and
  the `Health Auto Export` app POSTs to `https://<your-domain>/api/sync/health`.
- **Free Postgres** sleeps when idle (first request after a pause is slightly slow).
- To run reminders more than once a day, upgrade to Vercel Pro and edit the schedule in
  `vercel.json`, or call `POST /api/sync/reminders/dispatch` from an external cron with
  header `x-cron-secret: <CRON_SECRET>`.
