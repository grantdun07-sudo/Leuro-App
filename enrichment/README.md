# Leuro Enrichment Tool — Build Starter

This folder is the starting point for building the real version of the Grade 6 Maths enrichment game (Energy Duel mechanic), pilot topic: **Length**, Term 3.

## What's already here

- `docs/PRODUCT-SPEC.md` — the full locked product spec: game mechanics for all 6 subjects, house/leaderboard system, admin dashboard structure, content/taxonomy rules, tech architecture. Read this first.
- `game/energy-duel-prototype.html` — the core Maths mechanic (self-contained HTML/Canvas, no external dependencies). The loop, pacing (10 questions/round), and feel have already been playtested and approved. **Now pulls its questions from Supabase** instead of a hardcoded array — the validated loop, damage values, timings and thresholds are unchanged.
- `supabase/schema.sql` — starter database schema covering: subjects/topics/sublevels, question bank, learners/houses, attempt tracking, house points, admin boost windows. Needs RLS policies tightened to match Leuro's existing child-auth pattern before any real learner data touches it.
- `supabase/seed-length.sql` — creates the Length topic structure (sub-levels 1.1–1.6 + boss, with the taxonomy scaffold applied across the sequence) and loads the **placeholder** question pool into 1.1 so the wiring can be played end-to-end. Safe to re-run.

## Running it

1. Run `supabase/schema.sql` against the enrichment Supabase project.
2. Run `supabase/seed-length.sql`.
3. Open `game/energy-duel-prototype.html`. It reads the project URL and publishable key from the top of the script block.

If content is missing the game says so on-screen rather than failing silently — it will name the missing topic, sub-level, or table.

## What's NOT here yet (next build steps)

1. **Real Length question content** — only placeholder questions exist, and only for sub-level 1.1. Sub-levels 1.2–1.6 and the boss have empty pools. Use `AI-Prompt-Length-Question-Generation.md` (provided separately) to generate real CAPS-aligned content, then import into the `questions` table.
2. **RLS on the content tables** — `subjects`, `topics`, `sublevels` and `questions` have no RLS enabled, so the publishable key (which ships in the game's client-side JS) currently allows anyone to *write* to the question bank, not just read it. Lock these to read-only for anon before this is in front of learners.
3. **Server-side grading** — the client currently receives `correct_index` for every question it pulls, so answers are readable in devtools. The no-per-question-feedback and chip-damage rules stop casual reverse-engineering, but not this. Moving grading behind an RPC/edge function that takes answers and returns only a score would close it.
4. **Attempt persistence** — nothing is written back yet; `attempts`, `learner_progress` and `house_points_log` are untouched by the game.
5. **Sequential unlock logic** — the map screen renders real sub-levels and "Continue" advances through them, but progress is session-only; real unlock/lock enforcement against `learner_progress` isn't built yet.
6. **Admin dashboard** — not started. See spec Section 3 for structure (overview → house → class → learner drilldown).
7. **House leaderboard (kid-facing)** — not started. See spec Section 3.

## Working rules (carried over from existing Leuro conventions)

- One step at a time — don't build everything at once
- SQL/screenshot evidence before considering anything "done"
- Never trust the repo as ground truth over what's actually live in the database
- This is an enrichment tool — keep it simple, resist scope creep beyond what's in the spec

## Suggested first Claude Code session scope

Don't try to build the whole thing in one sitting. A reasonable first session:
1. Set up a fresh Supabase project (or a dev schema within an existing one)
2. Run `schema.sql`, seed it with the `subjects`/`topics`/`sublevels` rows for Length (1.1–1.6 + boss)
3. Import the real Length questions once generated
4. Rebuild the prototype's game loop to pull questions from Supabase instead of the hardcoded array, keeping the exact mechanic/pacing already validated
5. Stop there and playtest again before adding unlock logic, admin dashboard, or anything else
