-- ============================================================
-- Leuro Enrichment Tool — Starter Schema
-- Pilot scope: Grade 6, Term 3, Maths (Length topic)
-- Designed to extend cleanly to other subjects/topics/grades later
-- ============================================================

-- ---------- Core content structure ----------

create table subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,                -- e.g. 'Maths', 'English', 'Afrikaans'
  mechanic_type text not null,       -- e.g. 'boss_fight', 'room_builder', 'pet_collection', 'expedition'
  created_at timestamptz default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) not null,
  grade int not null,                -- e.g. 6
  term int not null,                 -- e.g. 3
  name text not null,                -- e.g. 'Length', 'Properties of 2D Shapes'
  atp_hours numeric not null,        -- hours per ATP, used to size sub-level count
  sort_order int not null,
  created_at timestamptz default now()
);

create table sublevels (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) not null,
  code text not null,                 -- e.g. '1.1', '1.2', 'boss'
  is_boss boolean default false,
  taxonomy_level text,                -- 'remember','understand','apply','analyse','evaluate' (Bloom's)
                                       -- or 'literal','reorganisation','inferential','evaluation','appreciation' (Barrett's)
  sort_order int not null,
  created_at timestamptz default now(),
  unique(topic_id, code)
);

-- ---------- Question bank ----------

create table questions (
  id uuid primary key default gen_random_uuid(),
  sublevel_id uuid references sublevels(id) not null,
  question_text text not null,
  options jsonb not null,             -- array of 4 strings, e.g. ["4.5 km", "45 km", "0.45 km", "450 km"]
  correct_index int not null,         -- 0-indexed position of correct option
  active boolean default true,        -- allows retiring bad questions without deleting
  created_at timestamptz default now()
);

create index idx_questions_sublevel on questions(sublevel_id) where active = true;

-- ---------- Learners, houses, schools (multi-tenant ready) ----------

create table houses (
  id uuid primary key default gen_random_uuid(),
  name text not null,                 -- e.g. 'Falcon', 'Griffin'
  color text,
  created_at timestamptz default now()
);

create table learners (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid references auth.users(id),  -- links to Supabase auth, matches existing Leuro child-auth pattern
  display_name text not null,
  grade int not null,
  class_name text,
  house_id uuid references houses(id),
  created_at timestamptz default now()
);

-- ---------- Progress tracking ----------

create table attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) not null,
  sublevel_id uuid references sublevels(id) not null,
  question_ids uuid[] not null,       -- the specific 10 (or boss: more) questions pulled for this attempt
  correct_count int not null,
  total_count int not null,
  score_pct numeric generated always as (round((correct_count::numeric / nullif(total_count,0)) * 100, 1)) stored,
  passed boolean generated always as ((correct_count::numeric / nullif(total_count,0)) >= 0.75) stored,
  started_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_attempts_learner on attempts(learner_id);
create index idx_attempts_sublevel on attempts(sublevel_id);

-- learner's furthest unlocked sub-level per topic — drives the sequential-unlock rule
create table learner_progress (
  learner_id uuid references learners(id) not null,
  topic_id uuid references topics(id) not null,
  furthest_unlocked_sublevel_id uuid references sublevels(id),
  updated_at timestamptz default now(),
  primary key (learner_id, topic_id)
);

-- ---------- House points (feeds kid-visible leaderboard) ----------

create table house_points_log (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references learners(id) not null,
  house_id uuid references houses(id) not null,
  attempt_id uuid references attempts(id) not null,
  points numeric not null,            -- weighted per subject (core subjects worth more)
  awarded_at timestamptz default now()
);

-- ---------- Admin controls ----------

create table subject_boost_windows (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid references subjects(id) not null,
  multiplier numeric not null default 2.0,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  approved_by text,                   -- admin user who approved the (possibly auto-suggested) boost
  auto_suggested boolean default false,
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security — enable and scope per Leuro's existing child-auth pattern.
-- Placeholder policies below; tighten to match actual Leuro RLS conventions
-- before this goes anywhere near real learner data.
-- ============================================================

alter table learners enable row level security;
alter table attempts enable row level security;
alter table learner_progress enable row level security;
alter table house_points_log enable row level security;

-- Example placeholder policy — replace with real Leuro auth pattern:
-- create policy "learners can only see their own attempts"
--   on attempts for select
--   using (learner_id in (select id from learners where auth_user_id = auth.uid()));
