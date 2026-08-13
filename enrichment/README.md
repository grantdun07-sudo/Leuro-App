# Leuro Enrichment Tool — Build Starter

This folder is the starting point for building the real version of the Grade 6 Maths enrichment game (Energy Duel mechanic), pilot topic: **Length**, Term 3.

## What's already here

- `docs/PRODUCT-SPEC.md` — the full locked product spec: game mechanics for all 6 subjects, house/leaderboard system, admin dashboard structure, content/taxonomy rules, tech architecture. Read this first.
- `game/energy-duel-prototype.html` — the core Maths mechanic (self-contained HTML/Canvas, no external dependencies). The loop, pacing (10 questions/round), and feel have already been playtested and approved. **Now pulls its questions from Supabase** instead of a hardcoded array — the validated loop, damage values, timings and thresholds are unchanged.
- `supabase/schema.sql` — starter database schema covering: subjects/topics/sublevels, question bank, learners/houses, attempt tracking, house points, admin boost windows. Needs RLS policies tightened to match Leuro's existing child-auth pattern before any real learner data touches it.
- `supabase/seed-length.sql` — creates the Length topic structure (sub-levels 1.1–1.6 + boss, with the taxonomy scaffold applied across the sequence) and loads the **placeholder** question pool into 1.1 so the wiring can be played end-to-end. Safe to re-run.
- `supabase/rls-content.sql` — locks the question bank to the server. Without it the publishable key can read `correct_index` straight off the REST API, so this is required, not optional.
- `supabase/seed-test-learner.sql` — links an auth account to a `learners` row so progress has an owner.
- `supabase/functions/` — the three edge functions the game talks to. Deployed by dashboard paste like the rest of Leuro's functions; each is self-contained.
- `supabase/tests/unlock-logic-test.sql` — runs the unlock and grading rules against a real database and prints PASS/FAIL per rule. Rolls back; leaves nothing behind.

## How grading and unlocking work

The browser never sees a correct answer. `start-attempt` draws the round and returns question text and options only; the learner's choices go back to `submit-attempt`, which grades them against the stored key and returns just a score and a pass flag. The sequential-unlock rule is enforced in `start-attempt` — a learner who forges a later sub-level id gets a 403, not a round.

Because grading happens once per round, the game cannot know mid-round which answers were right. Guardian damage is therefore uniform and slightly randomised, which is what the spec asks for anyway ("not clearly readable as wrong"). The prototype's teal/pink blast split did reveal it, and is gone.

## Running it

1. Run `supabase/schema.sql` against the enrichment Supabase project.
2. Run `supabase/seed-length.sql`.
3. Run `supabase/rls-content.sql`.
4. Deploy the three functions in `supabase/functions/` by pasting each into the dashboard.
5. Create a user under Authentication → Users (tick Auto Confirm), put that email into `supabase/seed-test-learner.sql`, and run it.
6. Open `game/energy-duel-prototype.html` and sign in with that account.

If something is missing the game says so on-screen rather than failing silently — it will name the missing topic, sub-level, table or connection.

## What's NOT here yet (next build steps)

1. **Real Length question content** — only placeholder questions exist, and only for sub-level 1.1. Sub-levels 1.2–1.6 and the boss have empty pools. Use `AI-Prompt-Length-Question-Generation.md` (provided separately) to generate real CAPS-aligned content, then import into the `questions` table.
2. **Real child auth** — the game currently signs in with a plain email/password form, which is a placeholder. Swap it for Leuro's existing child-auth pattern; the edge functions already derive the learner from the JWT, so only the sign-in step changes.
3. **House points** — `house_points_log` is still untouched. Passing a sub-level should award weighted points (core subjects higher), which is the input the kid-facing leaderboard needs.
4. **Abandoned attempts** — `start-attempt` opens a row with `correct_count = 0`, so a learner who quits mid-round leaves what looks like a 0% attempt. Filter on `completed_at is not null` in any admin query until this is tidied up.
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
