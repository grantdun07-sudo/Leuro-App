-- ============================================================
-- Leuro Enrichment Tool — Seed: Grade 6, Term 3, Maths -> Length
--
-- Run this AFTER schema.sql, against the enrichment Supabase project.
-- Creates the topic structure the game queries (subject -> topic -> sub-levels)
-- and loads a placeholder question pool for sub-level 1.1 so the Supabase
-- wiring can be played end-to-end.
--
-- NOTE: the 1.1 questions below are the PLACEHOLDER set carried over from the
-- prototype. They are NOT the real CAPS-aligned content -- generating that is a
-- separate content-production step. Sub-levels 1.2-1.6 and the boss are created
-- here but intentionally left with empty pools until real content exists.
--
-- Safe to re-run: every insert is guarded against duplicates.
-- ============================================================

-- ---------- Subject ----------
insert into subjects (name, mechanic_type)
select 'Maths', 'boss_fight'
where not exists (select 1 from subjects where name = 'Maths');

-- ---------- Topic ----------
insert into topics (subject_id, grade, term, name, atp_hours, sort_order)
select s.id, 6, 3, 'Length', 6, 1
from subjects s
where s.name = 'Maths'
  and not exists (
    select 1 from topics where name = 'Length' and grade = 6 and term = 3
  );

-- ---------- Sub-levels (6 x ~1 ATP hour, + boss) ----------
-- Taxonomy scaffolds ACROSS the sequence, not within each sub-level:
--   first third -> lower order, middle third -> middle order,
--   last third  -> higher order, boss -> mixed.
insert into sublevels (topic_id, code, is_boss, taxonomy_level, sort_order)
select t.id, v.code, v.is_boss, v.taxonomy_level, v.sort_order
from topics t
cross join (values
  ('1.1',  false, 'remember',   1),
  ('1.2',  false, 'understand', 2),
  ('1.3',  false, 'apply',      3),
  ('1.4',  false, 'analyse',    4),
  ('1.5',  false, 'evaluate',   5),
  ('1.6',  false, 'evaluate',   6),
  ('boss', true,  null,         7)
) as v(code, is_boss, taxonomy_level, sort_order)
where t.name = 'Length' and t.grade = 6 and t.term = 3
  and not exists (
    select 1 from sublevels sl where sl.topic_id = t.id and sl.code = v.code
  );

-- ---------- Question pool for sub-level 1.1 (PLACEHOLDER CONTENT) ----------
insert into questions (sublevel_id, question_text, options, correct_index)
select sl.id, v.question_text, v.options, v.correct_index
from sublevels sl
join topics t on t.id = sl.topic_id
cross join (values
  ('Which unit would you use to measure the length of a classroom?', '["Millimetres", "Metres", "Kilometres", "Litres"]'::jsonb, 1),
  ('Convert 4500 m to km.', '["4.5 km", "45 km", "0.45 km", "450 km"]'::jsonb, 0),
  ('Which instrument best measures a long distance across a field?', '["Ruler", "Tape measure", "Trundle wheel", "Metre stick"]'::jsonb, 2),
  ('How many millimetres are in 1 centimetre?', '["10", "100", "1", "1000"]'::jsonb, 0),
  ('A pencil is about 15 what?', '["Metres", "Kilometres", "Centimetres", "Millilitres"]'::jsonb, 2),
  ('Convert 2.5 km to metres.', '["25 m", "250 m", "2500 m", "25000 m"]'::jsonb, 2),
  ('Which is the shortest length?', '["1 m", "10 cm", "100 mm", "1 km"]'::jsonb, 1),
  ('You measure a desk with a metre stick and get 1.2 m. What is this in cm?', '["12 cm", "120 cm", "1200 cm", "1.2 cm"]'::jsonb, 1),
  ('Which instrument would you use to measure the length of your finger?', '["Trundle wheel", "Tape measure", "Ruler", "Metre stick"]'::jsonb, 2),
  ('Convert 350 cm to metres.', '["0.35 m", "3.5 m", "35 m", "3500 m"]'::jsonb, 1),
  ('How many centimetres are in 1 metre?', '["10", "100", "1000", "10000"]'::jsonb, 1),
  ('Which is the longest distance?', '["500 m", "5 km", "5000 mm", "50 m"]'::jsonb, 1),
  ('A soccer field is about 100 what?', '["Centimetres", "Millimetres", "Metres", "Kilometres"]'::jsonb, 2),
  ('Convert 8 km to metres.', '["80 m", "800 m", "8000 m", "80000 m"]'::jsonb, 2),
  ('Which unit is best for measuring the distance between two cities?', '["Millimetres", "Centimetres", "Metres", "Kilometres"]'::jsonb, 3),
  ('Round 3.68 m to the nearest whole metre.', '["3 m", "4 m", "3.5 m", "3.7 m"]'::jsonb, 1),
  ('Convert 90 mm to cm.', '["0.9 cm", "9 cm", "900 cm", "9000 cm"]'::jsonb, 1),
  ('Which instrument measures length using a rolling wheel?', '["Ruler", "Tape measure", "Trundle wheel", "Metre stick"]'::jsonb, 2),
  ('A book is about 25 what?', '["Millimetres", "Centimetres", "Metres", "Kilometres"]'::jsonb, 1),
  ('Convert 6.2 km to metres.', '["62 m", "620 m", "6200 m", "62000 m"]'::jsonb, 2),
  ('Two walls measure 240 cm and 3.1 m. Which is longer?', '["240 cm", "3.1 m", "They are equal", "Cannot tell"]'::jsonb, 1),
  ('How many metres are in 1 kilometre?', '["10", "100", "1000", "10000"]'::jsonb, 2),
  ('Which is the best estimate for the height of a door?', '["2 m", "2 cm", "2 km", "20 mm"]'::jsonb, 0),
  ('Convert 1.75 m to cm.', '["17.5 cm", "175 cm", "1750 cm", "0.175 cm"]'::jsonb, 1),
  ('A stapler is about 12 what?', '["Metres", "Kilometres", "Centimetres", "Millimetres"]'::jsonb, 2),
  ('Which unit would you use to measure the thickness of a coin?', '["Millimetres", "Centimetres", "Metres", "Kilometres"]'::jsonb, 0),
  ('Convert 12500 m to km.', '["1.25 km", "12.5 km", "125 km", "1250 km"]'::jsonb, 1),
  ('A rope is 4.5 m long. How many centimetres is that?', '["45 cm", "450 cm", "4500 cm", "0.45 cm"]'::jsonb, 1),
  ('Which of these lengths is the same as 500 cm?', '["0.5 m", "5 m", "50 m", "5000 m"]'::jsonb, 1),
  ('You walk 1.3 km to school. How many metres is that?', '["13 m", "130 m", "1300 m", "13000 m"]'::jsonb, 2)
) as v(question_text, options, correct_index)
where t.name = 'Length' and t.grade = 6 and t.term = 3
  and sl.code = '1.1'
  and not exists (
    select 1 from questions q
    where q.sublevel_id = sl.id and q.question_text = v.question_text
  );

-- ---------- Verify ----------
-- Expect: 7 sub-levels, and 30 active questions on 1.1 (0 elsewhere for now).
select sl.code, sl.taxonomy_level, count(q.id) filter (where q.active) as active_questions
from sublevels sl
join topics t on t.id = sl.topic_id
left join questions q on q.sublevel_id = sl.id
where t.name = 'Length' and t.grade = 6 and t.term = 3
group by sl.code, sl.taxonomy_level, sl.sort_order
order by sl.sort_order;
