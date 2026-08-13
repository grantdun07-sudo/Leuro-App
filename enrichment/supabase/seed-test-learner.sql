-- ============================================================
-- Leuro Enrichment Tool — link a test learner to an auth account
--
-- Progress and grading are per-learner and derived from the signed-in
-- account, so testing needs a real auth user with a learners row attached.
--
-- STEP 1 (dashboard, not SQL): Authentication -> Users -> Add user.
--   Create a user with an email and password, and tick "Auto Confirm User"
--   so it can sign in immediately.
--
-- STEP 2: put that email below and run this file.
--
-- Safe to re-run: it updates the existing learner rather than duplicating.
-- ============================================================

-- >>> CHANGE THIS to the email you created in step 1 <<<
\set learner_email 'learner@example.com'

insert into houses (name, color)
select 'Falcon', '#E6B347'
where not exists (select 1 from houses where name = 'Falcon');

insert into learners (auth_user_id, display_name, grade, class_name, house_id)
select u.id, 'Test Learner', 6, '6A', (select id from houses where name = 'Falcon')
from auth.users u
where u.email = :'learner_email'
  and not exists (select 1 from learners l where l.auth_user_id = u.id);

-- If the learner already existed, make sure it is still wired to the account.
update learners l
   set house_id = coalesce(l.house_id, (select id from houses where name = 'Falcon')),
       grade = 6
from auth.users u
where u.email = :'learner_email' and l.auth_user_id = u.id;

-- ---------- Verify ----------
-- Expect exactly one row. An empty result means the email above does not
-- match a user in Authentication -> Users.
select l.id as learner_id,
       l.display_name,
       u.email,
       h.name as house,
       (select sl.code
          from learner_progress lp
          join sublevels sl on sl.id = lp.furthest_unlocked_sublevel_id
         where lp.learner_id = l.id) as furthest_unlocked
from learners l
join auth.users u on u.id = l.auth_user_id
left join houses h on h.id = l.house_id
where u.email = :'learner_email';
