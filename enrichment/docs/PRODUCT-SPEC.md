# Leuro Enrichment Tool — Product Spec (v1)
**Pilot: Grade 6, Term 3, Maths**
Draft date: 12 August 2026

---

## 1. Product Purpose

An **enrichment/practice tool**, not a curriculum replacement. Content stays CAPS-aligned and reinforces what's already taught in class — the tool doesn't introduce new concepts cold, it consolidates and refreshes existing classroom learning so it "sticks."

**Differentiator vs. Matific/Reading Eggs:** broader subject spread (not single-subject), CAPS-aligned specifically for SA schools, bilingual EN/AF, and priced for schools that can't afford international licenses.

**Subjects (full vision):** English, Maths, Afrikaans, Natural Science, History, Geography
**Grade range (full vision):** Grade 1–7
**Launch scope:** Grade 6 (Grant's own classroom), all 6 subjects, built **subject by subject, sequentially** — nothing gets pitched to a school until the full Grade 6, all-subject product is working end-to-end. No partial/false-promise launches.

---

## 2. Build Order

1. **Maths** — first subject to build (strongest mechanic, clearest "wow factor")
2. English, Afrikaans, NST, History, Geography — order TBD, built after Maths is proven

Within Maths, **Term 3 is the pilot term** (ATP-mapped content already scoped — see Section 5).

---

## 3. Competitive / Motivation Layer

- **Solo play** — each kid plays independently, any device (phone/tablet/computer), own pace
- **House-based leaderboard** — plugs into the school's existing house system (already has weekly competitive culture: merits, offenses, weekly points announcement)
- **Kids see:** house-vs-house leaderboard only. No individual ranking visible to learners.
- **Admin/teacher panel sees:** full granular data — individual learner, class, house, subject, engagement AND performance
- **House score calculation:** level completions (not raw answers) feed points — averaged/weighted so every kid's participation matters, not just top performers
- **Weighted points by subject:**
  - Core subjects (Maths, English, Afrikaans): higher value (e.g. 7.5–10 pts per level)
  - Other subjects (NST, History, Geography): lower value (e.g. 5 pts per level)
- **Dynamic double-points windows:** system auto-flags when a subject's engagement drops below a threshold and *suggests* a double-points boost period; a human admin must approve before it goes live
- **Admin dashboard structure:** single overview (questions answered, levels completed, learners participating) with a dropdown to drill into any slice — house, class, grade, subject, individual learner
- **Success metric (pilot):** engagement/enjoyment first (kids actively want to play), marks improvement as the confirming signal

---

## 4. Game Mechanics by Subject

One core engine per phase (Foundation/Intermediate/Senior), reskinned per subject — but for the pilot, **each subject gets a distinct mechanic**:

| Subject | Mechanic | Notes |
|---|---|---|
| **Maths** | **Energy Duel boss-fight** (see Section 6 for full spec) | Pilot subject — build first |
| **English** | Avatar room/background builder — cosmetic unlocks (carpet, lighting, school colours) per level. No punishment for wrong answers, just delayed unlocks. Visible/showable to other kids. | |
| **Afrikaans** | Pet collection — unlocked at level milestones (e.g. every 5 levels: goldfish, hamster, etc.), builds out avatar background alongside English room | Designed to reduce hesitancy toward Afrikaans as a second language |
| **NST / History / Geography** | Shared "Expedition" mechanic (endless runner/journey) — correct answers move forward, wrong answers slow down (no "death"). Same engine, different skin per subject: NST = science trek, History = time-travel train, Geography = world journey/map | One engine, three themes — efficient build |

---

## 5. Content Structure — Grade 6 Maths, Term 3 (ATP-mapped)

Term 3 breaks into 5 core topics + revision + formal assessment:

| Topic | ATP Hours | Sub-levels (≈1 per hour) | Boss |
|---|---|---|---|
| Length | 6 | 6 | 1.7 (or final in sequence) |
| Properties of 2D Shapes | 12 | 12 | Boss |
| Symmetry & Transformations | 9 | 9 | Boss |
| Properties of 3D Objects | 6 | 6 | Boss |
| Area, Perimeter & Volume | 9 | 9 | Boss |
| **Total** | **42** | **42 sub-levels + 5 bosses** | |

- Sub-level target length: **~5 minutes each** (validated via prototype: original 5-question round completed in ~20 seconds by an adult who knew the answers — round size increased to 10 questions to realistically hit the time target with actual Grade 6 kids reading and thinking through each question)
- Total term practice time: **~4h45, spread over the term** (~40–45 min/week per kid) — figure to be re-validated once real content is played by an actual Grade 6 kid, not just estimated

### Level progression rules
- **Sequential unlock only** — 1.1 must be completed before 1.2 unlocks, and so on. No skipping ahead.
- **75% pass threshold** required to unlock the next sub-level (or pass the boss)
- **Fail = retry same sub-level** (not the whole topic), pulling a **fresh random set of questions** from that sub-level's pool
- Enrichment tool trails the classroom by design — not meant to run in lockstep with daily lessons, it consolidates a topic after it's been taught

### Question bank structure
- **Format: multiple choice only**
- **No per-question feedback** — kid is not told which specific question was right/wrong, to prevent "guess and check" exploitation
- **Round size: 10 questions per attempt**, pulled from a **pool of 30 questions per sub-level** (tagged to a taxonomy level) — validated via prototype playtesting (see Section 9a)
- **Boss levels have a separate, standalone pool** (scaled up proportionally, ~40–50 questions to support a 10-question round with equivalent variety) — never reuses sub-level questions, CAPS-critical content only (doesn't need to cover every minor sub-topic equally)
- **Random pull per attempt:** each playthrough (including retries) pulls a random subset of 10 from the relevant 30-question pool — no fixed "set 1/2/3" cycling needed

### Cognitive scaffolding (taxonomy)
- **Bloom's Taxonomy** → Maths, NST, History, Geography
- **Barrett's Taxonomy** → English, Afrikaans (reading/comprehension-specific)
- **Scaffolds across the sub-level sequence within a topic, not within each sub-level:**
  - First third of sub-levels → Lower order (Remember/Understand)
  - Middle third → Middle order (Apply/Analyse)
  - Last third (before boss) → Higher order (Evaluate)
  - **Boss** → mixed, pulls from all levels, CAPS-critical focus

---

## 6. Maths Game Mechanic — "Energy Duel" (Full Spec)

**Setting:** Kid's avatar faces a **Guardian** at a gate/doorway blocking progress to the next area. Not a monster, not violent — a duel-style challenge, closer to a Pokémon-battle feel than combat.

**Round flow:**
1. Question appears (multiple choice)
2. Kid selects an answer
3. **Firing is automatic** on answer submission — no extra tap/action needed
4. Correct answer → solid/meaningful damage to Guardian's health bar (fixed amount, no randomness)
5. Incorrect answer → small/inconsistent chip damage (not zero, not clearly readable as "wrong") — this prevents kids reverse-engineering which answers were wrong from bar movement
6. Repeat for all questions in the round
7. **End of round:**
   - **75%+ correct → Guardian steps aside or bows**, path opens, kid progresses
   - **Below 75% → Guardian stays firmly in front of the door**, blocking the way; **percentage score is shown** (e.g. "60% — needed 75%") so the kid knows how close they were, without revealing which questions were wrong
8. **On win:** kid is taken to a **map screen** showing their progress through the topic, with options to exit or continue to the next sub-level
9. **On loss:** kid can **retry immediately** — no cooldown — pulling a fresh random question set from the pool

**Explicitly ruled out:** per-question right/wrong feedback, fixed repeating question sets, violent imagery, scary Guardian design, live health-bar-as-exploit (damage amounts calibrated so correct vs. incorrect isn't cleanly distinguishable round-to-round).

---

## 7. Technical Architecture

**No live AI/API cost during gameplay** — this is a deterministic system, not generative. Questions are pre-written and stored; the game checks answers against fixed correct answers. AI's role is entirely on the **build/content-production side** (generating question banks, building game code), not running live per kid interaction.

| Layer | Tool | Notes |
|---|---|---|
| Content/question bank | Supabase (Postgres) | Table: subject, grade, term, topic, sub-level, taxonomy level, question, options, correct answer |
| Game engine | Phaser.js (HTML5), browser-based | Runs on phone/tablet/PC from one build — no app store needed |
| Progress & scoring | Supabase | Same RLS/child-auth pattern as existing Leuro app |
| Admin dashboard | Supabase queries | Overview → house → class → learner drilldown, one dataset multiple views |
| Hosting | Vercel | Same as existing Leuro infrastructure |
| Question content generation | Any AI tool (ChatGPT/Gemini/Grok/Claude) | No POPIA risk — generic curriculum content only, zero learner/personal data ever in these prompts |

### White-label / hosting model
- Each school gets its **own separate Supabase project** (own tenant), matching the existing Leuro white-label pattern — "change the shell, keep the core"
- What changes per school: name/branding, colours, house names, mascot
- What stays constant: game engines, core question banks, underlying architecture

### Estimated infrastructure cost (Supabase, per school, at realistic daily-active-use compute tiers)

| School size | Est. monthly cost (ZAR) | Est. yearly cost (ZAR) |
|---|---|---|
| 500 learners | ~R650–840 | ~R7,800–10,000 |
| 1,000 learners | ~R1,580–1,860 | ~R19,000–22,300 |
| 1,500 learners | ~R2,420–2,975 | ~R29,000–35,700 |

*(Estimates based on published 2026 Supabase pricing; actual cost depends on real usage load — confirm with load testing before finalizing school pricing. Does not include Vercel hosting.)*

Even at the top end, infrastructure cost is a small fraction of proposed school pricing (~R150,000/year discussed) — margin holds up well.

---

## 8. Open Threads / Not Yet Decided

- Exact mechanic details for English, Afrikaans, NST, History, Geography boss/end-of-topic moments
- Sub-level pool sizing per taxonomy level (may vary by topic — TBD once real content drafting starts)
- Whether "most improved" recognition exists anywhere in the kid-facing UI (currently: house leaderboard only, no individual visibility)
- Full content build-out beyond Term 3 Maths (Terms 1, 2, 4; other subjects; other grades)
- Exact avatar/map visual design direction

---

## 9. Immediate Next Steps

1. Draft real question content for **Length** (smallest topic, 6 sub-levels + boss) as a test case for the full structure, using the confirmed 10-question round / 30-question pool sizing
2. Confirm Supabase schema for question bank + progress tracking tables
3. Once Length topic + working prototype both feel right with real content, scale content production to remaining 4 Term 3 topics

## 9a. Prototype Playtest Notes (12 Aug 2026)

- Built a rough, self-contained HTML/Canvas prototype of the Energy Duel mechanic (no Phaser — plain Canvas/JS used instead after an initial Phaser/CDN version failed to load reliably in the mobile app's file preview)
- Core loop confirmed to feel good: auto-fire, health bar tension, Guardian bow/block payoff all landed even with placeholder content and no real art
- **Finding:** original 5-question round size was too short — completed in ~20 seconds by an adult familiar with the content, well short of the ~5 minute target even accounting for a real kid thinking longer per question
- **Resolution:** round size increased to **10 questions**, pool size set at **30 questions per sub-level**
- Still to validate: actual timing with a real Grade 6 kid on real (non-trivial) content, since adult playtesting on placeholder questions isn't a reliable proxy for pace
