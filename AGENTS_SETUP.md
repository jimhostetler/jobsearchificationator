# Job-Search Agents — Setup & Operation

Two agents work together to keep your job search live.

```
                  ┌──────────────────────────┐
   CLAUDE.md ─┐   │  Agent 1: Theme Extractor│
              ├──▶│  (on-demand, in-app)     │──▶ prisma/themes.json
   dev.db ────┘   │  POST /api/agents/        │
                  │       extract-themes      │
                  └──────────────────────────┘
                                                       │
                                                       ▼
                                  ┌──────────────────────────┐
                                  │  Agent 2: Daily Search   │
                                  │  (Cowork scheduled task, │
                                  │   8am every morning)     │
                                  │  - WebSearch + filter    │
                                  │  - Score + dedupe        │
                                  └────────────┬─────────────┘
                                               │
                                               ▼
                                  ┌──────────────────────────┐
                                  │  Candidate table in      │
                                  │  prisma/dev.db           │
                                  └────────────┬─────────────┘
                                               ▼
                                       Review at /candidates
                                       (Promote → Job table)
```

## One-time setup

The new `Candidate` model in `prisma/schema.prisma` must be applied to the SQLite DB. From a terminal in this folder:

```bash
npx prisma db push
```

This creates the `Candidate` table (additive — no existing data is touched) and regenerates the Prisma client. Run it once.

Then start the dev server as usual:

```bash
npm run dev
```

## Agent 1 — Theme Extractor (on-demand)

**What it does:** Reads `CLAUDE.md` plus every row in your `Job` table, distills them into a structured `themes.json`. The output captures hard filters, target titles, target companies (your Tier 1 / Tier 2 watchlist), positive themes pulled from jobs you've applied to, negative themes pulled from jobs you've rejected, and concrete search queries.

**How to trigger:**

- **In the app:** Click **Re-extract themes** on `/themes`.
- **From anywhere via curl:**
  ```bash
  curl -X POST http://localhost:3000/api/agents/extract-themes
  ```
- **From your own automation:** POST to `/api/agents/extract-themes` (no body required). Returns `{ ok, writtenTo, themes }`.

**Output:** `prisma/themes.json`. Inspect it on `/themes` in the app.

**When to re-run it:** Whenever you update `CLAUDE.md`, after a batch of new applications, or any time you've changed your stance on a sector / company.

## Agent 2 — Daily Job Search (scheduled)

**What it does:** Runs every morning at 8am local. Reads `prisma/themes.json`, web-searches for new jobs, filters them against your hard rules (no health insurance, no on-site, etc.), dedupes against jobs you already track, lightly scores them, and inserts the survivors as rows in the `Candidate` table.

**Where it lives:** Cowork scheduled task. Manage from the **Scheduled** section in the Cowork sidebar.

- Task ID: `jobsearchificationator-daily-search`
- Cron: `0 8 * * *` (every day at 8am local)
- Cap: at most 10 new candidates per run

**Output:** new rows in `Candidate` with `status='new'`. A one-line summary is appended to `prisma/daily-search-log.txt` each run, and Cowork also sends a completion notification.

**Review flow:** Open `/candidates` in the app. For each `new` candidate you can:
- **Promote to Jobs** — copies it into the `Job` table with `status='viewed'` and marks the candidate as promoted (with a back-link).
- **Dismiss** — keeps it in the Candidate table marked dismissed (so the agent won't re-add it if it reappears in a future search).

## Files this work added

```
prisma/schema.prisma                          (added Candidate model + CandidateStatus enum)
lib/themes.ts                                 (Themes type + read/write helpers)
lib/prompts.ts                                (added buildThemeExtractionPrompt)
lib/claude.ts                                 (added extractThemes())
app/api/agents/extract-themes/route.ts        (Agent 1 endpoint)
app/api/candidates/route.ts                   (list + insert candidates)
app/api/candidates/[id]/route.ts              (PATCH promote/dismiss, DELETE)
app/candidates/page.tsx                       (review UI)
app/themes/page.tsx                           (themes inspector + re-extract button)
app/page.tsx                                  (added nav links)
AGENTS_SETUP.md                               (this file)
```

## Recommended first run

1. `npx prisma db push`
2. `npm run dev`
3. Visit `/themes` and click **Re-extract themes** — confirms Agent 1 works and produces a sensible `themes.json`.
4. In Cowork, open the `jobsearchificationator-daily-search` scheduled task and click **Run now** — confirms Agent 2 works end-to-end and pre-approves the WebSearch / file tools it needs (so future 8am runs don't pause on permission prompts).
5. Visit `/candidates` — you should see whatever Agent 2 found this morning.

## Troubleshooting

| Symptom | Fix |
|---|---|
| `/api/candidates` returns "Candidate table missing" | You haven't run `npx prisma db push` yet. |
| `/themes` shows "No themes file yet" | Click **Re-extract themes**. |
| Agent 2's run notification says "themes.json missing" | Run Agent 1 once before Agent 2 has anything to search for. |
| Agent 2 inserts duplicates of jobs you've already applied to | Your applied jobs may not be in `themes.knownCompanies`. Re-run theme extraction — Agent 1 always pulls `knownCompanies` from the live DB. |
| Agent 2 finds nothing | Check `prisma/daily-search-log.txt` for the filter breakdown. Often the queries are too narrow or the filters too aggressive. |

## Models in use

- Agent 1 (Theme Extractor): `claude-sonnet-4-20250514` via `@anthropic-ai/sdk` from your `ANTHROPIC_API_KEY`. To upgrade later, change the model string in `lib/claude.ts`.
- Agent 2 (Daily Search): whatever Cowork is running the scheduled task on.
