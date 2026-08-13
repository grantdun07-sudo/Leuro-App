-- ============================================================
-- Leuro Enrichment Tool — RLS for the content tables
--
-- Run AFTER schema.sql. This is the other half of keeping the answer key
-- off the client: the game no longer receives correct_index, but without
-- these policies anyone holding the publishable key could still read it
-- straight off the REST API:
--
--   GET /rest/v1/questions?select=*   ->  the entire answer key
--
-- Postgres denies everything on a table once RLS is enabled and no policy
-- grants access, and the service_role used by the edge functions bypasses
-- RLS entirely. So "enable, grant nothing" is what locks the question bank
-- to the server while leaving the functions working.
--
-- Safe to re-run.
-- ============================================================

-- ---------- The answer key: server-only ----------
-- No policies on purpose. Only the service_role (edge functions) may read
-- questions, so correct_index is unreachable from the browser.
alter table questions enable row level security;

-- ---------- Content structure: readable, carries no answers ----------
-- Sub-level codes and topic names are harmless, and letting a signed-in
-- learner read them keeps the map cheap to render.
alter table subjects  enable row level security;
alter table topics    enable row level security;
alter table sublevels enable row level security;
alter table houses    enable row level security;

drop policy if exists "signed-in learners can read subjects"  on subjects;
drop policy if exists "signed-in learners can read topics"    on topics;
drop policy if exists "signed-in learners can read sublevels" on sublevels;
drop policy if exists "signed-in learners can read houses"    on houses;

create policy "signed-in learners can read subjects"
  on subjects for select to authenticated using (true);

create policy "signed-in learners can read topics"
  on topics for select to authenticated using (true);

create policy "signed-in learners can read sublevels"
  on sublevels for select to authenticated using (true);

create policy "signed-in learners can read houses"
  on houses for select to authenticated using (true);

-- ---------- Admin-only ----------
-- Boost windows are approved by a human admin; no client role may touch them.
alter table subject_boost_windows enable row level security;

-- ---------- Verify ----------
-- Every table below should report rls_enabled = true.
-- questions and subject_boost_windows should have 0 policies (server-only);
-- the content-structure tables should have exactly 1 read policy each.
--
-- learners / attempts / learner_progress / house_points_log already have RLS
-- enabled by schema.sql with no policies, which is what we want: they are
-- reached only through the edge functions running as service_role.
select c.relname as table_name,
       c.relrowsecurity as rls_enabled,
       count(p.polname) as policies
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relkind = 'r'
group by c.relname, c.relrowsecurity
order by c.relname;
