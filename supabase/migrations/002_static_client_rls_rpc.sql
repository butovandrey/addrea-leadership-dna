-- =============================================================================
-- 002_static_client_rls_rpc.sql
-- ADDREA Leadership DNA — client-side / static hosting security model
--
-- Goals:
--   * No service_role in the browser
--   * anon cannot SELECT raw responses or other participants' names/drafts
--   * Own survey ops only via token-gated SECURITY DEFINER RPCs
--   * Team DNA only as pre-aggregated JSON (no participant_id / names)
--   * openAnswers = anonymous text strings only (when sample >= 3)
--   * SECURITY DEFINER: search_path = '' + fully schema-qualified names
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1) Drop old deny-centric policies from 001 (recreate explicitly below)
-- -----------------------------------------------------------------------------
drop policy if exists "participants_no_anon_select" on public.participants;
drop policy if exists "participants_no_anon_insert" on public.participants;
drop policy if exists "participants_no_anon_update" on public.participants;
drop policy if exists "responses_no_anon_all" on public.responses;

-- Keep sessions / questions / options select policies from 001
-- (sessions_select_active, questions_select_all, options_select_all)

-- -----------------------------------------------------------------------------
-- 2) RLS: lock tables for direct anon access
-- -----------------------------------------------------------------------------
alter table public.sessions enable row level security;
alter table public.participants enable row level security;
alter table public.questions enable row level security;
alter table public.options enable row level security;
alter table public.responses enable row level security;

create policy "participants_anon_deny_select"
  on public.participants for select to anon using (false);

create policy "participants_anon_deny_insert"
  on public.participants for insert to anon with check (false);

create policy "participants_anon_deny_update"
  on public.participants for update to anon using (false) with check (false);

create policy "participants_anon_deny_delete"
  on public.participants for delete to anon using (false);

create policy "responses_anon_deny_select"
  on public.responses for select to anon using (false);

create policy "responses_anon_deny_insert"
  on public.responses for insert to anon with check (false);

create policy "responses_anon_deny_update"
  on public.responses for update to anon using (false) with check (false);

create policy "responses_anon_deny_delete"
  on public.responses for delete to anon using (false);

revoke all on table public.participants from anon;
revoke all on table public.responses from anon;
grant select on table public.sessions to anon;
grant select on table public.questions to anon;
grant select on table public.options to anon;

-- -----------------------------------------------------------------------------
-- 3) Validation helper — rejects invalid draft before any write
-- -----------------------------------------------------------------------------
create or replace function public.ldna_validate_draft(p_draft jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_rating numeric;
  v_key text;
  v_val numeric;
  v_n integer;
  v_open text;
  v_allowed text[];
  v_expected_values text[] := array[
    'v_speed_accuracy',
    'v_freedom_control',
    'v_experiment_predictability',
    'v_team_individual',
    'v_openness_diplomacy',
    'v_client_efficiency',
    'v_long_short',
    'v_standard_flex'
  ];
begin
  if p_draft is null or jsonb_typeof(p_draft) <> 'object' then
    raise exception 'INVALID_DRAFT';
  end if;

  -- beliefs: 1–4, known codes, ratings 1–5 only for selected
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'beliefs';

  v_n := jsonb_array_length(coalesce(p_draft->'beliefs'->'selected', '[]'::jsonb));
  if v_n < 1 or v_n > 4 then
    raise exception 'INVALID_BELIEFS';
  end if;

  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'beliefs'->'selected', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_BELIEFS_OPTION';
    end if;
    if not ((p_draft->'beliefs'->'ratings') ? v_code) then
      raise exception 'INVALID_BELIEFS_RATING';
    end if;
    begin
      v_rating := (p_draft->'beliefs'->'ratings'->>v_code)::numeric;
    exception when others then
      raise exception 'INVALID_BELIEFS_RATING';
    end;
    if v_rating is null or v_rating <> trunc(v_rating) or v_rating < 1 or v_rating > 5 then
      raise exception 'INVALID_BELIEFS_RATING';
    end if;
  end loop;

  -- ratings keys must be subset of selected
  for v_key in
    select key from jsonb_each(coalesce(p_draft->'beliefs'->'ratings', '{}'::jsonb))
  loop
    if not exists (
      select 1
      from jsonb_array_elements_text(coalesce(p_draft->'beliefs'->'selected', '[]'::jsonb)) s(code)
      where s.code = v_key
    ) then
      raise exception 'INVALID_BELIEFS_RATING_ORPHAN';
    end if;
  end loop;

  -- worldview preferred: 1–2
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'worldview';

  v_n := jsonb_array_length(coalesce(p_draft->'worldview'->'preferred', '[]'::jsonb));
  if v_n < 1 or v_n > 2 then
    raise exception 'INVALID_WORLDVIEW_PREFERRED';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'worldview'->'preferred', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_WORLDVIEW_PREFERRED_OPTION';
    end if;
  end loop;

  -- worldview current: 1–2
  v_n := jsonb_array_length(coalesce(p_draft->'worldview'->'current', '[]'::jsonb));
  if v_n < 1 or v_n > 2 then
    raise exception 'INVALID_WORLDVIEW_CURRENT';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'worldview'->'current', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_WORLDVIEW_CURRENT_OPTION';
    end if;
  end loop;

  -- values: all expected pairs, 1–7 integers
  if jsonb_typeof(coalesce(p_draft->'values', 'null'::jsonb)) <> 'object' then
    raise exception 'INVALID_VALUES';
  end if;

  foreach v_key in array v_expected_values
  loop
    if not ((p_draft->'values') ? v_key) then
      raise exception 'INVALID_VALUES_MISSING';
    end if;
    begin
      v_val := (p_draft->'values'->>v_key)::numeric;
    exception when others then
      raise exception 'INVALID_VALUES_RANGE';
    end;
    if v_val is null or v_val <> trunc(v_val) or v_val < 1 or v_val > 7 then
      raise exception 'INVALID_VALUES_RANGE';
    end if;
  end loop;

  -- no extra value keys
  for v_key in select key from jsonb_each(p_draft->'values')
  loop
    if not (v_key = any (v_expected_values)) then
      raise exception 'INVALID_VALUES_EXTRA';
    end if;
  end loop;

  -- principles: 1–5 + ratings
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'principles';

  v_n := jsonb_array_length(coalesce(p_draft->'principles'->'selected', '[]'::jsonb));
  if v_n < 1 or v_n > 5 then
    raise exception 'INVALID_PRINCIPLES';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'principles'->'selected', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_PRINCIPLES_OPTION';
    end if;
    if not ((p_draft->'principles'->'ratings') ? v_code) then
      raise exception 'INVALID_PRINCIPLES_RATING';
    end if;
    begin
      v_rating := (p_draft->'principles'->'ratings'->>v_code)::numeric;
    exception when others then
      raise exception 'INVALID_PRINCIPLES_RATING';
    end;
    if v_rating is null or v_rating <> trunc(v_rating) or v_rating < 1 or v_rating > 5 then
      raise exception 'INVALID_PRINCIPLES_RATING';
    end if;
  end loop;
  for v_key in select key from jsonb_each(coalesce(p_draft->'principles'->'ratings', '{}'::jsonb))
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(coalesce(p_draft->'principles'->'selected', '[]'::jsonb)) s(code)
      where s.code = v_key
    ) then
      raise exception 'INVALID_PRINCIPLES_RATING_ORPHAN';
    end if;
  end loop;

  -- rules: 1–6 + ratings
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'rules';

  v_n := jsonb_array_length(coalesce(p_draft->'rules'->'selected', '[]'::jsonb));
  if v_n < 1 or v_n > 6 then
    raise exception 'INVALID_RULES';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'rules'->'selected', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_RULES_OPTION';
    end if;
    if not ((p_draft->'rules'->'ratings') ? v_code) then
      raise exception 'INVALID_RULES_RATING';
    end if;
    begin
      v_rating := (p_draft->'rules'->'ratings'->>v_code)::numeric;
    exception when others then
      raise exception 'INVALID_RULES_RATING';
    end;
    if v_rating is null or v_rating <> trunc(v_rating) or v_rating < 1 or v_rating > 5 then
      raise exception 'INVALID_RULES_RATING';
    end if;
  end loop;
  for v_key in select key from jsonb_each(coalesce(p_draft->'rules'->'ratings', '{}'::jsonb))
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(coalesce(p_draft->'rules'->'selected', '[]'::jsonb)) s(code)
      where s.code = v_key
    ) then
      raise exception 'INVALID_RULES_RATING_ORPHAN';
    end if;
  end loop;

  -- skills: exactly 5 + ratings
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'skills';

  v_n := jsonb_array_length(coalesce(p_draft->'skills'->'selected', '[]'::jsonb));
  if v_n <> 5 then
    raise exception 'INVALID_SKILLS';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'skills'->'selected', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_SKILLS_OPTION';
    end if;
    if not ((p_draft->'skills'->'ratings') ? v_code) then
      raise exception 'INVALID_SKILLS_RATING';
    end if;
    begin
      v_rating := (p_draft->'skills'->'ratings'->>v_code)::numeric;
    exception when others then
      raise exception 'INVALID_SKILLS_RATING';
    end;
    if v_rating is null or v_rating <> trunc(v_rating) or v_rating < 1 or v_rating > 5 then
      raise exception 'INVALID_SKILLS_RATING';
    end if;
  end loop;
  for v_key in select key from jsonb_each(coalesce(p_draft->'skills'->'ratings', '{}'::jsonb))
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(coalesce(p_draft->'skills'->'selected', '[]'::jsonb)) s(code)
      where s.code = v_key
    ) then
      raise exception 'INVALID_SKILLS_RATING_ORPHAN';
    end if;
  end loop;

  -- habits: 1–6 + ratings
  select coalesce(array_agg(o.code), array[]::text[])
  into v_allowed
  from public.options o
  join public.questions q on q.id = o.question_id
  where q.code = 'habits';

  v_n := jsonb_array_length(coalesce(p_draft->'habits'->'selected', '[]'::jsonb));
  if v_n < 1 or v_n > 6 then
    raise exception 'INVALID_HABITS';
  end if;
  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'habits'->'selected', '[]'::jsonb))
  loop
    if not (v_code = any (v_allowed)) then
      raise exception 'INVALID_HABITS_OPTION';
    end if;
    if not ((p_draft->'habits'->'ratings') ? v_code) then
      raise exception 'INVALID_HABITS_RATING';
    end if;
    begin
      v_rating := (p_draft->'habits'->'ratings'->>v_code)::numeric;
    exception when others then
      raise exception 'INVALID_HABITS_RATING';
    end;
    if v_rating is null or v_rating <> trunc(v_rating) or v_rating < 1 or v_rating > 5 then
      raise exception 'INVALID_HABITS_RATING';
    end if;
  end loop;
  for v_key in select key from jsonb_each(coalesce(p_draft->'habits'->'ratings', '{}'::jsonb))
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(coalesce(p_draft->'habits'->'selected', '[]'::jsonb)) s(code)
      where s.code = v_key
    ) then
      raise exception 'INVALID_HABITS_RATING_ORPHAN';
    end if;
  end loop;

  -- open answer
  v_open := trim(coalesce(p_draft->>'openAnswer', ''));
  if v_open = '' or char_length(v_open) < 1 or char_length(v_open) > 300 then
    raise exception 'INVALID_OPEN_ANSWER';
  end if;
end;
$$;

revoke all on function public.ldna_validate_draft(jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4) Helper: expand draft jsonb → response rows (only after validation)
-- -----------------------------------------------------------------------------
create or replace function public.ldna_expand_draft_to_responses(
  p_participant_id uuid,
  p_draft jsonb
) returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_rating numeric;
  v_key text;
  v_block text;
  v_selected jsonb;
  v_ratings jsonb;
  v_open text;
begin
  delete from public.responses where participant_id = p_participant_id;

  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'beliefs'->'selected', '[]'::jsonb))
  loop
    insert into public.responses (participant_id, question_code, option_code, response_type)
    values (p_participant_id, 'beliefs', v_code, 'selection');

    v_rating := (p_draft->'beliefs'->'ratings'->>v_code)::numeric;
    insert into public.responses (participant_id, question_code, option_code, response_type, numeric_value)
    values (p_participant_id, 'beliefs', v_code, 'reality_rating', v_rating);
  end loop;

  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'worldview'->'preferred', '[]'::jsonb))
  loop
    insert into public.responses (participant_id, question_code, option_code, response_type)
    values (p_participant_id, 'worldview', v_code, 'worldview_preferred');
  end loop;

  for v_code in
    select jsonb_array_elements_text(coalesce(p_draft->'worldview'->'current', '[]'::jsonb))
  loop
    insert into public.responses (participant_id, question_code, option_code, response_type)
    values (p_participant_id, 'worldview', v_code, 'worldview_current');
  end loop;

  for v_key, v_rating in
    select key, value::text::numeric
    from jsonb_each(coalesce(p_draft->'values', '{}'::jsonb))
  loop
    insert into public.responses (participant_id, question_code, option_code, response_type, numeric_value)
    values (p_participant_id, 'values', v_key, 'bipolar', v_rating);
  end loop;

  foreach v_block in array array['principles', 'rules', 'skills', 'habits']
  loop
    v_selected := coalesce(p_draft->v_block->'selected', '[]'::jsonb);
    v_ratings := coalesce(p_draft->v_block->'ratings', '{}'::jsonb);

    for v_code in select jsonb_array_elements_text(v_selected)
    loop
      insert into public.responses (participant_id, question_code, option_code, response_type)
      values (p_participant_id, v_block, v_code, 'selection');

      v_rating := (v_ratings->>v_code)::numeric;
      insert into public.responses (participant_id, question_code, option_code, response_type, numeric_value)
      values (p_participant_id, v_block, v_code, 'reality_rating', v_rating);
    end loop;
  end loop;

  v_open := trim(coalesce(p_draft->>'openAnswer', ''));
  insert into public.responses (participant_id, question_code, option_code, response_type, text_value)
  values (p_participant_id, 'open_preserve', null, 'open_text', v_open);
end;
$$;

revoke all on function public.ldna_expand_draft_to_responses(uuid, jsonb) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5) RPC: start_participant
-- -----------------------------------------------------------------------------
create or replace function public.start_participant(
  p_session_code text,
  p_name text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_name text;
  v_participant public.participants%rowtype;
begin
  v_name := trim(coalesce(p_name, ''));
  if v_name = '' or char_length(v_name) > 80 then
    raise exception 'INVALID_NAME';
  end if;

  select * into v_session
  from public.sessions
  where code = p_session_code and active = true;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  insert into public.participants (session_id, name, draft, current_step)
  values (v_session.id, v_name, '{}'::jsonb, 0)
  returning * into v_participant;

  return jsonb_build_object(
    'participantId', v_participant.id,
    'accessToken', v_participant.access_token,
    'sessionCode', v_session.code,
    'sessionName', v_session.name
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 6) RPC: get_participant
-- -----------------------------------------------------------------------------
create or replace function public.get_participant(
  p_access_token uuid,
  p_session_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_p public.participants%rowtype;
begin
  if p_access_token is null then
    return null;
  end if;

  select * into v_session
  from public.sessions
  where code = p_session_code and active = true;

  if not found then
    return null;
  end if;

  select * into v_p
  from public.participants
  where access_token = p_access_token
    and session_id = v_session.id;

  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'id', v_p.id,
    'session_id', v_p.session_id,
    'name', v_p.name,
    'access_token', v_p.access_token,
    'current_step', v_p.current_step,
    'draft', coalesce(v_p.draft, '{}'::jsonb),
    'completed_at', v_p.completed_at,
    'created_at', v_p.created_at,
    'sessionCode', v_session.code,
    'sessionName', v_session.name
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 7) RPC: save_draft
-- -----------------------------------------------------------------------------
create or replace function public.save_draft(
  p_access_token uuid,
  p_draft jsonb,
  p_step integer
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p public.participants%rowtype;
  v_step integer;
begin
  select * into v_p
  from public.participants
  where access_token = p_access_token;

  if not found then
    raise exception 'PARTICIPANT_NOT_FOUND';
  end if;

  if v_p.completed_at is not null then
    raise exception 'ALREADY_COMPLETED';
  end if;

  v_step := greatest(0, least(coalesce(p_step, 0), 13));

  update public.participants
  set draft = coalesce(p_draft, '{}'::jsonb),
      current_step = v_step
  where id = v_p.id
    and completed_at is null;

  return jsonb_build_object('participantId', v_p.id);
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) RPC: submit_survey
-- -----------------------------------------------------------------------------
create or replace function public.submit_survey(
  p_access_token uuid,
  p_draft jsonb
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p public.participants%rowtype;
begin
  select * into v_p
  from public.participants
  where access_token = p_access_token
  for update;

  if not found then
    raise exception 'PARTICIPANT_NOT_FOUND';
  end if;

  if v_p.completed_at is not null then
    return jsonb_build_object('participantId', v_p.id, 'alreadyCompleted', true);
  end if;

  -- Full validation BEFORE any write. On exception → transaction rolls back.
  perform public.ldna_validate_draft(p_draft);

  perform public.ldna_expand_draft_to_responses(v_p.id, p_draft);

  update public.participants
  set draft = coalesce(p_draft, '{}'::jsonb),
      current_step = 13,
      completed_at = now()
  where id = v_p.id
    and completed_at is null;

  return jsonb_build_object('participantId', v_p.id, 'alreadyCompleted', false);
end;
$$;

-- -----------------------------------------------------------------------------
-- 9) RPC: get_personal_result
-- -----------------------------------------------------------------------------
create or replace function public.get_personal_result(
  p_access_token uuid,
  p_participant_id uuid
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_p public.participants%rowtype;
  v_session public.sessions%rowtype;
  v_responses jsonb;
begin
  select * into v_p
  from public.participants
  where id = p_participant_id
    and access_token = p_access_token;

  if not found then
    raise exception 'FORBIDDEN';
  end if;

  if v_p.completed_at is null then
    raise exception 'NOT_COMPLETED';
  end if;

  select * into v_session
  from public.sessions
  where id = v_p.session_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', r.id,
    'participant_id', r.participant_id,
    'question_code', r.question_code,
    'option_code', r.option_code,
    'response_type', r.response_type,
    'numeric_value', r.numeric_value,
    'text_value', r.text_value
  ) order by r.created_at), '[]'::jsonb)
  into v_responses
  from public.responses r
  where r.participant_id = v_p.id;

  return jsonb_build_object(
    'participantId', v_p.id,
    'name', v_p.name,
    'sessionCode', v_session.code,
    'responses', v_responses
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- 10) RPC: get_team_dna
-- -----------------------------------------------------------------------------
create or replace function public.get_team_dna(
  p_session_code text
) returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session public.sessions%rowtype;
  v_total integer;
  v_result jsonb;
  v_top_beliefs jsonb;
  v_top_principles jsonb;
  v_worldviews jsonb;
  v_values jsonb;
  v_top_gaps jsonb;
  v_polarizing jsonb;
  v_open_answers jsonb;
begin
  select * into v_session
  from public.sessions
  where code = p_session_code and active = true;

  if not found then
    raise exception 'SESSION_NOT_FOUND';
  end if;

  select count(*)::integer into v_total
  from public.participants
  where session_id = v_session.id
    and completed_at is not null;

  -- Small sample: no detailed aggregates, no open answers
  if v_total < 3 then
    return jsonb_build_object(
      'sessionCode', v_session.code,
      'sessionName', v_session.name,
      'completedCount', v_total,
      'insufficientSample', true,
      'topBeliefs', '[]'::jsonb,
      'topPrinciples', '[]'::jsonb,
      'worldviews', '[]'::jsonb,
      'values', '[]'::jsonb,
      'topGaps', '[]'::jsonb,
      'polarizing', '[]'::jsonb,
      'openAnswers', '[]'::jsonb
    );
  end if;

  create temporary table if not exists _ldna_completed (
    participant_id uuid primary key
  ) on commit drop;
  delete from _ldna_completed;

  insert into _ldna_completed (participant_id)
  select id
  from public.participants
  where session_id = v_session.id
    and completed_at is not null;

  select coalesce(jsonb_agg(item order by (item->>'share')::float desc, (item->>'selectedCount')::int desc), '[]'::jsonb)
  into v_top_beliefs
  from (
    select jsonb_build_object(
      'optionCode', o.code,
      'label', o.label,
      'selectedCount', cnt.selected_count,
      'totalCompleted', v_total,
      'share', cnt.selected_count::float / v_total
    ) as item
    from public.options o
    join public.questions q on q.id = o.question_id and q.code = 'beliefs'
    cross join lateral (
      select count(distinct r.participant_id)::integer as selected_count
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      where r.question_code = 'beliefs'
        and r.option_code = o.code
        and r.response_type = 'selection'
    ) cnt
    order by cnt.selected_count desc, o.sort_order
    limit 5
  ) s;

  select coalesce(jsonb_agg(item order by (item->>'share')::float desc, (item->>'selectedCount')::int desc), '[]'::jsonb)
  into v_top_principles
  from (
    select jsonb_build_object(
      'optionCode', o.code,
      'label', o.label,
      'selectedCount', cnt.selected_count,
      'totalCompleted', v_total,
      'share', cnt.selected_count::float / v_total
    ) as item
    from public.options o
    join public.questions q on q.id = o.question_id and q.code = 'principles'
    cross join lateral (
      select count(distinct r.participant_id)::integer as selected_count
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      where r.question_code = 'principles'
        and r.option_code = o.code
        and r.response_type = 'selection'
    ) cnt
    order by cnt.selected_count desc, o.sort_order
    limit 5
  ) s;

  select coalesce(jsonb_agg(item order by sort_order), '[]'::jsonb)
  into v_worldviews
  from (
    select
      o.sort_order,
      jsonb_build_object(
        'optionCode', o.code,
        'label', o.label,
        'preferredCount', pref.cnt,
        'currentCount', cur.cnt,
        'preferredShare', pref.cnt::float / v_total,
        'currentShare', cur.cnt::float / v_total
      ) as item
    from public.options o
    join public.questions q on q.id = o.question_id and q.code = 'worldview'
    cross join lateral (
      select count(distinct r.participant_id)::integer as cnt
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      where r.question_code = 'worldview'
        and r.option_code = o.code
        and r.response_type = 'worldview_preferred'
    ) pref
    cross join lateral (
      select count(distinct r.participant_id)::integer as cnt
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      where r.question_code = 'worldview'
        and r.option_code = o.code
        and r.response_type = 'worldview_current'
    ) cur
  ) w;

  -- values: mean / min / max / sd only (NO individual values array)
  select coalesce(jsonb_agg(item order by sort_order), '[]'::jsonb)
  into v_values
  from (
    select
      o.sort_order,
      jsonb_build_object(
        'optionCode', o.code,
        'leftLabel', coalesce(o.left_label, ''),
        'rightLabel', coalesce(o.right_label, ''),
        'mean', coalesce(stats.mean, 0),
        'min', coalesce(stats.min_v, 0),
        'max', coalesce(stats.max_v, 0),
        'sd', coalesce(stats.sd, 0)
      ) as item
    from public.options o
    join public.questions q on q.id = o.question_id and q.code = 'values'
    cross join lateral (
      select
        avg(r.numeric_value::float) as mean,
        min(r.numeric_value::float) as min_v,
        max(r.numeric_value::float) as max_v,
        case
          when count(*) < 2 then 0::float
          else sqrt(avg(power(r.numeric_value::float - a.mean_all, 2)))
        end as sd
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      cross join lateral (
        select avg(r2.numeric_value::float) as mean_all
        from public.responses r2
        join _ldna_completed c2 on c2.participant_id = r2.participant_id
        where r2.question_code = 'values'
          and r2.option_code = o.code
          and r2.response_type = 'bipolar'
      ) a
      where r.question_code = 'values'
        and r.option_code = o.code
        and r.response_type = 'bipolar'
    ) stats
  ) v;

  select coalesce(jsonb_agg(item order by (item->>'gap')::float desc), '[]'::jsonb)
  into v_top_gaps
  from (
    select jsonb_build_object(
      'category', q.code,
      'optionCode', o.code,
      'label', o.label,
      'selectedCount', freq.selected_count,
      'selectionShare', freq.share,
      'importanceScore', freq.importance,
      'realityScore', reality.avg_rating,
      'gap', freq.importance - reality.avg_rating
    ) as item
    from public.options o
    join public.questions q on q.id = o.question_id
      and q.code in ('beliefs', 'principles', 'rules', 'skills', 'habits')
    cross join lateral (
      select
        count(distinct r.participant_id)::integer as selected_count,
        count(distinct r.participant_id)::float / v_total as share,
        1 + 4 * (count(distinct r.participant_id)::float / v_total) as importance
      from public.responses r
      join _ldna_completed c on c.participant_id = r.participant_id
      where r.question_code = q.code
        and r.option_code = o.code
        and r.response_type = 'selection'
    ) freq
    cross join lateral (
      select avg(rr.numeric_value::float) as avg_rating
      from public.responses rr
      join _ldna_completed c on c.participant_id = rr.participant_id
      where rr.question_code = q.code
        and rr.option_code = o.code
        and rr.response_type = 'reality_rating'
        and exists (
          select 1
          from public.responses sel
          where sel.participant_id = rr.participant_id
            and sel.question_code = q.code
            and sel.option_code = o.code
            and sel.response_type = 'selection'
        )
    ) reality
    where freq.selected_count > 0
      and reality.avg_rating is not null
    order by (freq.importance - reality.avg_rating) desc
    limit 8
  ) g;

  select coalesce(jsonb_agg(item order by (item->>'metric')::float desc), '[]'::jsonb)
  into v_polarizing
  from (
    (
      select jsonb_build_object(
        'kind', 'value',
        'category', 'values',
        'optionCode', val->>'optionCode',
        'label', (val->>'leftLabel') || ' ↔ ' || (val->>'rightLabel'),
        'reason', 'Здесь позиции заметно различаются',
        'metric', (val->>'sd')::float
      ) as item
      from jsonb_array_elements(v_values) val
      where (val->>'sd')::float > 0
    )
    union all
    (
      select jsonb_build_object(
        'kind', 'selection',
        'category', q.code,
        'optionCode', o.code,
        'label', o.label,
        'reason', 'Здесь нет выраженного консенсуса',
        'metric', 1 - abs(freq.share - 0.5)
      )
      from public.options o
      join public.questions q on q.id = o.question_id
        and q.code in ('beliefs', 'principles', 'rules', 'skills', 'habits')
      cross join lateral (
        select count(distinct r.participant_id)::float / v_total as share
        from public.responses r
        join _ldna_completed c on c.participant_id = r.participant_id
        where r.question_code = q.code
          and r.option_code = o.code
          and r.response_type = 'selection'
      ) freq
      where freq.share >= 0.35 and freq.share <= 0.65
    )
    union all
    (
      select jsonb_build_object(
        'kind', 'worldview',
        'category', 'worldview',
        'optionCode', w->>'optionCode',
        'label', w->>'label',
        'reason', 'Эту тему стоит обсудить',
        'metric', 1 - abs((w->>'preferredShare')::float - 0.5)
      )
      from jsonb_array_elements(v_worldviews) w
      where (w->>'preferredShare')::float >= 0.35
        and (w->>'preferredShare')::float <= 0.65
    )
  ) p;

  select coalesce(jsonb_agg(elem order by (elem->>'metric')::float desc), '[]'::jsonb)
  into v_polarizing
  from (
    select elem
    from jsonb_array_elements(coalesce(v_polarizing, '[]'::jsonb)) elem
    order by (elem->>'metric')::float desc
    limit 5
  ) x;

  -- openAnswers only when sample >= 3 (already gated above)
  select coalesce(jsonb_agg(to_jsonb(trim(r.text_value)) order by r.created_at), '[]'::jsonb)
  into v_open_answers
  from public.responses r
  join _ldna_completed c on c.participant_id = r.participant_id
  where r.response_type = 'open_text'
    and r.text_value is not null
    and trim(r.text_value) <> '';

  v_result := jsonb_build_object(
    'sessionCode', v_session.code,
    'sessionName', v_session.name,
    'completedCount', v_total,
    'insufficientSample', false,
    'topBeliefs', coalesce(v_top_beliefs, '[]'::jsonb),
    'topPrinciples', coalesce(v_top_principles, '[]'::jsonb),
    'worldviews', coalesce(v_worldviews, '[]'::jsonb),
    'values', coalesce(v_values, '[]'::jsonb),
    'topGaps', coalesce(v_top_gaps, '[]'::jsonb),
    'polarizing', coalesce(v_polarizing, '[]'::jsonb),
    'openAnswers', coalesce(v_open_answers, '[]'::jsonb)
  );

  return v_result;
end;
$$;

-- -----------------------------------------------------------------------------
-- 11) GRANT / REVOKE on RPCs
-- -----------------------------------------------------------------------------
revoke all on function public.ldna_validate_draft(jsonb) from public, anon, authenticated;
revoke all on function public.ldna_expand_draft_to_responses(uuid, jsonb) from public, anon, authenticated;

revoke all on function public.start_participant(text, text) from public;
revoke all on function public.get_participant(uuid, text) from public;
revoke all on function public.save_draft(uuid, jsonb, integer) from public;
revoke all on function public.submit_survey(uuid, jsonb) from public;
revoke all on function public.get_personal_result(uuid, uuid) from public;
revoke all on function public.get_team_dna(text) from public;

grant execute on function public.start_participant(text, text) to anon, authenticated;
grant execute on function public.get_participant(uuid, text) to anon, authenticated;
grant execute on function public.save_draft(uuid, jsonb, integer) to anon, authenticated;
grant execute on function public.submit_survey(uuid, jsonb) to anon, authenticated;
grant execute on function public.get_personal_result(uuid, uuid) to anon, authenticated;
grant execute on function public.get_team_dna(text) to anon, authenticated;
