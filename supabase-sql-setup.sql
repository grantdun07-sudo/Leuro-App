-- =====================================================================
-- Leuro (TM) -- Supabase setup script
-- Run this entire file in Supabase Dashboard -> SQL Editor
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible
-- =====================================================================

-- ---------------------------------------------------------------------
-- EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- TABLES
-- ---------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null check (role in ('learner', 'parent', 'admin')),
  full_name text,
  avatar_url text,
  subscription_tier text default 'free' check (subscription_tier in ('free', 'basic', 'premium')),
  subscription_ends_at timestamp,
  referral_code text unique,
  referral_count int default 0,
  referred_by text,
  lang text default 'en' check (lang in ('en', 'af')),
  account_frozen boolean default false,
  freeze_reason text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- Migration for existing tables (safe to re-run)
alter table public.profiles add column if not exists account_frozen boolean default false;
alter table public.profiles add column if not exists freeze_reason text;

create table if not exists public.learners (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  grade int not null check (grade >= 4 and grade <= 12),
  diagnostic_level int default 0 check (diagnostic_level >= 0 and diagnostic_level <= 5),
  topics_studied int default 0,
  sessions_completed int default 0,
  last_session timestamp,
  created_at timestamp default now()
);

create table if not exists public.parents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  linked_learners uuid[] default array[]::uuid[],
  created_at timestamp default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null,
  grade int not null,
  curriculum text not null check (curriculum in ('caps', 'ieb')),
  created_at timestamp default now(),
  unique (name, grade, curriculum)
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  title text not null,
  description text,
  times_studied int default 0,
  last_studied timestamp,
  created_at timestamp default now()
);

create table if not exists public.diagnostic_attempts (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  grade int not null,
  subject_id uuid references public.subjects(id),
  language text,
  questions jsonb,
  answers jsonb,
  score int,
  level_assigned int check (level_assigned >= 1 and level_assigned <= 5),
  level_determined int check (level_determined >= 1 and level_determined <= 5),
  created_at timestamp default now()
);

-- Migration for existing databases: the diagnostic is now a mixed-subject
-- AI quiz, so subject_id is optional and the questions/answers are stored as
-- JSON alongside the assigned level.
alter table public.diagnostic_attempts alter column subject_id drop not null;
alter table public.diagnostic_attempts add column if not exists language text;
alter table public.diagnostic_attempts add column if not exists questions jsonb;
alter table public.diagnostic_attempts add column if not exists answers jsonb;
alter table public.diagnostic_attempts add column if not exists level_assigned int;

create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  topic_id uuid not null references public.topics(id),
  phase text not null check (phase in ('explain', 'example', 'attempt', 'feedback')),
  learner_input text,
  ai_response text,
  completed_at timestamp,
  created_at timestamp default now()
);

create table if not exists public.mock_exams (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_id uuid not null references public.subjects(id),
  difficulty text not null check (difficulty in ('low', 'medium', 'high')),
  total_marks int default 30,
  learner_score int,
  started_at timestamp,
  completed_at timestamp,
  created_at timestamp default now()
);

create table if not exists public.mock_exam_questions (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid not null references public.mock_exams(id) on delete cascade,
  question_text text not null,
  question_type text not null default 'shortanswer' check (question_type in ('mcq', 'shortanswer', 'extended')),
  options jsonb,
  blooms_level text,
  correct_answer text,
  marks int not null,
  question_order int,
  created_at timestamp default now()
);

-- Migration for installs created before Phase 2 (adds question_type/options/
-- blooms_level/correct_answer to an existing mock_exam_questions table).
alter table public.mock_exam_questions add column if not exists question_type text not null default 'shortanswer';
alter table public.mock_exam_questions add column if not exists options jsonb;
alter table public.mock_exam_questions add column if not exists blooms_level text;
alter table public.mock_exam_questions add column if not exists correct_answer text;

-- Migration: daily study streak counter shown on the dashboard Home tab.
alter table public.learners add column if not exists streak_days int default 0;

-- Migration: allow free-form follow-up chat messages in the Learn tab.
alter table public.study_sessions drop constraint if exists study_sessions_phase_check;
alter table public.study_sessions add constraint study_sessions_phase_check
  check (phase in ('explain', 'example', 'attempt', 'feedback', 'chat'));

create table if not exists public.mock_exam_responses (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.mock_exam_questions(id) on delete cascade,
  learner_response text,
  marks_awarded int,
  feedback text,
  created_at timestamp default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  code text unique not null,
  uses_count int default 0,
  created_at timestamp default now()
);

create table if not exists public.referral_redemptions (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.learners(id),
  referee_id uuid not null references public.learners(id),
  redeemed_at timestamp default now()
);

create table if not exists public.subscription_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  tier_from text,
  tier_to text not null,
  amount_paid decimal,
  currency text default 'ZAR',
  payment_ref text,
  source text check (source in ('payfast', 'referral', 'admin')),
  created_at timestamp default now()
);

create table if not exists public.parent_alerts (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents(id),
  learner_id uuid not null references public.learners(id),
  alert_type text not null,
  message text,
  read_at timestamp,
  created_at timestamp default now()
);

-- Content safety flags raised by the client-side checkContent() screen
-- (self-harm/crisis language = severity 1, profanity/slurs/sexual/
-- discriminatory language = severity 2).
-- learner_id may be null (e.g. if the learner record hasn't loaded yet);
-- user_id is always set from the caller's auth session and is the
-- fallback ownership column for RLS.
create table if not exists public.content_flags (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid references public.learners(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  severity int not null check (severity in (1, 2)),
  flagged_text text not null,
  context text,
  account_frozen boolean default false,
  parent_acknowledged boolean default false,
  created_at timestamp default now()
);

-- Migration for existing tables (safe to re-run)
alter table public.content_flags alter column learner_id drop not null;
alter table public.content_flags add column if not exists user_id uuid references auth.users(id) on delete cascade;
alter table public.content_flags add column if not exists parent_acknowledged boolean default false;

-- Saved Study Guides (Exams tab > Study Guide section > "Save Guide")
create table if not exists public.saved_guides (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.learners(id) on delete cascade,
  subject_id uuid references public.subjects(id),
  topic_title text not null,
  key_concepts jsonb,
  example text,
  self_check_question text,
  self_check_answer text,
  created_at timestamp default now()
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
create index if not exists idx_learners_user_id on public.learners(user_id);
create index if not exists idx_parents_user_id on public.parents(user_id);
create index if not exists idx_topics_learner_id on public.topics(learner_id);
create index if not exists idx_study_sessions_learner_id on public.study_sessions(learner_id);
create index if not exists idx_study_sessions_created_at on public.study_sessions(created_at);
create index if not exists idx_saved_guides_learner_id on public.saved_guides(learner_id);
create index if not exists idx_mock_exams_learner_id on public.mock_exams(learner_id);
create index if not exists idx_mock_exam_questions_exam_id on public.mock_exam_questions(exam_id);
create index if not exists idx_mock_exam_responses_question_id on public.mock_exam_responses(question_id);
create index if not exists idx_parent_alerts_parent_id on public.parent_alerts(parent_id);
create index if not exists idx_subjects_grade_curriculum on public.subjects(grade, curriculum);
create index if not exists idx_content_flags_learner_id on public.content_flags(learner_id);
create index if not exists idx_content_flags_user_id on public.content_flags(user_id);
create index if not exists idx_content_flags_created_at on public.content_flags(created_at);

-- ---------------------------------------------------------------------
-- FUNCTIONS & TRIGGERS
-- ---------------------------------------------------------------------

-- Auto-create profile (+ learner/parent record) when a new auth user signs up
create or replace function public.handle_new_user()
returns trigger as $$
declare
  v_role text;
  v_grade int;
begin
  v_role := coalesce(new.raw_user_meta_data->>'role', 'learner');

  insert into public.profiles (id, email, role, full_name, referral_code, lang, referred_by)
  values (
    new.id,
    new.email,
    v_role,
    new.raw_user_meta_data->>'full_name',
    substring(replace(gen_random_uuid()::text, '-', ''), 1, 8),
    coalesce(new.raw_user_meta_data->>'lang', 'en'),
    nullif(new.raw_user_meta_data->>'referred_by', '')
  );

  if v_role = 'learner' then
    v_grade := coalesce((new.raw_user_meta_data->>'grade')::int, 8);
    insert into public.learners (user_id, grade) values (new.id, v_grade);
  elsif v_role = 'parent' then
    insert into public.parents (user_id) values (new.id);
  end if;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep profiles.updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Allow a learner to raise a parent alert for any parent linked to them
create or replace function public.create_parent_alert(p_learner_id uuid, p_alert_type text, p_message text)
returns void as $$
begin
  if not exists (select 1 from public.learners where id = p_learner_id and user_id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  insert into public.parent_alerts (parent_id, learner_id, alert_type, message)
  select p.id, p_learner_id, p_alert_type, p_message
  from public.parents p
  where p_learner_id = any(p.linked_learners);
end;
$$ language plpgsql security definer set search_path = public;

-- Link a parent to a learner via the learner's referral/account code (used by parent dashboard)
create or replace function public.link_learner_to_parent(p_learner_code text)
returns boolean as $$
declare
  v_parent_id uuid;
  v_learner_id uuid;
begin
  select id into v_parent_id from public.parents where user_id = auth.uid();
  if v_parent_id is null then
    raise exception 'not a parent account';
  end if;

  select l.id into v_learner_id
  from public.learners l
  join public.profiles p on p.id = l.user_id
  where p.referral_code = p_learner_code;

  if v_learner_id is null then
    return false;
  end if;

  update public.parents
  set linked_learners = array_append(linked_learners, v_learner_id)
  where id = v_parent_id and not (v_learner_id = any(linked_learners));

  return true;
end;
$$ language plpgsql security definer set search_path = public;

-- ---------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.learners enable row level security;
alter table public.parents enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.diagnostic_attempts enable row level security;
alter table public.study_sessions enable row level security;
alter table public.mock_exams enable row level security;
alter table public.mock_exam_questions enable row level security;
alter table public.mock_exam_responses enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_redemptions enable row level security;
alter table public.subscription_history enable row level security;
alter table public.parent_alerts enable row level security;
alter table public.saved_guides enable row level security;
alter table public.content_flags enable row level security;

-- profiles
drop policy if exists "Users can read own profile" on public.profiles;
create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);

-- The handle_new_user() trigger (SECURITY DEFINER) normally creates the profile
-- row and bypasses RLS. This INSERT policy additionally allows the client to
-- create its OWN profile row as a fallback (id must equal the caller's UID),
-- in case the trigger is absent or failed.
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

drop policy if exists "Parents can read linked learner profiles" on public.profiles;
create policy "Parents can read linked learner profiles" on public.profiles for select using (
  id in (
    select l.user_id from public.learners l
    where l.id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
  )
);

-- subjects (read-only reference data, visible to all signed-in users)
drop policy if exists "Authenticated users can read subjects" on public.subjects;
create policy "Authenticated users can read subjects" on public.subjects for select using (auth.role() = 'authenticated');

-- learners
drop policy if exists "Learners can read own data" on public.learners;
create policy "Learners can read own data" on public.learners for select using (auth.uid() = user_id);

drop policy if exists "Learners can insert own data" on public.learners;
create policy "Learners can insert own data" on public.learners for insert with check (auth.uid() = user_id);

drop policy if exists "Learners can update own data" on public.learners;
create policy "Learners can update own data" on public.learners for update using (auth.uid() = user_id);

drop policy if exists "Parents can read linked learners" on public.learners;
create policy "Parents can read linked learners" on public.learners for select using (
  id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- parents
drop policy if exists "Parents can read own data" on public.parents;
create policy "Parents can read own data" on public.parents for select using (auth.uid() = user_id);

drop policy if exists "Parents can insert own data" on public.parents;
create policy "Parents can insert own data" on public.parents for insert with check (auth.uid() = user_id);

drop policy if exists "Parents can update own data" on public.parents;
create policy "Parents can update own data" on public.parents for update using (auth.uid() = user_id);

-- topics
drop policy if exists "Learners manage own topics" on public.topics;
create policy "Learners manage own topics" on public.topics for all using (
  learner_id in (select id from public.learners where user_id = auth.uid())
) with check (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Parents read linked learner topics" on public.topics;
create policy "Parents read linked learner topics" on public.topics for select using (
  learner_id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- diagnostic_attempts
drop policy if exists "Learners manage own diagnostic attempts" on public.diagnostic_attempts;
create policy "Learners manage own diagnostic attempts" on public.diagnostic_attempts for all using (
  learner_id in (select id from public.learners where user_id = auth.uid())
) with check (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Parents read linked learner diagnostics" on public.diagnostic_attempts;
create policy "Parents read linked learner diagnostics" on public.diagnostic_attempts for select using (
  learner_id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- study_sessions
drop policy if exists "Learners manage own study sessions" on public.study_sessions;
create policy "Learners manage own study sessions" on public.study_sessions for all using (
  learner_id in (select id from public.learners where user_id = auth.uid())
) with check (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Parents read linked learner study sessions" on public.study_sessions;
create policy "Parents read linked learner study sessions" on public.study_sessions for select using (
  learner_id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- saved_guides
drop policy if exists "Learners manage own saved guides" on public.saved_guides;
create policy "Learners manage own saved guides" on public.saved_guides for all using (
  learner_id in (select id from public.learners where user_id = auth.uid())
) with check (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

-- mock_exams
drop policy if exists "Learners manage own mock exams" on public.mock_exams;
create policy "Learners manage own mock exams" on public.mock_exams for all using (
  learner_id in (select id from public.learners where user_id = auth.uid())
) with check (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Parents read linked learner mock exams" on public.mock_exams;
create policy "Parents read linked learner mock exams" on public.mock_exams for select using (
  learner_id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- mock_exam_questions (no direct insert from client - edge functions use service role)
drop policy if exists "Learners read own exam questions" on public.mock_exam_questions;
create policy "Learners read own exam questions" on public.mock_exam_questions for select using (
  exam_id in (
    select id from public.mock_exams where learner_id in (
      select id from public.learners where user_id = auth.uid()
    )
  )
);

-- mock_exam_responses
drop policy if exists "Learners read own exam responses" on public.mock_exam_responses;
create policy "Learners read own exam responses" on public.mock_exam_responses for select using (
  question_id in (
    select q.id from public.mock_exam_questions q
    join public.mock_exams e on e.id = q.exam_id
    where e.learner_id in (select id from public.learners where user_id = auth.uid())
  )
);

-- referral_codes
drop policy if exists "Learners read own referral code" on public.referral_codes;
create policy "Learners read own referral code" on public.referral_codes for select using (
  learner_id in (select id from public.learners where user_id = auth.uid())
);

-- referral_redemptions
drop policy if exists "Learners read own referral redemptions" on public.referral_redemptions;
create policy "Learners read own referral redemptions" on public.referral_redemptions for select using (
  referrer_id in (select id from public.learners where user_id = auth.uid())
  or referee_id in (select id from public.learners where user_id = auth.uid())
);

-- subscription_history
drop policy if exists "Users read own subscription history" on public.subscription_history;
create policy "Users read own subscription history" on public.subscription_history for select using (
  auth.uid() = user_id
);

-- content_flags
-- Ownership is checked via user_id (always set by the client to the
-- caller's auth uid) OR learner_id (when available), so inserts succeed
-- even if learner_id is null.
drop policy if exists "Learners can insert own content flags" on public.content_flags;
create policy "Learners can insert own content flags" on public.content_flags for insert with check (
  user_id = auth.uid()
  or learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Learners can read own content flags" on public.content_flags;
create policy "Learners can read own content flags" on public.content_flags for select using (
  user_id = auth.uid()
  or learner_id in (select id from public.learners where user_id = auth.uid())
);

drop policy if exists "Parents can read linked learner content flags" on public.content_flags;
create policy "Parents can read linked learner content flags" on public.content_flags for select using (
  learner_id in (select unnest(linked_learners) from public.parents where user_id = auth.uid())
);

-- parent_alerts
drop policy if exists "Parents read own alerts" on public.parent_alerts;
create policy "Parents read own alerts" on public.parent_alerts for select using (
  parent_id in (select id from public.parents where user_id = auth.uid())
);

drop policy if exists "Parents update own alerts" on public.parent_alerts;
create policy "Parents update own alerts" on public.parent_alerts for update using (
  parent_id in (select id from public.parents where user_id = auth.uid())
);

-- ---------------------------------------------------------------------
-- SEED DATA: CAPS subjects, Grades 4-12
-- ---------------------------------------------------------------------

-- Intermediate Phase: Grades 4-6
insert into public.subjects (name, code, grade, curriculum)
select s.name, s.code, g.grade, 'caps'
from (values
  ('Mathematics', 'MATH'),
  ('English Home Language', 'ENG_HL'),
  ('Afrikaans Home Language', 'AFR_HL'),
  ('Natural Sciences and Technology', 'NST'),
  ('Social Sciences', 'SS'),
  ('Life Skills', 'LS')
) as s(name, code)
cross join (select generate_series(4, 6) as grade) as g
on conflict (name, grade, curriculum) do nothing;

-- Senior Phase: Grades 7-9
insert into public.subjects (name, code, grade, curriculum)
select s.name, s.code, g.grade, 'caps'
from (values
  ('Mathematics', 'MATH'),
  ('English Home Language', 'ENG_HL'),
  ('Afrikaans First Additional Language', 'AFR_FAL'),
  ('Natural Sciences', 'NS'),
  ('Social Sciences', 'SS'),
  ('Technology', 'TECH'),
  ('Economic and Management Sciences', 'EMS'),
  ('Life Orientation', 'LO'),
  ('Creative Arts', 'ARTS')
) as s(name, code)
cross join (select generate_series(7, 9) as grade) as g
on conflict (name, grade, curriculum) do nothing;

-- FET Phase: Grades 10-12
insert into public.subjects (name, code, grade, curriculum)
select s.name, s.code, g.grade, 'caps'
from (values
  ('Mathematics', 'MATH'),
  ('Mathematical Literacy', 'MATH_LIT'),
  ('English Home Language', 'ENG_HL'),
  ('Afrikaans First Additional Language', 'AFR_FAL'),
  ('Life Orientation', 'LO'),
  ('Physical Sciences', 'PHYS_SCI'),
  ('Life Sciences', 'LIFE_SCI'),
  ('Geography', 'GEO'),
  ('History', 'HIST'),
  ('Accounting', 'ACC'),
  ('Business Studies', 'BUS'),
  ('Economics', 'ECON')
) as s(name, code)
cross join (select generate_series(10, 12) as grade) as g
on conflict (name, grade, curriculum) do nothing;

-- =====================================================================
-- Done. Verify under Table Editor that all tables + seed subjects exist.
-- =====================================================================
