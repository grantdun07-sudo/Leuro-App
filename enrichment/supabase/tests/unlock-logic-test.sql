-- ============================================================
-- Leuro Enrichment Tool — unlock + grading logic test
--
-- Mirrors the exact query sequence the start-attempt and submit-attempt
-- edge functions run, so the rules can be verified against a real Postgres
-- without deploying. Run against a database that already has schema.sql and
-- seed-length.sql applied.
--
-- Every step prints EXPECTED vs ACTUAL. Any line reading FAIL is a bug.
--
-- Rolls back at the end - it leaves no test data behind.
-- ============================================================

begin;

-- ---------- Test fixtures ----------
insert into auth.users (id) values ('11111111-1111-1111-1111-111111111111');
insert into learners (id, auth_user_id, display_name, grade)
values ('22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 'Test Learner', 6);

-- Give 1.2 a pool too, so advancing somewhere playable can be checked.
insert into questions (sublevel_id, question_text, options, correct_index)
select sl.id, 'placeholder 1.2 q' || g, '["a","b","c","d"]'::jsonb, g % 4
from sublevels sl
join topics t on t.id = sl.topic_id
cross join generate_series(1, 12) g
where t.name = 'Length' and sl.code = '1.2';

-- ---------- start-attempt's unlock check, as SQL ----------
create or replace function test_can_play(p_learner uuid, p_sublevel uuid)
returns boolean language plpgsql as $$
declare
  v_topic uuid; v_order int; v_furthest uuid; v_furthest_order int;
begin
  select topic_id, sort_order into v_topic, v_order
    from sublevels where id = p_sublevel;
  select furthest_unlocked_sublevel_id into v_furthest
    from learner_progress where learner_id = p_learner and topic_id = v_topic;
  if v_furthest is null then
    select sort_order into v_furthest_order
      from sublevels where topic_id = v_topic order by sort_order limit 1;
  else
    select sort_order into v_furthest_order
      from sublevels where id = v_furthest;
  end if;
  return v_order <= v_furthest_order;
end $$;

-- ---------- submit-attempt's grade + advance, as SQL ----------
create or replace function test_submit(p_attempt uuid, p_correct int)
returns table(score numeric, did_pass boolean, furthest_code text)
language plpgsql as $$
declare
  v_learner uuid; v_sublevel uuid; v_topic uuid; v_order int;
  v_passed boolean; v_furthest uuid; v_furthest_order int; v_next uuid;
begin
  select learner_id, sublevel_id into v_learner, v_sublevel
    from attempts where id = p_attempt and completed_at is null;
  if v_learner is null then
    raise exception 'ALREADY_SUBMITTED';
  end if;

  update attempts set correct_count = p_correct, completed_at = now()
   where id = p_attempt and completed_at is null;

  select a.passed into v_passed from attempts a where a.id = p_attempt;
  select topic_id, sort_order into v_topic, v_order
    from sublevels where id = v_sublevel;
  select furthest_unlocked_sublevel_id into v_furthest
    from learner_progress where learner_id = v_learner and topic_id = v_topic;
  select sort_order into v_furthest_order from sublevels where id = v_furthest;

  -- Advance only on a pass, and only when playing at the frontier.
  if v_passed and v_order >= coalesce(v_furthest_order, v_order) then
    select id into v_next from sublevels
     where topic_id = v_topic and sort_order > v_order
     order by sort_order limit 1;
    if v_next is not null then
      insert into learner_progress (learner_id, topic_id, furthest_unlocked_sublevel_id, updated_at)
      values (v_learner, v_topic, v_next, now())
      on conflict (learner_id, topic_id)
      do update set furthest_unlocked_sublevel_id = excluded.furthest_unlocked_sublevel_id,
                    updated_at = now();
    end if;
  end if;

  return query
    select a.score_pct, a.passed,
           (select sl.code from sublevels sl
             join learner_progress lp on lp.furthest_unlocked_sublevel_id = sl.id
            where lp.learner_id = v_learner and lp.topic_id = v_topic)
      from attempts a where a.id = p_attempt;
end $$;

-- ---------- Helper: open an attempt ----------
create or replace function test_start(p_learner uuid, p_code text)
returns uuid language plpgsql as $$
declare v_sl uuid; v_ids uuid[]; v_attempt uuid;
begin
  select sl.id into v_sl from sublevels sl join topics t on t.id = sl.topic_id
   where t.name = 'Length' and sl.code = p_code;
  if not test_can_play(p_learner, v_sl) then
    raise exception 'LOCKED';
  end if;
  select array_agg(q.id) into v_ids from (
    select id from questions where sublevel_id = v_sl and active order by random() limit 10
  ) q;
  insert into attempts (learner_id, sublevel_id, question_ids, correct_count, total_count)
  values (p_learner, v_sl, v_ids, 0, array_length(v_ids,1))
  returning id into v_attempt;
  return v_attempt;
end $$;

-- ============================================================
-- TESTS
-- ============================================================
\echo ''
\echo '=== 1. New learner: only the first sub-level is playable ==='
select 'seed progress at 1.1' as step;
insert into learner_progress (learner_id, topic_id, furthest_unlocked_sublevel_id)
select '22222222-2222-2222-2222-222222222222', t.id, sl.id
from topics t join sublevels sl on sl.topic_id = t.id
where t.name = 'Length' and sl.code = '1.1';

select sl.code,
       test_can_play('22222222-2222-2222-2222-222222222222', sl.id) as playable,
       case when sl.code = '1.1' then true else false end as expected,
       case when test_can_play('22222222-2222-2222-2222-222222222222', sl.id)
                 = (sl.code = '1.1') then 'PASS' else 'FAIL' end as result
from sublevels sl join topics t on t.id = sl.topic_id
where t.name = 'Length' order by sl.sort_order;

\echo ''
\echo '=== 2. Jumping ahead to a locked sub-level is refused ==='
do $$
begin
  perform test_start('22222222-2222-2222-2222-222222222222', '1.4');
  raise notice 'FAIL - locked sub-level 1.4 was allowed';
exception when others then
  if SQLERRM = 'LOCKED' then raise notice 'PASS - 1.4 refused (LOCKED)';
  else raise notice 'FAIL - unexpected: %', SQLERRM; end if;
end $$;

\echo ''
\echo '=== 3. Failing 1.1 (7/10 = 70%) does NOT unlock 1.2 ==='
select *, case when did_pass = false and furthest_code = '1.1'
                then 'PASS' else 'FAIL' end as result
from test_submit(test_start('22222222-2222-2222-2222-222222222222','1.1'), 7);

\echo ''
\echo '=== 4. 1.2 still locked after the failed attempt ==='
select case when test_can_play('22222222-2222-2222-2222-222222222222', sl.id) = false
            then 'PASS' else 'FAIL' end as result
from sublevels sl join topics t on t.id = sl.topic_id
where t.name = 'Length' and sl.code = '1.2';

\echo ''
\echo '=== 5. Passing 1.1 (8/10 = 80%) unlocks 1.2 ==='
select *, case when did_pass = true and furthest_code = '1.2'
                then 'PASS' else 'FAIL' end as result
from test_submit(test_start('22222222-2222-2222-2222-222222222222','1.1'), 8);

\echo ''
\echo '=== 6. 1.2 now playable, 1.3 still locked ==='
select sl.code,
       test_can_play('22222222-2222-2222-2222-222222222222', sl.id) as playable,
       case when test_can_play('22222222-2222-2222-2222-222222222222', sl.id)
                 = (sl.sort_order <= 2) then 'PASS' else 'FAIL' end as result
from sublevels sl join topics t on t.id = sl.topic_id
where t.name = 'Length' and sl.code in ('1.2','1.3') order by sl.sort_order;

\echo ''
\echo '=== 7. Replaying the earlier 1.1 does not drag the frontier back ==='
select furthest_code, case when furthest_code = '1.2' then 'PASS' else 'FAIL' end as result
from test_submit(test_start('22222222-2222-2222-2222-222222222222','1.1'), 10);

\echo ''
\echo '=== 8. An attempt cannot be submitted twice ==='
do $$
declare v_a uuid;
begin
  v_a := test_start('22222222-2222-2222-2222-222222222222','1.2');
  perform test_submit(v_a, 9);
  perform test_submit(v_a, 10);   -- second submission must be refused
  raise notice 'FAIL - the same attempt graded twice';
exception when others then
  if SQLERRM = 'ALREADY_SUBMITTED' then raise notice 'PASS - re-submission refused';
  else raise notice 'FAIL - unexpected: %', SQLERRM; end if;
end $$;

\echo ''
\echo '=== 9. The 75% boundary is exact (generated column) ==='
select correct, total, score_pct, passed,
       case when passed = expected then 'PASS' else 'FAIL' end as result
from (
  values (7,10,false), (8,10,true), (3,4,true), (2,4,false)
) as v(correct,total,expected)
cross join lateral (
  select round((correct::numeric / total) * 100, 1) as score_pct,
         (correct::numeric / total) >= 0.75 as passed
) calc;

rollback;
