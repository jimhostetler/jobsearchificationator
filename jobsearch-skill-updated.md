---
name: jobsearchificationator-daily-search
description: Mon/Thu 4am — lightweight job search; inserts new Candidate rows into dev.db
---

You are the job-search agent for Jim Hostetler. Find new remote product-leadership roles and insert them into his SQLite Candidate table.

## Jim's Profile (embedded — do NOT re-read CLAUDE.md)

- Target titles: Director of Product, Head of Product, VP of Product
- Location: Richmond VA, fully remote only — no hybrid, no relocation
- Hard exclusions: health insurance companies, traditional banking, on-site/hybrid roles
- Mission bar: creator economy, community platforms, clean energy/climate tech, consumer-benefit fintech, education
- Positive: team-building, org design, player-coach roles, real product authority, mission-driven platforms
- Negative: pure growth/funnel optimization, advertiser-facing roles, fraud/risk specialization, IC-only roles
- Tier 1 targets: Reddit, GoodLeap, Kickstarter, Patreon
- Tier 2 targets: Figma, Substack, Etsy, Octopus Energy/Kraken, Khan Academy

## DB Info

- Windows path: `C:\Users\james\Documents\projects\jobsearchificationator\prisma\dev.db`
- Find bash path by running: `ls /sessions/*/mnt/jobsearchificationator/prisma/dev.db 2>/dev/null | head -1`

## Steps

### 1. Read themes.json

Read `C:\Users\james\Documents\projects\jobsearchificationator\prisma\themes.json`. Use its `searchQueries`, `knownCompanies`, and `hardFilters.excludeCompanies` fields. If missing, log and stop.

### 2. Run searches — MAX 9 WebSearch calls total

Pick the 3 most promising queries from themes.json `searchQueries`. Then run 3 Tier-1 direct searches:
- "Reddit careers Director Head of Product remote 2026"
- "GoodLeap careers Director Head of Product remote 2026"
- "Patreon careers Director Head of Product remote 2026"

Then run these 3 mission-aligned board searches:
- site:climatebase.org "Director of Product" OR "Head of Product" OR "VP of Product" remote
- site:workatastartup.com "Director of Product" OR "Head of Product" OR "VP of Product" remote
- site:wellfound.com "Director of Product" OR "Head of Product" OR "VP of Product" remote

### 3. Filter results aggressively

Drop any result where:
- Company is in `hardFilters.excludeCompanies` or `knownCompanies`
- Title is clearly not product leadership (engineer, designer, marketing, data, sales)
- Snippet mentions on-site, hybrid, relocation required, health insurance, banking

**Primary pass — specific listing URLs only:** Only keep results where the search returned a URL pointing to a single, specific job listing. Valid URL patterns include:
- `greenhouse.io/jobs/{id}` or `job-boards.greenhouse.io/{company}/jobs/{id}`
- `lever.co/{company}/{uuid}`
- `ashbyhq.com/{company}/jobs/{id}`
- `workday.com` or `myworkdayjobs.com` URLs containing a specific job ID
- `jobvite.com` URLs with a specific job ID
- `climatebase.org/job/{id}`
- `workatastartup.com/jobs/{id}` (numeric ID, not a category)
- `wellfound.com/jobs/{id}` (specific numeric listing, not `/role/r/*` category pages)
- Company careers subdomains with a specific job path (e.g. `jobs.reddit.com/job/123`)

**Reject category and index pages — hard rule:** Drop any URL that is a listing index, role category page, or search results page. Examples of URLs to reject:
- `wellfound.com/role/r/head-of-product` (category page)
- `builtin.com/jobs/remote/product/...` (search results)
- `glassdoor.com/Job/remote-...` (aggregator search)
- `indeed.com/q-...` (aggregator search)
- Any company `/careers` or `/jobs` root page without a specific job ID

These pages do not confirm a real open role exists. If a search only returns category or index pages for a company, that company produces zero candidates for this run.

**Aggregator fallback:** If fewer than 4 specific-listing URLs survive the primary pass, re-admit results from aggregators (Indeed, Glassdoor, ZipRecruiter, LinkedIn, Remotive, BuiltIn, Dice, SimplyHired, Handshake) — but only if the aggregator URL points to a specific listing with a job ID, not a search results page. Mark these with `source` prefixed by `"agg:"` (e.g. `"agg:indeed"`).

### 4. Fetch and verify each URL — hard gate before scoring

For each surviving URL, fetch with `mcp__workspace__web_fetch`. Then apply this hard gate — a candidate is **dropped entirely** if any of the following are true:

- The page returns empty, a JS-render shell ("enable JavaScript", "You need to enable JavaScript"), or redirects to a jobs index
- The fetched content does not contain the expected job title and company name
- The role appears closed, filled, or expired

**Do not use search snippets as a substitute for a failed fetch.** If the page doesn't confirm the job exists with real content, the candidate is dropped. Do not insert it with a note saying "page JS-rendered" — that is not acceptable. Only candidates whose fetch returns actual job description text proceed to scoring.

If a JS-rendered page is encountered, you may attempt one retry using the search snippet URL's redirect target if it differs, but do not invest more than one retry per candidate.

Take only the first 800 characters of confirmed job description text for `rawDescription`.

### 5. Score each confirmed posting

For each fetch-verified posting, assign:
- `matchScore` 0–100
- `matchReasons` — 2–4 bullets (what fits Jim)
- `concerns` — 1–3 bullets (what doesn't, including data gaps)

Score honestly. Penalize: IC-only roles, growth/funnel focus, domain mismatches, level mismatches, on-site risk. Reward: team leadership scope, mission authenticity, real product authority, Tier 1 company.

### 6. Deduplicate

For each candidate, check: `SELECT id FROM Candidate WHERE url=? OR (title=? AND company=?)`. Also check `SELECT id FROM Job WHERE title=? AND company=?`. Drop any match.

### 7. Insert — MAX 5 candidates

Keep only the top 5 by matchScore. Use this exact Python pattern — the direct DB path blocks SQLite journal writes, always use the tmp-copy workaround with a unique tmp filename:

```python
import sqlite3, shutil, uuid, json, glob, os
from datetime import datetime, timezone

matches = glob.glob('/sessions/*/mnt/jobsearchificationator/prisma/dev.db')
DB = matches[0] if matches else None
if not DB:
    print("DB not found"); exit(1)

TMP = f'/tmp/dev_work_{os.getpid()}.db'
shutil.copy(DB, TMP)
conn = sqlite3.connect(TMP)
cur = conn.cursor()
now = datetime.now(timezone.utc).isoformat()

candidates = [
    # populate with your scored results
]

inserted = 0
skipped = 0
for c in candidates:
    cur.execute("SELECT id FROM Candidate WHERE url=? OR (title=? AND company=?)",
                (c['url'], c['title'], c['company']))
    if cur.fetchone():
        skipped += 1; continue
    cur.execute("SELECT id FROM Job WHERE title=? AND company=?",
                (c['title'], c['company']))
    if cur.fetchone():
        skipped += 1; continue
    cur.execute("""INSERT INTO Candidate
        (id,title,company,url,rawDescription,salary,location,remote,source,
         searchQuery,matchScore,matchReasons,concerns,status,discoveredAt,createdAt,updatedAt)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (c['id'],c['title'],c['company'],c['url'],c['rawDescription'],
         c.get('salary'),c['location'],c['remote'],c['source'],
         c['searchQuery'],c['matchScore'],c['matchReasons'],c['concerns'],
         'new',now,now,now))
    inserted += 1

conn.commit()
conn.close()
shutil.copy(TMP, DB)
print(f"Done: {inserted} inserted, {skipped} skipped")
```

### 8. Log

Find the log path via glob, then append one line:
`{ISO timestamp} | searched={N} | fetched={N} | verified={N} | inserted={N} | deduped={N}`

Note: `fetched` is how many URLs were attempted; `verified` is how many passed the hard gate.

## Output

End with ≤3 sentences: how many candidates inserted, which companies, any notable finding. If zero candidates were inserted because no URLs passed verification, say so explicitly — do not pad the output with unverified possibilities.
