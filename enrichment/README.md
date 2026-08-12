# Leuro Enrichment Tool — Build Starter

This folder is the starting point for building the real version of the Grade 6 Maths enrichment game (Energy Duel mechanic), pilot topic: **Length**, Term 3.

## What's already here

- `docs/PRODUCT-SPEC.md` — the full locked product spec: game mechanics for all 6 subjects, house/leaderboard system, admin dashboard structure, content/taxonomy rules, tech architecture. Read this first.
- `game/energy-duel-prototype.html` — a validated, playtested rough prototype of the core Maths mechanic (self-contained HTML/Canvas, no external dependencies, no Supabase yet). The loop, pacing (10 questions/round), and feel have already been tested and approved. This is the reference for how the mechanic should behave — not final code, but the confirmed *behavior* to rebuild properly.
- `supabase/schema.sql` — starter database schema covering: subjects/topics/sublevels, question bank, learners/houses, attempt tracking, house points, admin boost windows. Needs RLS policies tightened to match Leuro's existing child-auth pattern before any real learner data touches it.

## What's NOT here yet (next build steps)

1. **Real Length question content** — currently only placeholder/dummy questions exist in the prototype. Use `AI-Prompt-Length-Question-Generation.md` (provided separately) to generate real CAPS-aligned content, then import into the `questions` table via the schema above.
2. **Supabase project setup** — this schema hasn't been run against a real project yet.
3. **Real game engine wired to the database** — the prototype's question array is hardcoded; needs to pull from Supabase instead.
4. **Sequential unlock logic** — the prototype's map screen is a visual mock; real unlock/lock logic against `learner_progress` isn't built yet.
5. **Admin dashboard** — not started. See spec Section 3 for structure (overview → house → class → learner drilldown).
6. **House leaderboard (kid-facing)** — not started. See spec Section 3.

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
